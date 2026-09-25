"""
Finance Payable ViewSets
Money going OUT from SACCO to vendors/suppliers.
Supports approval workflows and payment tracking.
"""

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Exists, OuterRef, Prefetch, Q
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend

from accounts.permissions import IsFinanceOrCreateOnly
from approval.models import ApprovalRequest

from .models import Vendor, Payable, PayableInstallment
from .permissions import PayablePermission, get_employee
from .serializers import (
    VendorListSerializer,
    VendorDetailSerializer,
    VendorCreateUpdateSerializer,
    PayableListSerializer,
    PayableDetailSerializer,
    PayableCreateUpdateSerializer,
    MarkPaidSerializer,
    RescheduleSerializer,
)
from .services import (
    attach_procurement_installments,
    generate_payable_number,
    payable_is_editable,
    record_payment,
    reschedule_payable,
    submit_for_approval,
    sync_approval_request,
)


class VendorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Vendor management.

    List: Returns lightweight vendor list with payables count
    Retrieve: Returns detailed vendor with banking details and statistics
    Create: Validates and creates new vendor
    Update: Modify vendor information

    Filters:
    - vendor_type: Filter by vendor type
    - is_active: Filter active/inactive vendors
    - city: Filter by city
    - province: Filter by province
    - Search: vendor_code, company_name, email, contact_person
    - Ordering: vendor_code, company_name, created_at
    """
    queryset = Vendor.objects.all()
    # Anyone can add a vendor (e.g. while raising a payable); only Finance can edit/delete
    permission_classes = [permissions.IsAuthenticated, IsFinanceOrCreateOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'vendor_code',
        'company_name',
        'contact_person',
        'email',
        'phone',
        'tax_id',
    ]

    # Filter configuration
    filterset_fields = [
        'vendor_type',
        'is_active',
        'city',
        'province',
        'country',
    ]

    # Ordering configuration
    ordering_fields = [
        'vendor_code',
        'company_name',
        'created_at',
        'updated_at',
    ]
    ordering = ['company_name']  # Default alphabetical

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return VendorListSerializer
        elif self.action == 'retrieve':
            return VendorDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return VendorCreateUpdateSerializer
        return VendorDetailSerializer

    def get_queryset(self):
        """
        Filter vendors based on user role.
        Finance staff see all vendors.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admins and Finance staff see all
        if user.is_staff or user.is_superuser:
            return queryset

        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile

            # Finance managers see all
            if employee.role in ['finance_manager', 'finance_employee', 'hr_manager']:
                return queryset

            # Other employees see active vendors only
            return queryset.filter(is_active=True)

        return queryset.filter(is_active=True)

    def perform_create(self, serializer):
        """
        Create vendor and generate vendor code.
        """
        # Get the next vendor code
        last_vendor = Vendor.objects.order_by('-created_at').first()
        if last_vendor and last_vendor.vendor_code:
            try:
                last_number = int(last_vendor.vendor_code.split('-')[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1

        vendor_code = f"VND-{next_number:03d}"

        # Save with generated code
        serializer.save(
            vendor_code=vendor_code,
            created_by=self.request.user,
        )

    def create(self, request, *args, **kwargs):
        """Create a vendor and return its full details (including id and code) so clients can select it."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        detail = VendorDetailSerializer(serializer.instance, context=self.get_serializer_context())
        return Response(detail.data, status=status.HTTP_201_CREATED)


class PayableViewSet(viewsets.ModelViewSet):
    """
    Payables: money going OUT from the SACCO to vendors or to members.

    Approval and payment follow the payable approval workflow:
    - Approve / reject: via the linked approval request
      (POST /approval-requests/{id}/approve|reject/); each payable exposes `approval.id`.
    - mark_paid: POST /payables/{id}/mark-paid/ by the workflow's Pay-stage assignee.

    Any employee can raise a payable. Finance, HR managers and staff see all payables;
    other employees see the ones they submitted or are an approver on.
    """
    queryset = Payable.objects.select_related(
        'vendor', 'member', 'submitted_by', 'approved_by', 'paid_by'
    ).prefetch_related(
        Prefetch(
            'approval_requests',
            queryset=ApprovalRequest.objects.select_related('workflow', 'current_approver')
            .order_by('-created_at'),
            to_attr='prefetched_approvals',
        ),
        Prefetch(
            'installment_links',
            queryset=PayableInstallment.objects.select_related('installment__record__procurement'),
        ),
    )

    permission_classes = [PayablePermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    search_fields = [
        'payable_number',
        'invoice_number',
        'vendor__vendor_code',
        'vendor__company_name',
        'member__member_number',
        'member__first_name',
        'member__last_name',
        'description',
        'notes',
    ]
    filterset_fields = [
        'payee_type',
        'vendor',
        'member',
        'category',
        'currency',
        'status',
        'priority',
        'submitted_by',
    ]
    ordering_fields = [
        'invoice_date',
        'due_date',
        'collection_date',
        'amount',
        'total_amount',
        'created_at',
        'updated_at',
    ]
    ordering = ['-invoice_date', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PayableListSerializer
        if self.action in ['create', 'update', 'partial_update']:
            return PayableCreateUpdateSerializer
        return PayableDetailSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        employee = get_employee(self.request.user)
        context['employee_id'] = employee.id if employee else None
        return context

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.is_staff or user.is_superuser:
            return queryset

        employee = get_employee(user)
        if employee is None:
            return queryset.none()
        if employee.role in ['finance_manager', 'finance_employee', 'hr_manager']:
            return queryset

        # Submitted it, or is (or was) an approver in its workflow
        involved_in_approval = ApprovalRequest.objects.filter(
            content_type=ContentType.objects.get_for_model(Payable),
            object_id=OuterRef('pk'),
        ).filter(Q(current_approver=employee) | Q(approval_steps__approver=employee))
        return queryset.filter(Q(submitted_by=employee) | Exists(involved_in_approval))

    def _detail_response(self, payable_id, status_code=status.HTTP_200_OK):
        payable = self.get_queryset().get(pk=payable_id)
        serializer = PayableDetailSerializer(payable, context=self.get_serializer_context())
        return Response(serializer.data, status=status_code)

    def create(self, request, *args, **kwargs):
        employee = get_employee(request.user)
        if employee is None:
            return Response(
                {'error': 'Only employees can raise payables.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        installment_ids = serializer.validated_data.pop('procurement_installments', None)
        with transaction.atomic():
            payable = serializer.save(
                payable_number=generate_payable_number(),
                status='pending',
                submitted_by=employee,
                created_by=request.user,
                requested_collection_date=serializer.validated_data.get('collection_date'),
            )
            if installment_ids:
                attach_procurement_installments(payable, installment_ids)
            submit_for_approval(payable, employee)

        return self._detail_response(payable.id, status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        payable = self.get_object()
        if not payable_is_editable(payable):
            return Response(
                {'error': 'This payable can no longer be edited because approval has started.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(payable, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            payable = serializer.save(modified_by=request.user)
            sync_approval_request(payable)

        return self._detail_response(payable.id)

    def destroy(self, request, *args, **kwargs):
        payable = self.get_object()
        if not payable_is_editable(payable):
            return Response(
                {'error': 'This payable can no longer be deleted because approval has started.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='reschedule')
    def reschedule(self, request, pk=None):
        """
        The approver whose turn it is moves the payment/collection date.
        POST /payables/{id}/reschedule/  {"collection_date": "2026-10-15", "reason": "Funds available mid-month"}
        """
        payable = self.get_object()
        employee = get_employee(request.user)
        if employee is None:
            return Response({'error': 'Only employees can change payment dates.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = RescheduleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reschedule_payable(
            payable.id, employee, serializer.validated_data['collection_date'], serializer.validated_data['reason']
        )
        return self._detail_response(payable.id)

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        """
        Record payment and complete the workflow's Pay stage.
        Only the employee assigned to the Pay stage (whose turn it is) may do this.

        Request Body:
        {
            "paid_date": "2026-09-16",          (optional, defaults to today)
            "payment_method": "Bank Transfer",
            "payment_reference": "TXN-123456",  (optional)
            "notes": "Paid via FBC"             (optional)
        }
        """
        payable = self.get_object()
        employee = get_employee(request.user)
        if employee is None:
            return Response(
                {'error': 'Only employees can record payments.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = MarkPaidSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record_payment(payable.id, employee, serializer.validated_data)

        return self._detail_response(payable.id)
