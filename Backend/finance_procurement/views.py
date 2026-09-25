import json

from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Prefetch
from django.http import FileResponse, Http404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import is_finance_user
from approval.models import ApprovalRequest

from .models import ProcurementInstallment, ProcurementRecord, ProcurementRequest
from .records import award_quotation, generate_schedule, outstanding_installments, set_payment_terms
from .serializers import (
    OutstandingInstallmentSerializer,
    PaymentTermsSerializer,
    ProcurementRecordSerializer,
    ProcurementRequestSerializer,
)
from .services import (
    INLINE_CONTENT_TYPES,
    delete_stored_files,
    get_quotation_document_path,
    store_quotation_files,
    validate_quotation_uploads,
)
from approval.utils import auto_create_approval_request


class ProcurementRequestViewSet(viewsets.ModelViewSet):
    """ViewSet for ProcurementRequest model with approval workflow integration"""
    # select_related covers every FK the serializer reads, avoiding per-row queries on list
    queryset = ProcurementRequest.objects.select_related(
        'requested_by__department', 'approved_by', 'vendor', 'selected_by', 'record'
    ).prefetch_related(
        Prefetch(
            'approval_requests',
            queryset=ApprovalRequest.objects.select_related('workflow', 'current_approver').order_by('-created_at'),
            to_attr='prefetched_approvals',
        )
    )
    serializer_class = ProcurementRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['status', 'category', 'requested_by', 'current_approver', 'priority', 'vendor']
    search_fields = ['request_number', 'item_description', 'requested_by__first_name', 'requested_by__last_name']
    ordering_fields = ['request_date', 'total_amount', 'required_by_date', 'created_at']
    ordering = ['-request_date', '-created_at']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        employee = getattr(self.request.user, 'employee_profile', None)
        context['employee_id'] = employee.id if employee else None
        return context

    @action(detail=True, methods=['post'], url_path='award')
    def award(self, request, pk=None):
        """
        Final approver selects the winning quotation and gives final approval.
        POST /procurement-requests/{id}/award/  {quotation_index, reason, comments?}
        Completing the workflow creates the procurement record and notifies the requester.
        """
        procurement = self.get_object()
        employee = getattr(request.user, 'employee_profile', None)
        if employee is None:
            raise PermissionDenied('Only employees can approve procurement requests.')
        try:
            quotation_index = int(request.data.get('quotation_index'))
        except (TypeError, ValueError):
            raise ValidationError({'quotation_index': 'Select one of the quotations.'})

        award_quotation(
            procurement, employee, quotation_index,
            request.data.get('reason', ''), request.data.get('comments', ''),
        )
        return Response(self.get_serializer(self.get_queryset().get(pk=procurement.pk)).data)

    def create(self, request, *args, **kwargs):
        """
        Create a procurement request with its quotation documents, then auto-create
        the approval request.

        Expects multipart/form-data with:
          - payload: JSON string of the request fields (including quotations)
          - quotation_documents: one file per quotation, in the same order
        """
        data = self._parse_payload(request)
        files = request.FILES.getlist('quotation_documents')
        quotations = validate_quotation_uploads(data.get('quotations'), files)

        stored = store_quotation_files(files)
        try:
            with transaction.atomic():
                data['quotations'] = [
                    {**quotation, **meta} for quotation, meta in zip(quotations, stored)
                ]
                serializer = self.get_serializer(
                    data=data,
                    context={**self.get_serializer_context(), 'quotation_documents_attached': True},
                )
                serializer.is_valid(raise_exception=True)
                procurement = serializer.save()
                self._create_approval_request(request, procurement)
        except Exception:
            # Nothing was saved to the database, so the stored files are orphans
            delete_stored_files(stored)
            raise

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['get'], url_path=r'quotations/(?P<index>\d+)/document')
    def quotation_document(self, request, pk=None, index=None):
        """
        Stream a quotation document to an authenticated user who can access the request.
        GET /procurement-requests/{id}/quotations/{index}/document/
        """
        procurement = self.get_object()
        quotations = procurement.quotations or []
        position = int(index)

        if position >= len(quotations):
            raise Http404('Quotation not found')

        quotation = quotations[position]
        path = get_quotation_document_path(quotation)
        if not path or not default_storage.exists(path):
            raise Http404('No document is stored for this quotation')

        content_type = quotation.get('content_type') or 'application/octet-stream'
        response = FileResponse(
            default_storage.open(path, 'rb'),
            content_type=content_type,
            as_attachment=content_type not in INLINE_CONTENT_TYPES,
            filename=quotation.get('file_name') or path.rsplit('/', 1)[-1],
        )
        response['X-Content-Type-Options'] = 'nosniff'
        response['Cache-Control'] = 'private, no-store'
        return response

    @staticmethod
    def _parse_payload(request) -> dict:
        """Read request fields from the multipart 'payload' JSON part, or from a JSON body."""
        if 'payload' not in request.data:
            return dict(request.data)
        try:
            data = json.loads(request.data['payload'])
        except (TypeError, ValueError):
            raise ValidationError({'payload': 'Invalid JSON'})
        if not isinstance(data, dict):
            raise ValidationError({'payload': 'Must be a JSON object'})
        return data

    @staticmethod
    def _create_approval_request(request, procurement: ProcurementRequest) -> None:
        # Requests from users without an employee profile skip approval creation
        requester = getattr(request.user, 'employee_profile', None)
        if requester is None:
            return

        # Use 'procurement' workflow type (2-stage: manager + finance)
        auto_create_approval_request(
            content_object=procurement,
            requester=requester,
            workflow_type='procurement',
            priority=procurement.priority,
            amount=float(procurement.total_amount),
        )


class ProcurementRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    What the SACCO owes suppliers for approved procurements, with installment schedules
    and the payment ledger. Finance, HR managers and staff see all records; others see the
    records of procurements they requested.
    """
    serializer_class = ProcurementRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['vendor', 'status', 'currency']
    search_fields = ['record_number', 'procurement__request_number', 'procurement__item_description', 'vendor__company_name']
    ordering_fields = ['created_at', 'total_amount', 'first_due_date']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = ProcurementRecord.objects.select_related(
            'procurement__requested_by', 'vendor', 'terms_set_by'
        ).prefetch_related(
            Prefetch(
                'installments',
                queryset=ProcurementInstallment.objects.prefetch_related('payable_links__payable').order_by('sequence'),
            )
        )
        user = self.request.user
        employee = getattr(user, 'employee_profile', None)
        if is_finance_user(user) or (employee and employee.role == 'hr_manager'):
            return queryset
        if employee is None:
            return queryset.none()
        return queryset.filter(procurement__requested_by=employee)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['include_payments'] = self.action in ('retrieve', 'set_terms')
        return context

    @action(detail=True, methods=['post'], url_path='set-terms')
    def set_terms(self, request, pk=None):
        """Set payment terms and the installment schedule (requester or Finance)."""
        record = self.get_object()
        serializer = PaymentTermsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        set_payment_terms(record, request.user, serializer.validated_data)
        return Response(self.get_serializer(self.get_queryset().get(pk=record.pk)).data)

    @action(detail=False, methods=['post'], url_path='preview-schedule')
    def preview_schedule(self, request):
        """Schedule the given terms would produce, without saving (for the terms form)."""
        serializer = PaymentTermsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        rows = generate_schedule(
            data['total_amount'], data['deposit_amount'], data['installment_count'],
            data['frequency'], data['first_due_date'],
        )
        return Response([
            {'label': row['label'], 'due_date': row['due_date'], 'amount': f"{row['amount']:.2f}"}
            for row in rows
        ])

    @action(detail=False, methods=['get'], url_path='outstanding-installments')
    def outstanding(self, request):
        """
        Installments still owed to a vendor and not held by another open payable.
        GET /procurement-records/outstanding-installments/?vendor=<id>
        Any employee raising a payable can see these for the chosen vendor.
        """
        vendor_id = request.query_params.get('vendor')
        if not vendor_id:
            raise ValidationError({'vendor': 'Choose a vendor.'})
        installments = outstanding_installments(vendor_id)
        return Response(OutstandingInstallmentSerializer(installments, many=True).data)
