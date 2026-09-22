"""
Finance Receivable ViewSets
Money coming INTO SACCO from members for 15 service categories.
Supports approval workflows and partial payments.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Sum
from decimal import Decimal

from .models import Receivable, ReceivablePayment
from .serializers import (
    ReceivableListSerializer,
    ReceivableDetailSerializer,
    ReceivableCreateUpdateSerializer,
    ReceivablePaymentSerializer,
    ReceivablePaymentCreateSerializer,
)
from accounts.permissions import IsHROrReadOnly
from approval.utils import auto_create_approval_request


class ReceivableViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Receivable management (money coming INTO SACCO).

    List: Returns lightweight receivable list
    Retrieve: Returns detailed receivable with payment history
    Create: Validates and creates new receivable
    Update: Modify draft receivables only

    Custom Actions:
    - approve: POST /receivables/{id}/approve/ - Approve receivable
    - reject: POST /receivables/{id}/reject/ - Reject receivable
    - record_payment: POST /receivables/{id}/record-payment/ - Record partial payment
    - mark_paid: POST /receivables/{id}/mark-paid/ - Mark as fully paid

    Filters:
    - member: Filter by member ID
    - category: Filter by service category
    - status: Filter by status
    - priority: Filter by priority
    - is_recurring: Filter recurring payments
    - is_overdue: Filter overdue receivables
    - transaction_date: Date range filtering
    - due_date: Date range filtering
    - Search: receivable_number, member name/number, description
    - Ordering: transaction_date, due_date, amount, created_at
    """
    queryset = Receivable.objects.select_related(
        'member',
        'submitted_by',
        'submitted_by__user',
        'approved_by',
        'approved_by__user'
    ).prefetch_related('payments')

    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'receivable_number',
        'member__member_number',
        'member__first_name',
        'member__last_name',
        'description',
        'notes',
        'loan_account_number',
        'share_certificate_number',
    ]

    # Filter configuration
    filterset_fields = [
        'member',
        'category',
        'status',
        'priority',
        'is_recurring',
        'submitted_by',
        'approved_by',
    ]

    # Ordering configuration
    ordering_fields = [
        'transaction_date',
        'due_date',
        'collection_date',
        'amount',
        'outstanding_balance',
        'created_at',
        'updated_at',
    ]
    ordering = ['-transaction_date', '-created_at']  # Latest first

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return ReceivableListSerializer
        elif self.action == 'retrieve':
            return ReceivableDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ReceivableCreateUpdateSerializer
        return ReceivableDetailSerializer

    def get_queryset(self):
        """
        Filter receivables based on user role.
        Finance staff see all receivables.
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

            # Submitted receivables (submitted by user)
            return queryset.filter(submitted_by=employee)

        return queryset.none()

    def perform_create(self, serializer):
        """
        Create receivable and generate receivable number.
        """
        # Get the next receivable number
        last_receivable = Receivable.objects.order_by('-created_at').first()
        if last_receivable and last_receivable.receivable_number:
            try:
                last_number = int(last_receivable.receivable_number.split('-')[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1

        receivable_number = f"RCV-{timezone.now().year}-{next_number:06d}"

        # Get submitted_by employee
        submitted_by = serializer.validated_data.get('submitted_by')
        if not submitted_by and hasattr(self.request.user, 'employee_profile'):
            submitted_by = self.request.user.employee_profile

        # Save with generated number and pending status
        receivable = serializer.save(
            receivable_number=receivable_number,
            status='pending',  # Auto-submit to pending
            created_by=self.request.user,
        )

        # Auto-create approval request
        if submitted_by:
            auto_create_approval_request(
                content_object=receivable,
                requester=submitted_by,
                workflow_type='receivable',
                priority=receivable.priority if hasattr(receivable, 'priority') else 'medium',
                amount=receivable.amount
            )

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """
        Approve a receivable.
        Changes status to 'approved' and records approval details.

        Request Body:
        {
            "notes": "Approved - member in good standing"
        }
        """
        receivable = self.get_object()
        user = request.user

        # Validation
        if receivable.status not in ['draft', 'pending']:
            return Response(
                {'error': f'Cannot approve receivable with status: {receivable.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission to approve
        if not self._can_approve(user):
            return Response(
                {'error': 'You do not have permission to approve receivables.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update receivable status
        receivable.status = 'approved'
        receivable.approved_by = user.employee_profile if hasattr(user, 'employee_profile') else None
        receivable.approved_date = timezone.now()
        receivable.modified_by = user
        receivable.save()

        # Add notes if provided
        if request.data.get('notes'):
            receivable.notes = (receivable.notes or '') + f"\n[Approved] {request.data['notes']}"
            receivable.save()

        # Serialize and return
        serializer = ReceivableDetailSerializer(receivable, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """
        Reject a receivable.

        Request Body:
        {
            "reason": "Member account suspended"
        }
        """
        receivable = self.get_object()
        user = request.user

        # Validation
        if receivable.status not in ['draft', 'pending']:
            return Response(
                {'error': f'Cannot reject receivable with status: {receivable.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission to reject
        if not self._can_approve(user):
            return Response(
                {'error': 'You do not have permission to reject receivables.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Require rejection reason
        reason = request.data.get('reason')
        if not reason:
            return Response(
                {'error': 'Rejection reason is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update receivable status
        receivable.status = 'rejected'
        receivable.rejection_reason = reason
        receivable.modified_by = user
        receivable.save()

        serializer = ReceivableDetailSerializer(receivable, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        """
        Record a partial payment for receivable.
        Updates amount_paid and outstanding_balance.

        Request Body:
        {
            "payment_date": "2026-09-16",
            "amount_paid": 500.00,
            "payment_method": "Mobile Money",
            "reference_number": "ECOCASH123456",
            "notes": "Partial payment via EcoCash"
        }
        """
        receivable = self.get_object()
        user = request.user

        # Validation - receivable must be approved
        if receivable.status != 'approved':
            return Response(
                {'error': 'Can only record payments for approved receivables.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create payment record
        payment_data = request.data.copy()
        payment_data['receivable'] = receivable.id
        payment_data['recorded_by'] = user.id

        payment_serializer = ReceivablePaymentCreateSerializer(data=payment_data)
        if not payment_serializer.is_valid():
            return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Save payment
        payment = payment_serializer.save()

        # Update receivable amounts
        receivable.amount_paid += payment.amount_paid
        receivable.outstanding_balance = receivable.amount - receivable.amount_paid

        # Update status based on payment
        if receivable.outstanding_balance == 0:
            receivable.status = 'paid'
        elif receivable.amount_paid > 0:
            receivable.status = 'partially-paid'

        receivable.modified_by = user
        receivable.save()

        # Return updated receivable
        serializer = ReceivableDetailSerializer(receivable, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        """
        Mark receivable as fully paid.
        Records final payment to complete the receivable.

        Request Body:
        {
            "payment_date": "2026-09-16",
            "payment_method": "Cash",
            "reference_number": "CASH-001",
            "notes": "Final payment - cash"
        }
        """
        receivable = self.get_object()
        user = request.user

        # Validation
        if receivable.status == 'paid':
            return Response(
                {'error': 'Receivable is already marked as paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if receivable.status != 'approved' and receivable.status != 'partially-paid':
            return Response(
                {'error': 'Can only mark approved or partially-paid receivables as paid.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate remaining amount
        remaining_amount = receivable.outstanding_balance

        if remaining_amount == 0:
            # Already paid, just update status
            receivable.status = 'paid'
            receivable.modified_by = user
            receivable.save()
        else:
            # Record final payment
            payment_data = {
                'receivable': receivable.id,
                'payment_date': request.data.get('payment_date', timezone.now().date()),
                'amount_paid': remaining_amount,
                'payment_method': request.data.get('payment_method', 'Cash'),
                'reference_number': request.data.get('reference_number', ''),
                'notes': request.data.get('notes', 'Final payment'),
                'recorded_by': user.id,
            }

            payment_serializer = ReceivablePaymentCreateSerializer(data=payment_data)
            if payment_serializer.is_valid():
                payment_serializer.save()

                # Update receivable
                receivable.amount_paid = receivable.amount
                receivable.outstanding_balance = Decimal('0.00')
                receivable.status = 'paid'
                receivable.modified_by = user
                receivable.save()
            else:
                return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReceivableDetailSerializer(receivable, context={'request': request})
        return Response(serializer.data)

    # ============================================================================
    # HELPER METHODS
    # ============================================================================

    def _can_approve(self, user):
        """
        Check if user has permission to approve/reject receivables.
        Finance staff and HR managers can approve.
        """
        if user.is_staff or user.is_superuser:
            return True

        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile
            if employee.role in ['finance_manager', 'finance_employee', 'hr_manager']:
                return True

        return False


class ReceivablePaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Receivable Payment management.

    List: Returns payment records
    Retrieve: Returns detailed payment information
    Create: Record new payment

    Filters:
    - receivable: Filter by receivable ID
    - payment_date: Date range filtering
    - payment_method: Filter by payment method
    - Search: payment_number, reference_number, notes
    - Ordering: payment_date, amount_paid, created_at
    """
    queryset = ReceivablePayment.objects.select_related(
        'receivable',
        'receivable__member',
        'recorded_by'
    )
    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'payment_number',
        'reference_number',
        'notes',
        'receivable__receivable_number',
        'receivable__member__member_number',
    ]

    # Filter configuration
    filterset_fields = [
        'receivable',
        'payment_method',
    ]

    # Ordering configuration
    ordering_fields = [
        'payment_date',
        'amount_paid',
        'created_at',
    ]
    ordering = ['-payment_date', '-created_at']  # Latest first

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['create', 'update']:
            return ReceivablePaymentCreateSerializer
        return ReceivablePaymentSerializer

    def perform_create(self, serializer):
        """
        Create payment and generate payment number.
        Update receivable amounts.
        """
        # Get the next payment number
        last_payment = ReceivablePayment.objects.order_by('-created_at').first()
        if last_payment and last_payment.payment_number:
            try:
                last_number = int(last_payment.payment_number.split('-')[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1

        payment_number = f"PMT-{timezone.now().year}-{next_number:06d}"

        # Save payment
        payment = serializer.save(payment_number=payment_number)

        # Update receivable amounts
        receivable = payment.receivable
        receivable.amount_paid += payment.amount_paid
        receivable.outstanding_balance = receivable.amount - receivable.amount_paid

        # Update status based on payment
        if receivable.outstanding_balance == 0:
            receivable.status = 'paid'
        elif receivable.amount_paid > 0:
            receivable.status = 'partially-paid'

        receivable.modified_by = self.request.user
        receivable.save()
