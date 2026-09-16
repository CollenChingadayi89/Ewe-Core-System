from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.constants import Gender, CURRENCY_CHOICES


class Member(BaseModel):
    """
    SACCO Member profile - customers who use SACCO services.
    Different from Employee model which is for staff.
    """
    # Member Identification
    member_number = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Member Number',
        help_text='Unique member identifier (e.g., WES-2026-001)'
    )

    # Personal Information
    first_name = models.CharField(max_length=50, verbose_name='First Name')
    middle_name = models.CharField(max_length=50, blank=True, null=True, verbose_name='Middle Name')
    last_name = models.CharField(max_length=50, verbose_name='Last Name')
    email = models.EmailField(verbose_name='Email Address')
    phone = models.CharField(max_length=20, verbose_name='Phone Number')
    alternate_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Alternate Phone')

    national_id = models.CharField(max_length=50, verbose_name='National ID Number')
    date_of_birth = models.DateField(verbose_name='Date of Birth')
    gender = models.CharField(max_length=20, choices=Gender.CHOICES, verbose_name='Gender')

    # Address
    address = models.TextField(verbose_name='Residential Address')
    city = models.CharField(max_length=50, blank=True, null=True, verbose_name='City')
    province = models.CharField(max_length=50, blank=True, null=True, verbose_name='Province')
    postal_code = models.CharField(max_length=20, blank=True, null=True, verbose_name='Postal Code')
    country = models.CharField(max_length=50, default='Zimbabwe', verbose_name='Country')

    # Employment/Occupation
    occupation = models.CharField(max_length=100, blank=True, null=True, verbose_name='Occupation')
    employer = models.CharField(max_length=100, blank=True, null=True, verbose_name='Employer Name')
    employer_address = models.TextField(blank=True, null=True, verbose_name='Employer Address')
    monthly_income = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Monthly Income (ZWG)'
    )

    # Membership Details
    membership_type = models.CharField(
        max_length=20,
        choices=[('individual', 'Individual'), ('corporate', 'Corporate')],
        default='individual',
        verbose_name='Membership Type'
    )
    branch = models.CharField(max_length=100, default='Main Branch', verbose_name='Branch')
    join_date = models.DateField(verbose_name='Join Date')
    account_status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('inactive', 'Inactive'),
            ('suspended', 'Suspended'),
            ('closed', 'Closed')
        ],
        default='active',
        verbose_name='Account Status'
    )

    # Share Capital
    shares_owned = models.IntegerField(default=0, verbose_name='Number of Shares Owned')
    share_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=100.00,
        verbose_name='Share Value (ZWG)'
    )
    share_certificate_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Share Certificate Number'
    )

    # Savings
    savings_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Savings Balance (ZWG)'
    )
    deposits_this_month = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Deposits This Month')
    withdrawals_this_month = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Withdrawals This Month')
    deposits_ytd = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Deposits Year-to-Date')
    withdrawals_ytd = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Withdrawals Year-to-Date')

    # Loans
    active_loans_count = models.IntegerField(default=0, verbose_name='Number of Active Loans')
    total_loan_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Total Loan Amount (ZWG)'
    )
    outstanding_loan_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Outstanding Loan Balance (ZWG)'
    )
    monthly_installment = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Monthly Installment (ZWG)'
    )
    next_payment_due = models.DateField(blank=True, null=True, verbose_name='Next Payment Due Date')
    loan_status = models.CharField(
        max_length=20,
        choices=[
            ('current', 'Current'),
            ('arrears', 'Arrears'),
            ('defaulted', 'Defaulted'),
            ('no_loan', 'No Loan')
        ],
        default='no_loan',
        verbose_name='Loan Status'
    )

    # Dividends
    last_dividend_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Last Dividend Amount (ZWG)'
    )
    total_dividends_earned = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Total Dividends Earned (ZWG)'
    )
    current_dividend_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        verbose_name='Current Dividend Rate (%)'
    )

    # Activity Tracking
    last_transaction_date = models.DateField(blank=True, null=True, verbose_name='Last Transaction Date')
    transaction_count = models.IntegerField(default=0, verbose_name='Total Transaction Count')

    # Credit Scoring
    credit_score = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('fair', 'Fair'),
            ('poor', 'Poor')
        ],
        default='good',
        verbose_name='Credit Score'
    )

    # Next of Kin
    next_of_kin_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Next of Kin Name')
    next_of_kin_relationship = models.CharField(max_length=50, blank=True, null=True, verbose_name='Relationship')
    next_of_kin_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Next of Kin Phone')
    next_of_kin_address = models.TextField(blank=True, null=True, verbose_name='Next of Kin Address')

    # Notes
    notes = models.TextField(blank=True, null=True, verbose_name='Additional Notes')

    class Meta:
        db_table = 'sacco_member'
        verbose_name = 'SACCO Member'
        verbose_name_plural = 'SACCO Members'
        ordering = ['member_number']
        indexes = [
            models.Index(fields=['member_number']),
            models.Index(fields=['first_name', 'last_name']),
            models.Index(fields=['email']),
            models.Index(fields=['national_id']),
            models.Index(fields=['account_status']),
        ]

    def __str__(self):
        return f"{self.member_number} - {self.get_full_name()}"

    def get_full_name(self):
        """Return full name"""
        if self.middle_name:
            return f"{self.first_name} {self.middle_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    def get_total_share_value(self):
        """Calculate total share value"""
        return self.shares_owned * self.share_value
