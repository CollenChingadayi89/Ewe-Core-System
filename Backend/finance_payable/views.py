"""
Finance Payable ViewSets
Money going OUT from SACCO to vendors/suppliers.
Supports approval workflows and payment tracking.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q

from .models import Vendor, Payable
from .serializers import (
    VendorListSerializer,
    VendorDetailSerializer,
    VendorCreateUpdateSerializer,
    PayableListSerializer,
    PayableDetailSerializer,
    PayableCreateUpdateSerializer,
)
from accounts.permissions import IsHROrReadOnly
from approval.utils import auto_create_approval_request


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
    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
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


class PayableViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payable management (money going OUT from SACCO).

    List: Returns lightweight payable list
    Retrieve: Returns detailed payable with vendor and approval info
    Create: Validates and creates new payable
    Update: Modify draft payables only

    Custom Actions:
    - approve: POST /payables/{id}/approve/ - Approve payable
    - reject: POST /payables/{id}/reject/ - Reject payable
    - mark_paid: POST /payables/{id}/mark-paid/ - Mark as paid

    Filters:
    - vendor: Filter by vendor ID
    - category: Filter by expense category
    - status: Filter by status
    - priority: Filter by priority
    - invoice_date: Date range filtering
    - due_date: Date range filtering
    - Search: payable_number, invoice_number, vendor name, description
    - Ordering: invoice_date, due_date, total_amount, created_at
    """
    queryset = Payable.objects.select_related(
        'vendor',
        'submitted_by',
        'submitted_by__user',
        'current_approver',
        'current_approver__user'
    )

    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'payable_number',
        'invoice_number',
        'vendor__vendor_code',
        'vendor__company_name',
        'description',
        'notes',
    ]

    # Filter configuration
    filterset_fields = [
        'vendor',
        'category',
        'status',
        'priority',
        'submitted_by',
        'current_approver',
    ]

    # Ordering configuration
    ordering_fields = [
        'invoice_date',
        'due_date',
        'collection_date',
        'amount',
        'total_amount',
        'created_at',
        'updated_at',
    ]
    ordering = ['-invoice_date', '-created_at']  # Latest first

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return PayableListSerializer
        elif self.action == 'retrieve':
            return PayableDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PayableCreateUpdateSerializer
        return PayableDetailSerializer

    def get_queryset(self):
        """
        Filter payables based on user role.
        Finance staff see all payables.
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

            # Employees see payables they submitted or need to approve
            return queryset.filter(
                Q(submitted_by=employee) | Q(current_approver=employee)
            )

        return queryset.none()

    def perform_create(self, serializer):
        """
        Create payable and generate payable number.
        """
        # Get the next payable number
        last_payable = Payable.objects.order_by('-created_at').first()
        if last_payable and last_payable.payable_number:
            try:
                last_number = int(last_payable.payable_number.split('-')[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1

        payable_number = f"PAY-{timezone.now().year}-{next_number:06d}"

        # Get submitted_by employee
        submitted_by = serializer.validated_data.get('submitted_by')
        if not submitted_by and hasattr(self.request.user, 'employee_profile'):
            submitted_by = self.request.user.employee_profile

        # Save with generated number and draft status
        payable = serializer.save(
            payable_number=payable_number,
            status='pending',  # Auto-submit to pending
            created_by=self.request.user,
        )

        # Auto-create approval request
        if submitted_by:
            auto_create_approval_request(
                content_object=payable,
                requester=submitted_by,
                workflow_type='payable',
                priority=payable.priority if hasattr(payable, 'priority') else 'medium',
                amount=payable.total_amount if hasattr(payable, 'total_amount') else payable.amount
            )

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """
        Approve a payable.
        Changes status to 'approved' and records approval details.

        Request Body:
        {
            "notes": "Approved - urgent payment"
        }
        """
        payable = self.get_object()
        user = request.user

        # Validation
        if payable.status not in ['draft', 'pending']:
            return Response(
                {'error': f'Cannot approve payable with status: {payable.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission to approve
        if not self._can_approve(user, payable):
            return Response(
                {'error': 'You do not have permission to approve this payable.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update payable status
        payable.status = 'approved'
        payable.approved_date = timezone.now()
        payable.modified_by = user
        payable.save()

        # Update approval chain
        if hasattr(user, 'employee_profile'):
            approval_step = {
                'approver_id': str(user.employee_profile.id),
                'approver_name': user.employee_profile.get_full_name(),
                'approved_at': timezone.now().isoformat(),
                'notes': request.data.get('notes', ''),
            }
            payable.approval_chain.append(approval_step)
            payable.save()

        # Add notes if provided
        if request.data.get('notes'):
            payable.notes = (payable.notes or '') + f"\n[Approved] {request.data['notes']}"
            payable.save()

        # Serialize and return
        serializer = PayableDetailSerializer(payable, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """
        Reject a payable.

        Request Body:
        {
            "reason": "Invoice does not match purchase order"
        }
        """
        payable = self.get_object()
        user = request.user

        # Validation
        if payable.status not in ['draft', 'pending']:
            return Response(
                {'error': f'Cannot reject payable with status: {payable.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission to reject
        if not self._can_approve(user, payable):
            return Response(
                {'error': 'You do not have permission to reject this payable.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Require rejection reason
        reason = request.data.get('reason')
        if not reason:
            return Response(
                {'error': 'Rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update payable status
        payable.status = 'rejected'
        payable.rejection_reason = reason
        payable.modified_by = user
        payable.save()

        # Update approval chain
        if hasattr(user, 'employee_profile'):
            approval_step = {
                'approver_id': str(user.employee_profile.id),
                'approver_name': user.employee_profile.get_full_name(),
                'rejected_at': timezone.now().isoformat(),
                'reason': reason,
            }
            payable.approval_chain.append(approval_step)
            payable.save()

        serializer = PayableDetailSerializer(payable, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        """
        Mark payable as fully paid.
        Records payment details.

        Request Body:
        {
            "paid_date": "2026-09-16",
            "payment_method": "Bank Transfer",
            "payment_reference": "TXN-123456",
            "notes": "Payment processed via FBC"
        }
        """
        payable = self.get_object()
        user = request.user

        # Validation
        if payable.status == 'paid':
            return Response(
                {'error': 'Payable is already marked as paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if payable.status != 'approved':
            return Response(
                {'error': 'Can only mark approved payables as paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission
        if not self._can_approve(user, payable):
            return Response(
                {'error': 'You do not have permission to mark this payable as paid.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update payable
        payable.status = 'paid'
        payable.paid_date = request.data.get('paid_date', timezone.now().date())
        payable.payment_method = request.data.get('payment_method', '')
        payable.payment_reference = request.data.get('payment_reference', '')
        payable.modified_by = user

        # Add payment notes
        if request.data.get('notes'):
            payable.notes = (payable.notes or '') + f"\n[Paid] {request.data['notes']}"

        payable.save()

        serializer = PayableDetailSerializer(payable, context={'request': request})
        return Response(serializer.data)

    # ============================================================================
    # HELPER METHODS
    # ============================================================================

    def _can_approve(self, user, payable):
        """
        Check if user has permission to approve/reject payables.
        Finance staff and current approver can approve.
        """
        if user.is_staff or user.is_superuser:
            return True

        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile

            # Finance managers can approve
            if employee.role in ['finance_manager', 'finance_employee', 'hr_manager']:
                return True

            # Current approver can approve
            if payable.current_approver and payable.current_approver.id == employee.id:
                return True

        return False
