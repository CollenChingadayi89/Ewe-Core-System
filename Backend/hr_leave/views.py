"""
Leave Management ViewSets
Supports ledger-based leave tracking with immutable transactions.
Zimbabwe Labour Act compliant.
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models import (
    LeavePolicy,
    LeaveTransaction,
    LeaveRequest,
    PublicHoliday,
    WorkingHours,
    LeaveYearConfig,
    LeaveNotificationSettings,
    LeaveCalendarSettings
)
from .serializers import (
    LeavePolicySerializer,
    LeaveTransactionSerializer,
    LeaveRequestListSerializer,
    LeaveRequestDetailSerializer,
    LeaveRequestCreateSerializer,
    PublicHolidaySerializer,
    WorkingHoursSerializer,
    LeaveYearConfigSerializer,
    LeaveNotificationSettingsSerializer,
    LeaveCalendarSettingsSerializer,
)
from accounts.permissions import IsHROrReadOnly
from approval.utils import auto_create_approval_request


class LeavePolicyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Leave Policy management.

    List/Retrieve: Returns leave policies with full configuration
    Create/Update: Restricted to HR only

    Filters:
    - is_active: Filter by active status
    - leave_type: Filter by leave type (annual, sick, maternity, etc.)
    - is_statutory: Filter statutory leaves
    - is_paid: Filter paid/unpaid leaves
    - Search: code, display_name, description
    - Ordering: code, leave_type, annual_entitlement_days, created_at
    """
    queryset = LeavePolicy.objects.all()
    serializer_class = LeavePolicySerializer
    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = ['code', 'display_name', 'description', 'statutory_reference']

    # Filter configuration
    filterset_fields = [
        'is_active',
        'leave_type',
        'is_statutory',
        'is_paid',
        'pay_status',
        'accrual_method',
        'requires_documentation',
        'allow_carry_forward',
    ]

    # Ordering configuration
    ordering_fields = [
        'code',
        'leave_type',
        'display_name',
        'annual_entitlement_days',
        'created_at',
        'updated_at',
    ]
    ordering = ['leave_type', 'code']  # Default ordering

    def get_queryset(self):
        """Only show active policies by default unless filtering"""
        queryset = super().get_queryset()

        # If no explicit is_active filter provided, show only active
        if 'is_active' not in self.request.query_params:
            queryset = queryset.filter(is_active=True)

        return queryset


class LeaveTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Leave Transaction ledger (READ-ONLY).

    Transactions are IMMUTABLE once created.
    Balance calculations are derived from transaction history.

    List: Returns transactions with employee and leave type info
    Retrieve: Returns detailed transaction information

    Filters:
    - employee: Filter by employee ID
    - leave_policy: Filter by leave policy ID
    - transaction_type: Filter by transaction type
    - transaction_date: Date range filtering
    - Search: transaction_number, employee name, notes
    - Ordering: transaction_date, created_at, days
    """
    queryset = LeaveTransaction.objects.select_related(
        'employee',
        'employee__user',
        'employee__department',
        'leave_policy',
        'leave_request',
        'processed_by'
    )
    serializer_class = LeaveTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'transaction_number',
        'employee__first_name',
        'employee__last_name',
        'employee__employee_number',
        'notes',
        'reference_number',
    ]

    # Filter configuration
    filterset_fields = [
        'employee',
        'leave_policy',
        'transaction_type',
        'leave_request',
    ]

    # Ordering configuration
    ordering_fields = [
        'transaction_date',
        'created_at',
        'days',
        'balance_after',
    ]
    ordering = ['-transaction_date', '-created_at']  # Latest first

    def get_queryset(self):
        """
        Filter transactions based on user role.
        Regular employees only see their own transactions.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admins and HR see all transactions
        if user.is_staff or user.is_superuser:
            return queryset

        if hasattr(user, 'employee_profile'):
            if user.employee_profile.role in ['hr_manager', 'hr_employee']:
                return queryset

            # Regular employees only see their own transactions
            return queryset.filter(employee=user.employee_profile)

        return queryset.none()

    @action(detail=False, methods=['get'], url_path='balance')
    def get_balance(self, request):
        """
        Calculate employee's current leave balance for a specific policy.

        Query params:
        - employee: Employee ID
        - leave_policy: Leave Policy ID

        Response:
        {
            "total_accrued": 30.0,
            "total_used": 8.0,
            "total_pending": 5.0,
            "available_balance": 17.0
        }
        """
        employee_id = request.query_params.get('employee')
        policy_id = request.query_params.get('leave_policy')

        if not employee_id or not policy_id:
            return Response(
                {'error': 'employee and leave_policy parameters required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate balance from transactions
        transactions = LeaveTransaction.objects.filter(
            employee_id=employee_id,
            leave_policy_id=policy_id
        )

        total_accrued = sum(
            t.days for t in transactions
            if t.transaction_type in ['accrual', 'adjustment', 'carryforward', 'cancellation_reversal']
        )

        total_used = sum(
            abs(t.days) for t in transactions
            if t.transaction_type in ['usage', 'approval_reservation']
        )

        # Get pending future leave (approved but not yet taken)
        pending_requests = LeaveRequest.objects.filter(
            employee_id=employee_id,
            leave_policy_id=policy_id,
            status='approved',
            start_date__gt=timezone.now().date()
        )
        total_pending = sum(Decimal(str(r.working_days_count)) for r in pending_requests)

        available_balance = Decimal(str(total_accrued)) - Decimal(str(total_used)) - total_pending

        return Response({
            'total_accrued': float(total_accrued),
            'total_used': float(total_used),
            'total_pending': float(total_pending),
            'available_balance': float(available_balance)
        })

    @action(detail=False, methods=['post'], url_path='create-transaction')
    def create_transaction(self, request):
        """
        Create a single leave accrual or adjustment transaction.
        Only HR/Admin can create transactions.

        POST Body:
        {
            "employee": "uuid",
            "leave_policy": "uuid",
            "transaction_type": "accrual" | "adjustment",
            "days": 30.0,
            "transaction_date": "2026-01-01" (optional),
            "reference_number": "" (optional),
            "notes": "Annual leave allocation 2026"
        }
        """
        from hr_leave.serializers import LeaveTransactionCreateSerializer, LeaveTransactionSerializer

        # Permission check: Only HR/Admin
        user = request.user
        if not (user.is_staff or user.is_superuser):
            if not hasattr(user, 'employee_profile') or \
               user.employee_profile.role not in ['hr_manager', 'hr_employee']:
                return Response(
                    {'error': 'Only HR staff can create leave transactions'},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = LeaveTransactionCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            transaction = serializer.save()
            response_serializer = LeaveTransactionSerializer(transaction)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='bulk-accrual')
    def bulk_accrual(self, request):
        """
        Create accrual transactions for multiple employees at once.
        Only HR/Admin can perform bulk operations.

        POST Body:
        {
            "employee_ids": ["uuid1", "uuid2", "uuid3"],
            "leave_policy": "uuid",
            "days": 30.0,
            "transaction_date": "2026-01-01" (optional),
            "notes": "Annual leave allocation 2026"
        }

        Returns:
        {
            "success": true,
            "created_count": 15,
            "transactions": [...],
            "errors": []
        }
        """
        from hr_leave.serializers import BulkAccrualSerializer, LeaveTransactionSerializer
        from hr_employee.models import Employee
        from django.utils import timezone
        from datetime import datetime

        # Permission check: Only HR/Admin
        user = request.user
        if not (user.is_staff or user.is_superuser):
            if not hasattr(user, 'employee_profile') or \
               user.employee_profile.role not in ['hr_manager', 'hr_employee']:
                return Response(
                    {'error': 'Only HR staff can perform bulk operations'},
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = BulkAccrualSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        employee_ids = data['employee_ids']
        leave_policy = data['leave_policy']
        days = data['days']
        transaction_date = data.get('transaction_date', timezone.now().date())
        notes = data['notes']

        created_transactions = []
        errors = []

        # Get all employees
        employees = Employee.objects.filter(id__in=employee_ids)

        for employee in employees:
            try:
                # Calculate current balance
                existing_transactions = LeaveTransaction.objects.filter(
                    employee=employee,
                    leave_policy=leave_policy
                ).order_by('-transaction_date', '-created_at')

                if existing_transactions.exists():
                    balance_after = existing_transactions.first().balance_after + days
                else:
                    balance_after = days

                # Generate transaction number
                year = datetime.now().year
                count = LeaveTransaction.objects.filter(
                    transaction_number__startswith=f'LT-{year}'
                ).count() + 1
                transaction_number = f'LT-{year}-{count:06d}'

                # Create transaction
                transaction = LeaveTransaction.objects.create(
                    transaction_number=transaction_number,
                    employee=employee,
                    leave_policy=leave_policy,
                    transaction_type='accrual',
                    transaction_date=transaction_date,
                    days=days,
                    balance_after=balance_after,
                    notes=notes,
                    processed_by=request.user
                )

                created_transactions.append(transaction)

            except Exception as e:
                errors.append({
                    'employee_id': str(employee.id),
                    'employee_name': employee.get_full_name(),
                    'error': str(e)
                })

        # Serialize created transactions
        response_serializer = LeaveTransactionSerializer(created_transactions, many=True)

        return Response({
            'success': len(errors) == 0,
            'created_count': len(created_transactions),
            'transactions': response_serializer.data,
            'errors': errors
        }, status=status.HTTP_201_CREATED if len(errors) == 0 else status.HTTP_207_MULTI_STATUS)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Leave Request management.

    List: Returns lightweight leave request list
    Retrieve: Returns detailed request with approval chain and transactions
    Create: Validates and creates new leave request
    Update: Modify draft requests only

    Custom Actions:
    - approve: POST /leave-requests/{id}/approve/ - Approve leave request
    - reject: POST /leave-requests/{id}/reject/ - Reject leave request
    - cancel: POST /leave-requests/{id}/cancel/ - Cancel leave request
    - calculate_working_days: POST /leave-requests/calculate-working-days/ - Calculate working days

    Filters:
    - employee: Filter by employee ID
    - leave_policy: Filter by leave policy ID
    - status: Filter by status (pending, approved, rejected, cancelled)
    - priority: Filter by priority
    - start_date: Date range filtering
    - is_emergency_leave: Filter emergency leaves
    - Search: request_number, employee name, reason
    - Ordering: start_date, created_at, priority, status
    """
    queryset = LeaveRequest.objects.select_related(
        'employee',
        'employee__user',
        'employee__department',
        'employee__designation',
        'leave_policy',
        'current_approver',
        'cancelled_by'
    ).prefetch_related('ledger_transactions')

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = [
        'request_number',
        'employee__first_name',
        'employee__last_name',
        'employee__employee_number',
        'reason',
        'special_leave_trigger',
    ]

    # Filter configuration
    filterset_fields = [
        'employee',
        'leave_policy',
        'status',
        'priority',
        'is_emergency_leave',
        'is_half_day',
        'current_approver',
    ]

    # Ordering configuration
    ordering_fields = [
        'start_date',
        'end_date',
        'created_at',
        'priority',
        'status',
        'total_days',
    ]
    ordering = ['-created_at']  # Latest first

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return LeaveRequestListSerializer
        elif self.action == 'retrieve':
            return LeaveRequestDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return LeaveRequestCreateSerializer
        return LeaveRequestDetailSerializer

    def get_queryset(self):
        """
        Filter leave requests based on user role.
        Employees see their own requests.
        Managers see their team's requests.
        HR sees all requests.
        """
        queryset = super().get_queryset()
        user = self.request.user

        # Admins and HR see all requests
        if user.is_staff or user.is_superuser:
            return queryset

        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile

            # HR sees all
            if employee.role in ['hr_manager', 'hr_employee']:
                return queryset

            # Managers see their team's requests + their own
            if employee.role in ['manager', 'department_head']:
                return queryset.filter(
                    Q(employee=employee) |  # Own requests
                    Q(employee__reports_to=employee) |  # Direct reports
                    Q(current_approver=employee)  # Pending their approval
                )

            # Regular employees only see their own requests
            return queryset.filter(employee=employee)

        return queryset.none()

    def perform_create(self, serializer):
        """
        Create leave request and generate request number.
        Calculate working days based on policy.
        """
        # Get the next request number
        last_request = LeaveRequest.objects.order_by('-created_at').first()
        if last_request and last_request.request_number:
            try:
                last_number = int(last_request.request_number.split('-')[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1

        request_number = f"LR-{timezone.now().year}-{next_number:06d}"

        # Calculate working days
        leave_policy = serializer.validated_data['leave_policy']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        is_half_day = serializer.validated_data.get('is_half_day', False)

        working_days = self._calculate_working_days(
            start_date,
            end_date,
            leave_policy,
            is_half_day
        )

        # Calculate total calendar days
        total_days = (end_date - start_date).days + 1

        # Get employee's current balance
        employee = serializer.validated_data['employee']
        balance_before = self._get_employee_leave_balance(employee, leave_policy)

        # Validate negative balance (if configured)
        leave_year_config = LeaveYearConfig.get_config()
        balance_after_request = balance_before - working_days

        if balance_after_request < 0:
            # Check if negative balance is allowed
            if not leave_year_config.allow_negative_balance:
                raise serializers.ValidationError({
                    'leave_policy': f'Insufficient leave balance. Available: {balance_before} days, Requested: {working_days} days.'
                })

            # Check if exceeds max negative balance limit
            if abs(balance_after_request) > leave_year_config.max_negative_balance_days:
                raise serializers.ValidationError({
                    'leave_policy': f'Request exceeds maximum negative balance limit of {leave_year_config.max_negative_balance_days} days. '
                                   f'Available: {balance_before} days, Requested: {working_days} days, '
                                   f'Would result in: {balance_after_request} days.'
                })

        # Save with calculated fields
        leave_request = serializer.save(
            request_number=request_number,
            total_days=Decimal(str(total_days)),
            working_days_count=working_days,
            balance_before_request=balance_before,
            status='pending',  # Auto-submit to pending
            created_by=self.request.user,
        )

        # Auto-create approval request
        auto_create_approval_request(
            content_object=leave_request,
            requester=employee,
            workflow_type='leave',
            priority=leave_request.priority if hasattr(leave_request, 'priority') else 'medium',
            amount=None  # Leave requests don't have amounts
        )

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """
        Approve a leave request.
        Creates ledger transaction to deduct leave balance.

        Request Body:
        {
            "notes": "Approved - adequate coverage arranged"
        }
        """
        leave_request = self.get_object()
        user = request.user

        # Validation
        if leave_request.status != 'pending':
            return Response(
                {'error': f'Cannot approve request with status: {leave_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission to approve
        if not self._can_approve(user, leave_request):
            return Response(
                {'error': 'You do not have permission to approve this request.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update leave request status
        leave_request.status = 'approved'
        leave_request.modified_by = user
        leave_request.save()

        # Create ledger transaction (deduct leave balance)
        self._create_leave_transaction(
            employee=leave_request.employee,
            leave_policy=leave_request.leave_policy,
            transaction_type='usage',
            days=-leave_request.working_days_count,  # Negative for usage
            leave_request=leave_request,
            notes=request.data.get('notes', 'Leave request approved'),
            processed_by=user
        )

        # Serialize and return
        serializer = LeaveRequestDetailSerializer(leave_request, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """
        Reject a leave request.

        Request Body:
        {
            "notes": "Rejected - insufficient staffing during this period"
        }
        """
        leave_request = self.get_object()
        user = request.user

        # Validation
        if leave_request.status != 'pending':
            return Response(
                {'error': f'Cannot reject request with status: {leave_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission to reject
        if not self._can_approve(user, leave_request):
            return Response(
                {'error': 'You do not have permission to reject this request.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Update leave request status
        leave_request.status = 'rejected'
        leave_request.modified_by = user
        leave_request.cancellation_reason = request.data.get('notes', 'Request rejected')
        leave_request.save()

        serializer = LeaveRequestDetailSerializer(leave_request, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Cancel a leave request.
        If already approved, creates reversal transaction.

        Request Body:
        {
            "reason": "Plans changed - no longer need leave"
        }
        """
        leave_request = self.get_object()
        user = request.user

        # Only employee or HR can cancel
        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile
            is_owner = employee.id == leave_request.employee.id
            is_hr = employee.role in ['hr_manager', 'hr_employee']

            if not (is_owner or is_hr or user.is_staff):
                return Response(
                    {'error': 'Only the employee or HR can cancel leave requests.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        elif not user.is_staff:
            return Response(
                {'error': 'You do not have permission to cancel this request.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Cannot cancel rejected requests
        if leave_request.status == 'rejected':
            return Response(
                {'error': 'Cannot cancel a rejected request.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If approved, create reversal transaction
        if leave_request.status == 'approved':
            self._create_leave_transaction(
                employee=leave_request.employee,
                leave_policy=leave_request.leave_policy,
                transaction_type='cancellation_reversal',
                days=leave_request.working_days_count,  # Positive to restore balance
                leave_request=leave_request,
                notes=request.data.get('reason', 'Leave request cancelled'),
                processed_by=user
            )

        # Update leave request
        leave_request.status = 'cancelled'
        leave_request.cancellation_reason = request.data.get('reason', 'Cancelled by user')
        leave_request.cancelled_at = timezone.now()
        leave_request.cancelled_by = user
        leave_request.modified_by = user
        leave_request.save()

        serializer = LeaveRequestDetailSerializer(leave_request, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='calculate-working-days')
    def calculate_working_days(self, request):
        """
        Calculate working days for a leave period.

        Request Body:
        {
            "start_date": "2026-09-20",
            "end_date": "2026-09-24",
            "leave_policy_id": "uuid",
            "is_half_day": false
        }

        Response:
        {
            "start_date": "2026-09-20",
            "end_date": "2026-09-24",
            "total_days": 5,
            "working_days": 3.5,
            "weekends_excluded": 2,
            "public_holidays_excluded": 0
        }
        """
        # Validate input
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        leave_policy_id = request.data.get('leave_policy_id')
        is_half_day = request.data.get('is_half_day', False)

        if not all([start_date_str, end_date_str, leave_policy_id]):
            return Response(
                {'error': 'start_date, end_date, and leave_policy_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            leave_policy = LeavePolicy.objects.get(id=leave_policy_id)
        except (ValueError, LeavePolicy.DoesNotExist) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate working days
        working_days = self._calculate_working_days(start_date, end_date, leave_policy, is_half_day)
        total_days = (end_date - start_date).days + 1

        # Count weekends and holidays (for informational purposes)
        weekends_count = 0
        holidays_count = 0

        if not leave_policy.counts_weekends_in_leave:
            current_date = start_date
            while current_date <= end_date:
                if current_date.weekday() in [5, 6]:  # Saturday = 5, Sunday = 6
                    weekends_count += 1
                current_date += timedelta(days=1)

        if not leave_policy.counts_public_holidays_in_leave:
            public_holidays = PublicHoliday.objects.filter(
                date__gte=start_date,
                date__lte=end_date,
                is_active=True
            )
            holidays_count = public_holidays.count()

        return Response({
            'start_date': start_date_str,
            'end_date': end_date_str,
            'total_days': total_days,
            'working_days': float(working_days),
            'weekends_excluded': weekends_count if not leave_policy.counts_weekends_in_leave else 0,
            'public_holidays_excluded': holidays_count if not leave_policy.counts_public_holidays_in_leave else 0,
            'policy_counts_weekends': leave_policy.counts_weekends_in_leave,
            'policy_counts_holidays': leave_policy.counts_public_holidays_in_leave,
        })

    # ============================================================================
    # HELPER METHODS
    # ============================================================================

    def _calculate_working_days(self, start_date, end_date, leave_policy, is_half_day=False):
        """
        Calculate working days based on leave policy configuration.
        Excludes weekends and public holidays per policy settings.
        """
        if is_half_day:
            return Decimal('0.5')

        # Start with calendar days
        total_days = (end_date - start_date).days + 1
        working_days = Decimal(str(total_days))

        # Exclude weekends if policy says so
        if not leave_policy.counts_weekends_in_leave:
            weekend_days = 0
            current_date = start_date
            while current_date <= end_date:
                if current_date.weekday() in [5, 6]:  # Saturday = 5, Sunday = 6
                    weekend_days += 1
                current_date += timedelta(days=1)
            working_days -= Decimal(str(weekend_days))

        # Exclude public holidays if policy says so
        if not leave_policy.counts_public_holidays_in_leave:
            public_holidays = PublicHoliday.objects.filter(
                date__gte=start_date,
                date__lte=end_date,
                is_active=True
            )
            # Don't double-count holidays that fall on weekends
            holiday_count = 0
            for holiday in public_holidays:
                if leave_policy.counts_weekends_in_leave or holiday.date.weekday() not in [5, 6]:
                    holiday_count += 1
            working_days -= Decimal(str(holiday_count))

        return max(working_days, Decimal('0'))  # Ensure non-negative

    def _get_employee_leave_balance(self, employee, leave_policy):
        """
        Calculate employee's current leave balance from ledger transactions.
        """
        transactions = LeaveTransaction.objects.filter(
            employee=employee,
            leave_policy=leave_policy
        )

        # Sum all accruals (positive)
        total_accrued = sum(
            t.days for t in transactions
            if t.transaction_type in ['accrual', 'adjustment', 'carryforward', 'cancellation_reversal']
        )

        # Sum all usage (negative values in ledger)
        total_used = sum(
            abs(t.days) for t in transactions
            if t.transaction_type in ['usage', 'approval_reservation']
        )

        return Decimal(str(total_accrued)) - Decimal(str(total_used))

    def _can_approve(self, user, leave_request):
        """
        Check if user has permission to approve/reject the leave request.
        HR staff and the current approver can approve.
        """
        if user.is_staff or user.is_superuser:
            return True

        if hasattr(user, 'employee_profile'):
            employee = user.employee_profile

            # HR can approve all
            if employee.role in ['hr_manager', 'hr_employee']:
                return True

            # Current approver can approve
            if leave_request.current_approver and employee.id == leave_request.current_approver.id:
                return True

            # Manager can approve their direct reports' requests
            if leave_request.employee.reports_to and employee.id == leave_request.employee.reports_to.id:
                return True

        return False

    def _create_leave_transaction(self, employee, leave_policy, transaction_type, days,
                                   leave_request, notes, processed_by):
        """
        Create an immutable leave ledger transaction.
        """
        # Get next transaction number
        last_transaction = LeaveTransaction.objects.order_by('-created_at').first()
        if last_transaction and last_transaction.transaction_number:
            try:
                last_number = int(last_transaction.transaction_number.split('-')[-1])
                next_number = last_number + 1
            except (ValueError, IndexError):
                next_number = 1
        else:
            next_number = 1

        transaction_number = f"LT-{timezone.now().year}-{next_number:06d}"

        # Calculate new balance
        current_balance = self._get_employee_leave_balance(employee, leave_policy)
        new_balance = current_balance + Decimal(str(days))

        # Create transaction
        LeaveTransaction.objects.create(
            transaction_number=transaction_number,
            employee=employee,
            leave_policy=leave_policy,
            transaction_type=transaction_type,
            transaction_date=timezone.now().date(),
            days=days,
            balance_after=new_balance,
            leave_request=leave_request,
            notes=notes,
            processed_by=processed_by,
        )


class PublicHolidayViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Public Holiday management.

    Used for leave day calculations.

    Filters:
    - is_active: Filter by active status
    - is_recurring: Filter recurring holidays
    - date: Date range filtering
    - Search: name, notes
    - Ordering: date, name, created_at
    """
    queryset = PublicHoliday.objects.all()
    serializer_class = PublicHolidaySerializer
    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = ['name', 'notes']

    # Filter configuration
    filterset_fields = ['is_active', 'is_recurring']

    # Ordering configuration
    ordering_fields = ['date', 'name', 'created_at']
    ordering = ['date']  # Default ordering

    def get_queryset(self):
        """Only show active holidays by default unless filtering"""
        queryset = super().get_queryset()

        # If no explicit is_active filter provided, show only active
        if 'is_active' not in self.request.query_params:
            queryset = queryset.filter(is_active=True)

        return queryset


class WorkingHoursViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Working Hours configuration.

    Used for leave day calculations.

    Filters:
    - is_active: Filter by active status
    - is_default: Filter default configuration
    - Search: name
    - Ordering: name, created_at
    """
    queryset = WorkingHours.objects.all()
    serializer_class = WorkingHoursSerializer
    permission_classes = [permissions.IsAuthenticated, IsHROrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Search configuration
    search_fields = ['name']

    # Filter configuration
    filterset_fields = ['is_active', 'is_default']

    # Ordering configuration
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['-is_default', 'name']  # Default first

    def get_queryset(self):
        """Only show active configurations by default unless filtering"""
        queryset = super().get_queryset()

        # If no explicit is_active filter provided, show only active
        if 'is_active' not in self.request.query_params:
            queryset = queryset.filter(is_active=True)

        return queryset


class LeaveYearConfigViewSet(viewsets.ViewSet):
    """
    ViewSet for Leave Year Configuration (Singleton).

    This is a singleton model - only one configuration exists system-wide.

    Actions:
    - GET /api/leave-year-config/ - Retrieve current configuration
    - PUT /api/leave-year-config/ - Update configuration (HR only)
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get the singleton leave year configuration"""
        config = LeaveYearConfig.get_config()
        serializer = LeaveYearConfigSerializer(config)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """
        Update the singleton leave year configuration.
        Only HR users can update configuration.
        """
        # Check HR permission
        if not (request.user.is_staff or hasattr(request.user, 'employee_profile') and
                request.user.employee_profile.department and
                'HR' in request.user.employee_profile.department.name.upper()):
            return Response(
                {'detail': 'Only HR can update leave year configuration.'},
                status=status.HTTP_403_FORBIDDEN
            )

        config = LeaveYearConfig.get_config()
        serializer = LeaveYearConfigSerializer(config, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeaveNotificationSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet for Leave Notification Settings (Singleton).

    This is a singleton model - only one configuration exists system-wide.

    Actions:
    - GET /api/leave-notification-settings/ - Retrieve current settings
    - PUT /api/leave-notification-settings/ - Update settings (HR only)
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get the singleton notification settings"""
        settings = LeaveNotificationSettings.get_settings()
        serializer = LeaveNotificationSettingsSerializer(settings)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """
        Update the singleton notification settings.
        Only HR users can update settings.
        """
        # Check HR permission
        if not (request.user.is_staff or hasattr(request.user, 'employee_profile') and
                request.user.employee_profile.department and
                'HR' in request.user.employee_profile.department.name.upper()):
            return Response(
                {'detail': 'Only HR can update notification settings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        settings = LeaveNotificationSettings.get_settings()
        serializer = LeaveNotificationSettingsSerializer(settings, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LeaveCalendarSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet for Leave Calendar Settings (Singleton).

    This is a singleton model - only one configuration exists system-wide.

    Actions:
    - GET /api/leave-calendar-settings/ - Retrieve current settings
    - PUT /api/leave-calendar-settings/ - Update settings (HR only)
    """
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get the singleton calendar settings"""
        settings = LeaveCalendarSettings.get_settings()
        serializer = LeaveCalendarSettingsSerializer(settings)
        return Response(serializer.data)

    def update(self, request, pk=None):
        """
        Update the singleton calendar settings.
        Only HR users can update settings.
        """
        # Check HR permission
        if not (request.user.is_staff or hasattr(request.user, 'employee_profile') and
                request.user.employee_profile.department and
                'HR' in request.user.employee_profile.department.name.upper()):
            return Response(
                {'detail': 'Only HR can update calendar settings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        settings = LeaveCalendarSettings.get_settings()
        serializer = LeaveCalendarSettingsSerializer(settings, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
