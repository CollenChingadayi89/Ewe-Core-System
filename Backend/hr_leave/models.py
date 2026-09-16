from django.db import models
from django.conf import settings
from core.models import BaseModel, TimestampedModel
from core.constants import (
    LeaveType,
    LeaveTransactionType,
    LeaveRequestStatus,
    AccrualMethod,
    LeavePayStatus,
    PRIORITY_CHOICES
)


class LeavePolicy(BaseModel):
    """
    Leave policy configuration for different leave types.
    Implements Zimbabwe Labour Act compliance.
    """
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Policy Code',
        help_text='Unique policy identifier (e.g., POLICY-ANNUAL-001)'
    )
    leave_type = models.CharField(
        max_length=20,
        choices=LeaveType.CHOICES,
        verbose_name='Leave Type'
    )
    display_name = models.CharField(max_length=100, verbose_name='Display Name')
    description = models.TextField(blank=True, null=True, verbose_name='Description')

    # Statutory Information
    is_statutory = models.BooleanField(default=False, verbose_name='Is Statutory Leave')
    statutory_reference = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Statutory Reference',
        help_text='e.g., s14A - Labour Act [Chapter 28:01]'
    )

    # Payment Configuration
    is_paid = models.BooleanField(default=True, verbose_name='Is Paid Leave')
    pay_status = models.CharField(
        max_length=20,
        choices=LeavePayStatus.CHOICES,
        default=LeavePayStatus.FULL_PAY,
        verbose_name='Pay Status'
    )

    # Accrual Configuration
    accrual_method = models.CharField(
        max_length=20,
        choices=AccrualMethod.CHOICES,
        default=AccrualMethod.MONTHLY,
        verbose_name='Accrual Method'
    )
    annual_entitlement_days = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='Annual Entitlement (days)'
    )
    max_accumulation_days = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Maximum Accumulation (days)',
        help_text='Maximum balance that can accumulate'
    )

    # Eligibility
    requires_minimum_service = models.BooleanField(default=False, verbose_name='Requires Minimum Service')
    minimum_service_days = models.IntegerField(default=0, verbose_name='Minimum Service Days')
    available_during_probation = models.BooleanField(default=False, verbose_name='Available During Probation')

    # Documentation
    requires_documentation = models.BooleanField(default=False, verbose_name='Requires Documentation')
    documentation_types = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Documentation Types',
        help_text='List of required document types (e.g., medical-certificate)'
    )
    documentation_mandatory = models.BooleanField(default=False, verbose_name='Documentation Mandatory')

    # Approval Configuration
    requires_manager_approval = models.BooleanField(default=True, verbose_name='Requires Manager Approval')
    requires_hr_approval = models.BooleanField(default=False, verbose_name='Requires HR Approval')
    requires_ceo_approval = models.BooleanField(default=False, verbose_name='Requires CEO Approval')
    approval_levels = models.IntegerField(default=1, verbose_name='Number of Approval Levels')
    auto_escalate_after_days = models.IntegerField(default=3, verbose_name='Auto-escalate After (days)')
    allow_delegation = models.BooleanField(default=True, verbose_name='Allow Approval Delegation')
    allow_self_approval = models.BooleanField(default=False, verbose_name='Allow Self Approval')

    # Leave Calculation
    counts_weekends_in_leave = models.BooleanField(default=True, verbose_name='Counts Weekends in Leave')
    counts_public_holidays_in_leave = models.BooleanField(default=True, verbose_name='Counts Public Holidays in Leave')

    # Carryforward and Expiry
    allow_carry_forward = models.BooleanField(default=False, verbose_name='Allow Carryforward')
    carry_forward_max_days = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Carryforward Max Days'
    )
    expires_at_year_end = models.BooleanField(default=True, verbose_name='Expires at Year End')
    payout_on_termination = models.BooleanField(default=False, verbose_name='Payout on Termination')

    # Notice Requirements
    minimum_notice_days = models.IntegerField(default=0, verbose_name='Minimum Notice (days)')
    minimum_notice_for_short_leave = models.IntegerField(default=0, verbose_name='Minimum Notice for Short Leave')

    # Additional Settings
    supports_half_days = models.BooleanField(default=False, verbose_name='Supports Half Days')
    can_be_converted_from = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Can Be Converted From',
        help_text='Leave types that can convert to this type'
    )

    # Status
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        db_table = 'hr_leave_policy'
        verbose_name = 'Leave Policy'
        verbose_name_plural = 'Leave Policies'
        ordering = ['leave_type', 'code']
        indexes = [
            models.Index(fields=['leave_type', 'is_active']),
        ]

    def __str__(self):
        return f"{self.code} - {self.display_name}"


class LeaveTransaction(TimestampedModel):
    """
    IMMUTABLE leave ledger transaction.
    Never update or delete - use offsetting entries for corrections.
    Balance calculated from SUM of transactions.
    """
    # No UUID - use auto-incrementing ID for transaction sequence
    transaction_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Transaction Number',
        help_text='Unique transaction identifier (e.g., LT-2026-000001)'
    )
    employee = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='leave_transactions',
        verbose_name='Employee'
    )
    leave_policy = models.ForeignKey(
        LeavePolicy,
        on_delete=models.PROTECT,
        related_name='transactions',
        verbose_name='Leave Policy'
    )
    transaction_type = models.CharField(
        max_length=30,
        choices=LeaveTransactionType.CHOICES,
        verbose_name='Transaction Type'
    )
    transaction_date = models.DateField(verbose_name='Transaction Date')
    days = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name='Days',
        help_text='Positive for accruals/reversals, negative for usage/reservations'
    )
    balance_after = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        verbose_name='Balance After Transaction',
        help_text='Running balance snapshot'
    )
    leave_request = models.ForeignKey(
        'LeaveRequest',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='ledger_transactions',
        verbose_name='Related Leave Request'
    )
    reference_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Reference Number',
        help_text='External reference (e.g., payroll run, correction ticket)'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='leave_transactions_processed',
        verbose_name='Processed By'
    )

    class Meta:
        db_table = 'hr_leave_transaction'
        verbose_name = 'Leave Transaction'
        verbose_name_plural = 'Leave Transactions'
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['employee', 'leave_policy', 'transaction_date']),
            models.Index(fields=['transaction_number']),
            models.Index(fields=['leave_request']),
        ]

    def __str__(self):
        return f"{self.transaction_number} - {self.employee.employee_number} ({self.days} days)"

    def save(self, *args, **kwargs):
        """
        Override save to enforce immutability.
        Once created, LeaveTransaction records CANNOT be modified.
        Use offsetting entries for corrections.
        """
        if self.pk:
            # If primary key exists, this is an UPDATE attempt
            raise ValueError(
                "Leave transactions are immutable and cannot be modified. "
                "Create an offsetting transaction instead."
            )
        # Only allow INSERT operations
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """
        Override delete to prevent deletion of leave transactions.
        Leave ledger must maintain complete audit trail.
        """
        raise ValueError(
            "Leave transactions cannot be deleted for audit compliance. "
            "Create an offsetting transaction to reverse the entry."
        )


class LeaveRequest(BaseModel):
    """
    Employee leave requests with approval workflow.
    """
    request_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Request Number',
        help_text='Unique request identifier (e.g., LR-2026-000001)'
    )
    employee = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='leave_requests',
        verbose_name='Employee'
    )
    leave_policy = models.ForeignKey(
        LeavePolicy,
        on_delete=models.PROTECT,
        related_name='leave_requests',
        verbose_name='Leave Policy'
    )

    # Leave Period
    start_date = models.DateField(verbose_name='Start Date')
    end_date = models.DateField(verbose_name='End Date')
    total_days = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Total Days',
        help_text='Calendar days including weekends/holidays'
    )
    working_days_count = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='Working Days Count',
        help_text='Actual working days (excludes weekends/holidays per policy)'
    )
    is_half_day = models.BooleanField(default=False, verbose_name='Is Half Day Leave')

    # Request Details
    reason = models.TextField(verbose_name='Reason')
    special_leave_trigger = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Special Leave Trigger',
        help_text='For special leave - statutory trigger reason'
    )
    attachments = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Attachments',
        help_text='URLs to supporting documents'
    )
    handover_notes = models.TextField(blank=True, null=True, verbose_name='Handover Notes')

    # Emergency/Documentation
    is_emergency_leave = models.BooleanField(
        default=False,
        verbose_name='Is Emergency Leave',
        help_text='Notified after-the-fact (sick, bereavement, etc.)'
    )
    documentation_provided = models.BooleanField(default=False, verbose_name='Documentation Provided')

    # Balance Tracking
    balance_before_request = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Balance Before Request',
        help_text='Available balance when request was submitted'
    )
    balance_after_approval = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Balance After Approval',
        help_text='Expected balance after leave is taken'
    )

    # Approval Status
    status = models.CharField(
        max_length=20,
        choices=LeaveRequestStatus.CHOICES,
        default=LeaveRequestStatus.DRAFT,
        verbose_name='Status'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priority'
    )
    current_approver = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='pending_leave_approvals',
        verbose_name='Current Approver'
    )
    approval_chain = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Approval Chain',
        help_text='Array of approval steps with approver details'
    )

    # Cancellation
    cancellation_reason = models.TextField(blank=True, null=True, verbose_name='Cancellation Reason')
    cancelled_at = models.DateTimeField(blank=True, null=True, verbose_name='Cancelled At')
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='leave_requests_cancelled',
        verbose_name='Cancelled By'
    )

    class Meta:
        db_table = 'hr_leave_request'
        verbose_name = 'Leave Request'
        verbose_name_plural = 'Leave Requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['request_number']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['status', 'current_approver']),
        ]

    def __str__(self):
        return f"{self.request_number} - {self.employee.employee_number} ({self.leave_policy.leave_type})"


class PublicHoliday(models.Model):
    """
    Zimbabwe public holidays for leave calculations.
    """
    name = models.CharField(max_length=100, verbose_name='Holiday Name')
    date = models.DateField(verbose_name='Date')
    is_recurring = models.BooleanField(
        default=True,
        verbose_name='Is Recurring',
        help_text='Does this holiday occur every year on the same date?'
    )
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_public_holiday'
        verbose_name = 'Public Holiday'
        verbose_name_plural = 'Public Holidays'
        ordering = ['date']
        indexes = [
            models.Index(fields=['date', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} ({self.date})"


class WorkingHours(models.Model):
    """
    Configurable working hours and work schedule.
    Used for leave day calculations.
    """
    name = models.CharField(
        max_length=100,
        default='Standard Zimbabwe Work Week',
        verbose_name='Configuration Name'
    )
    monday_working = models.BooleanField(default=True, verbose_name='Monday Working Day')
    tuesday_working = models.BooleanField(default=True, verbose_name='Tuesday Working Day')
    wednesday_working = models.BooleanField(default=True, verbose_name='Wednesday Working Day')
    thursday_working = models.BooleanField(default=True, verbose_name='Thursday Working Day')
    friday_working = models.BooleanField(default=True, verbose_name='Friday Working Day')
    saturday_working = models.BooleanField(default=False, verbose_name='Saturday Working Day')
    sunday_working = models.BooleanField(default=False, verbose_name='Sunday Working Day')

    work_start_time = models.TimeField(default='08:00:00', verbose_name='Work Start Time')
    work_end_time = models.TimeField(default='17:00:00', verbose_name='Work End Time')
    lunch_break_duration = models.IntegerField(
        default=60,
        verbose_name='Lunch Break Duration (minutes)'
    )
    total_work_hours_per_day = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=8.0,
        verbose_name='Total Work Hours Per Day'
    )

    is_default = models.BooleanField(default=True, verbose_name='Is Default Configuration')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hr_working_hours'
        verbose_name = 'Working Hours Configuration'
        verbose_name_plural = 'Working Hours Configurations'
        ordering = ['-is_default', 'name']

    def __str__(self):
        return self.name

    def get_working_days_count(self):
        """Return number of working days per week"""
        return sum([
            self.monday_working,
            self.tuesday_working,
            self.wednesday_working,
            self.thursday_working,
            self.friday_working,
            self.saturday_working,
            self.sunday_working
        ])
