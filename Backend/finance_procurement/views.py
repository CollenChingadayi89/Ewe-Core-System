import json

from django.core.files.storage import default_storage
from django.db import transaction
from django.http import FileResponse, Http404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from .models import ProcurementRequest
from .serializers import ProcurementRequestSerializer
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
        'requested_by__department', 'approved_by', 'vendor'
    )
    serializer_class = ProcurementRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['status', 'category', 'requested_by', 'current_approver', 'priority', 'vendor']
    search_fields = ['request_number', 'item_description', 'requested_by__first_name', 'requested_by__last_name']
    ordering_fields = ['request_date', 'total_amount', 'required_by_date', 'created_at']
    ordering = ['-request_date', '-created_at']

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
