"""
Leave Management Serializers
Supports ledger-based leave tracking with immutable transactions.
Zimbabwe Labour Act compliant.
"""

from rest_framework import serializers
from decimal import Decimal
from datetime import datetime, timedelta
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
from hr_employee.models import Employee


class LeavePolicySerializer(serializers.ModelSerializer):
    """
    Complete leave policy serializer with all configuration options.
    """
    days_per_year = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        source='annual_entitlement_days',
        read_only=True
    )

    class Meta:
        model = LeavePolicy
        fields = [
            'id',
            'code',
            'leave_type',
            'display_name',
            'description',
            # Statutory
            'is_statutory',
            'statutory_reference',
            # Payment
            'is_paid',
            'pay_status',
            # Accrual
            'accrual_method',
            'annual_entitlement_days',
            'days_per_year',
            'max_accumulation_days',
            # Eligibility
            'requires_minimum_service',
            'minimum_service_days',
            'available_during_probation',
            'gender_restriction',
            # Documentation
            'requires_documentation',
            'documentation_types',
            'documentation_mandatory',
            # Approval
            'requires_manager_approval',
            'requires_hr_approval',
            'requires_ceo_approval',
            'approval_levels',
            'auto_escalate_after_days',
            'allow_delegation',
            'allow_self_approval',
            # Calculation
            'counts_weekends_in_leave',
            'counts_public_holidays_in_leave',
            # Carryforward
            'allow_carry_forward',
            'carry_forward_max_days',
            'expires_at_year_end',
            'payout_on_termination',
            # Notice
            'minimum_notice_days',
            'minimum_notice_for_short_leave',
            # Additional
            'supports_half_days',
            'can_be_converted_from',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeaveTransactionSerializer(serializers.ModelSerializer):
    """
    Serializer for immutable leave ledger transactions.
    READ-ONLY - transactions cannot be modified once created.
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_number = serializers.CharField(source='employee.employee_number', read_only=True)
    leave_type_name = serializers.CharField(source='leave_policy.display_name', read_only=True)
    processed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveTransaction
        fields = [
            'id',
            'transaction_number',
            'employee',
            'employee_name',
            'employee_number',
            'leave_policy',
            'leave_type_name',
            'transaction_type',
            'transaction_date',
            'days',
            'balance_after',
            'leave_request',
            'reference_number',
            'notes',
            'processed_by',
            'processed_by_name',
            'created_at',
        ]
        # All fields read-only (immutable) - explicitly list all fields
        read_only_fields = [
            'id',
            'transaction_number',
            'employee',
            'employee_name',
            'employee_number',
            'leave_policy',
            'leave_type_name',
            'transaction_type',
            'transaction_date',
            'days',
            'balance_after',
            'leave_request',
            'reference_number',
            'notes',
            'processed_by',
            'processed_by_name',
            'created_at',
        ]

    def get_processed_by_name(self, obj):
        """Get name of user who processed this transaction"""
        if hasattr(obj.processed_by, 'employee_profile'):
            return obj.processed_by.employee_profile.get_full_name()
        return obj.processed_by.email


class LeaveTransactionCreateSerializer(serializers.Serializer):
    """
    Serializer for creating leave accrual/adjustment transactions.
    Used by HR to manually allocate or adjust leave balances.
    """
    employee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(),
        required=True
    )
    leave_policy = serializers.PrimaryKeyRelatedField(
        queryset=LeavePolicy.objects.all(),
        required=True
    )
    transaction_type = serializers.ChoiceField(
        choices=['accrual', 'adjustment'],
        required=True,
        help_text='accrual for initial allocation, adjustment for corrections'
    )
    days = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        required=True,
        help_text='Positive to add days, negative to deduct'
    )
    transaction_date = serializers.DateField(
        required=False,
        help_text='Defaults to today if not provided'
    )
    reference_number = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True
    )
    notes = serializers.CharField(
        required=True,
        help_text='Reason for this transaction (required for audit trail)'
    )

    def validate_days(self, value):
        """Validate days is not zero"""
        if value == 0:
            raise serializers.ValidationError('Days cannot be zero')
        return value

    def create(self, validated_data):
        """Create leave transaction and calculate balance"""
        from django.utils import timezone

        employee = validated_data['employee']
        leave_policy = validated_data['leave_policy']
        transaction_date = validated_data.get('transaction_date', timezone.now().date())

        # Calculate current balance from existing transactions
        existing_transactions = LeaveTransaction.objects.filter(
            employee=employee,
            leave_policy=leave_policy
        ).order_by('-transaction_date', '-created_at')

        if existing_transactions.exists():
            balance_after = existing_transactions.first().balance_after + validated_data['days']
        else:
            balance_after = validated_data['days']

        # Generate transaction number
        from datetime import datetime
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
            transaction_type=validated_data['transaction_type'],
            transaction_date=transaction_date,
            days=validated_data['days'],
            balance_after=balance_after,
            reference_number=validated_data.get('reference_number', ''),
            notes=validated_data['notes'],
            processed_by=self.context['request'].user
        )

        return transaction


class BulkAccrualSerializer(serializers.Serializer):
    """
    Serializer for bulk leave accrual operations.
    Creates accrual transactions for multiple employees at once.
    """
    employee_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=True,
        min_length=1,
        help_text='List of employee IDs to allocate leave to'
    )
    leave_policy = serializers.PrimaryKeyRelatedField(
        queryset=LeavePolicy.objects.all(),
        required=True
    )
    days = serializers.DecimalField(
        max_digits=6,
        decimal_places=2,
        required=True,
        help_text='Days to allocate to each employee'
    )
    transaction_date = serializers.DateField(
        required=False,
        help_text='Defaults to today if not provided'
    )
    notes = serializers.CharField(
        required=True,
        help_text='Reason for this allocation'
    )

    def validate_days(self, value):
        """Validate days is positive for accrual"""
        if value <= 0:
            raise serializers.ValidationError('Days must be positive for bulk accrual')
        return value

    def validate_employee_ids(self, value):
        """Validate all employee IDs exist"""
        from hr_employee.models import Employee

        existing_ids = set(Employee.objects.filter(id__in=value).values_list('id', flat=True))
        provided_ids = set(value)

        if len(existing_ids) != len(provided_ids):
            missing_ids = provided_ids - existing_ids
            raise serializers.ValidationError(
                f'Invalid employee IDs: {", ".join(str(id) for id in missing_ids)}'
            )

        return value


class LeaveRequestListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for leave request list views.
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_number = serializers.CharField(source='employee.employee_number', read_only=True)
    leave_type = serializers.CharField(source='leave_policy.leave_type', read_only=True)
    leave_type_name = serializers.CharField(source='leave_policy.display_name', read_only=True)
    current_approver_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id',
            'request_number',
            'employee',
            'employee_name',
            'employee_number',
            'leave_policy',
            'leave_type',
            'leave_type_name',
            'start_date',
            'end_date',
            'total_days',
            'working_days_count',
            'is_half_day',
            'status',
            'priority',
            'current_approver',
            'current_approver_name',
            'is_emergency_leave',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_current_approver_name(self, obj):
        """Get current approver's name"""
        if obj.current_approver:
            return obj.current_approver.get_full_name()
        return None


class LeaveRequestDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for leave request detail views.
    Includes full approval chain and related transactions.
    """
    employee_details = serializers.SerializerMethodField()
    leave_policy_details = serializers.SerializerMethodField()
    transactions = serializers.SerializerMethodField()
    cancellation_details = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            # Basic Info
            'id',
            'request_number',
            'employee',
            'employee_details',
            'leave_policy',
            'leave_policy_details',

            # Leave Period
            'start_date',
            'end_date',
            'total_days',
            'working_days_count',
            'is_half_day',

            # Request Details
            'reason',
            'special_leave_trigger',
            'attachments',
            'handover_notes',
            'address_during_leave',
            'contact_during_leave',

            # Emergency/Documentation
            'is_emergency_leave',
            'documentation_provided',

            # Balance Tracking
            'balance_before_request',
            'balance_after_approval',

            # Approval Status
            'status',
            'priority',
            'current_approver',
            'approval_chain',

            # Cancellation
            'cancellation_reason',
            'cancelled_at',
            'cancelled_by',
            'cancellation_details',

            # Timestamps
            'created_at',
            'updated_at',
            'created_by',
            'modified_by',

            # Related
            'transactions',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_employee_details(self, obj):
        """Get employee information"""
        return {
            'id': str(obj.employee.id),
            'employee_number': obj.employee.employee_number,
            'first_name': obj.employee.first_name,
            'last_name': obj.employee.last_name,
            'full_name': obj.employee.get_full_name(),
            'department': obj.employee.department.name,
            'designation': obj.employee.designation.title,
            'email': obj.employee.user.email,
        }

    def get_leave_policy_details(self, obj):
        """Get leave policy information"""
        return {
            'id': str(obj.leave_policy.id),
            'code': obj.leave_policy.code,
            'leave_type': obj.leave_policy.leave_type,
            'display_name': obj.leave_policy.display_name,
            'is_paid': obj.leave_policy.is_paid,
            'pay_status': obj.leave_policy.pay_status,
            'requires_documentation': obj.leave_policy.requires_documentation,
        }

    def get_transactions(self, obj):
        """Get related ledger transactions"""
        transactions = obj.ledger_transactions.all().order_by('-transaction_date')
        return LeaveTransactionSerializer(transactions, many=True).data

    def get_cancellation_details(self, obj):
        """Get cancellation information if applicable"""
        if obj.status == 'cancelled' and obj.cancelled_by:
            cancelled_by_name = obj.cancelled_by.email
            if hasattr(obj.cancelled_by, 'employee_profile'):
                cancelled_by_name = obj.cancelled_by.employee_profile.get_full_name()

            return {
                'cancelled_at': obj.cancelled_at,
                'cancelled_by': cancelled_by_name,
                'cancellation_reason': obj.cancellation_reason,
            }
        return None


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating leave requests.
    Validates eligibility, balance, and notice requirements.
    """

    class Meta:
        model = LeaveRequest
        fields = [
            'employee',
            'leave_policy',
            'start_date',
            'end_date',
            'is_half_day',
            'reason',
            'special_leave_trigger',
            'attachments',
            'handover_notes',
            'address_during_leave',
            'contact_during_leave',
            'is_emergency_leave',
            'documentation_provided',
            'priority',
        ]

    def validate(self, attrs):
        """Comprehensive validation for leave request"""
        employee = attrs.get('employee')
        leave_policy = attrs.get('leave_policy')
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        is_emergency = attrs.get('is_emergency_leave', False)

        # Validate dates
        if start_date > end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })

        # Check for overlapping leave requests
        overlapping = LeaveRequest.objects.filter(
            employee=employee,
            status__in=['pending', 'approved'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()

        if overlapping:
            raise serializers.ValidationError(
                'You have an overlapping leave request for this period.'
            )

        # Validate minimum notice (unless emergency leave)
        if not is_emergency and leave_policy.minimum_notice_days > 0:
            days_until_leave = (start_date - datetime.now().date()).days
            if days_until_leave < leave_policy.minimum_notice_days:
                raise serializers.ValidationError({
                    'start_date': f'Minimum notice of {leave_policy.minimum_notice_days} days required.'
                })

        # Validate documentation requirements
        if leave_policy.requires_documentation and leave_policy.documentation_mandatory:
            if not attrs.get('documentation_provided') and not attrs.get('attachments'):
                raise serializers.ValidationError({
                    'attachments': 'Documentation is mandatory for this leave type.'
                })

        # Validate special leave trigger
        if leave_policy.leave_type == 'special' and not attrs.get('special_leave_trigger'):
            raise serializers.ValidationError({
                'special_leave_trigger': 'Special leave requires a statutory trigger reason.'
            })

        # Validate gender restriction
        if leave_policy.gender_restriction != 'none':
            if leave_policy.gender_restriction == 'female' and employee.gender != 'female':
                raise serializers.ValidationError({
                    'leave_policy': f'{leave_policy.display_name} is only available to female employees.'
                })
            elif leave_policy.gender_restriction == 'male' and employee.gender != 'male':
                raise serializers.ValidationError({
                    'leave_policy': f'{leave_policy.display_name} is only available to male employees.'
                })

        return attrs


class PublicHolidaySerializer(serializers.ModelSerializer):
    """Serializer for public holidays"""

    class Meta:
        model = PublicHoliday
        fields = ['id', 'name', 'date', 'is_recurring', 'is_active', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WorkingHoursSerializer(serializers.ModelSerializer):
    """Serializer for working hours configuration"""

    class Meta:
        model = WorkingHours
        fields = [
            'id',
            'name',
            'monday_working',
            'tuesday_working',
            'wednesday_working',
            'thursday_working',
            'friday_working',
            'saturday_working',
            'sunday_working',
            'work_start_time',
            'work_end_time',
            'lunch_break_duration',
            'total_work_hours_per_day',
            'is_default',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LeaveYearConfigSerializer(serializers.ModelSerializer):
    """
    Serializer for LeaveYearConfig singleton model.
    Handles system-wide leave year and balance configuration.
    """

    class Meta:
        model = LeaveYearConfig
        fields = [
            'id',
            'leave_year_type',
            'financial_year_start',
            'auto_carry_forward',
            'allow_negative_balance',
            'max_negative_balance_days',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_financial_year_start(self, value):
        """Validate financial year start date format (MM-DD)"""
        if not value:
            return value

        try:
            # Validate format MM-DD
            month, day = value.split('-')
            month = int(month)
            day = int(day)

            if not (1 <= month <= 12):
                raise serializers.ValidationError('Month must be between 01 and 12')
            if not (1 <= day <= 31):
                raise serializers.ValidationError('Day must be between 01 and 31')

            # Additional validation for specific months
            if month in [4, 6, 9, 11] and day > 30:
                raise serializers.ValidationError(f'Month {month:02d} has only 30 days')
            if month == 2 and day > 29:
                raise serializers.ValidationError('February has maximum 29 days')

        except ValueError:
            raise serializers.ValidationError('Invalid format. Use MM-DD (e.g., 04-01 for April 1st)')

        return value

    def validate_max_negative_balance_days(self, value):
        """Validate max negative balance is non-negative"""
        if value < 0:
            raise serializers.ValidationError('Maximum negative balance days cannot be negative')
        return value

    def validate(self, attrs):
        """Cross-field validation"""
        # If negative balance not allowed, max should be 0
        if not attrs.get('allow_negative_balance', False) and attrs.get('max_negative_balance_days', 0) > 0:
            raise serializers.ValidationError({
                'max_negative_balance_days': 'Must be 0 when negative balance is not allowed'
            })

        return attrs


class LeaveNotificationSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for LeaveNotificationSettings singleton model.
    Handles system-wide notification preferences.
    """

    class Meta:
        model = LeaveNotificationSettings
        fields = [
            'id',
            'notify_on_submission',
            'notify_on_approval',
            'notify_on_rejection',
            'reminder_days_before_leave',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_reminder_days_before_leave(self, value):
        """Validate reminder days is non-negative and reasonable"""
        if value < 0:
            raise serializers.ValidationError('Reminder days cannot be negative')
        if value > 90:
            raise serializers.ValidationError('Reminder days cannot exceed 90 days')
        return value


class LeaveCalendarSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for LeaveCalendarSettings singleton model.
    Handles system-wide calendar display preferences.
    """

    class Meta:
        model = LeaveCalendarSettings
        fields = [
            'id',
            'default_view',
            'week_starts_on',
            'show_weekends_on_calendar',
            'highlight_public_holidays',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
