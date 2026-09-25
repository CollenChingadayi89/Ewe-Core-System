from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.constants import ApprovalStatus, CURRENCY_CHOICES, PRIORITY_CHOICES


class PettyCash(BaseModel):
    """
    Petty cash disbursement requests.
    Small cash payments for minor expenses.
    """
    petty_cash_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Petty Cash Number',
        help_text='Unique identifier (e.g., PC-2026-000001)'
    )

    # Employee Information
    employee = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='petty_cash_requests',
        verbose_name='Employee'
    )

    # Request Details
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Amount',
        help_text='Total amount (auto-calculated from line items if present, or entered directly)'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )
    purpose = models.TextField(verbose_name='Purpose')
    line_items = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Line Items',
        help_text='Array of line items: [{"description": "Item", "currency": "ZWG", "quantity": 2, "unit_price": 100.00, "amount": 200.00}]'
    )
    category = models.CharField(
        max_length=50,
        choices=[
            ('office_supplies', 'Office Supplies'),
            ('refreshments', 'Refreshments'),
            ('transport', 'Transport'),
            ('utilities', 'Utilities'),
            ('maintenance', 'Maintenance'),
            ('miscellaneous', 'Miscellaneous')
        ],
        default='miscellaneous',
        verbose_name='Category'
    )
    justification = models.TextField(
        blank=True,
        null=True,
        verbose_name='Justification',
        help_text='Detailed justification for this petty cash request (required for amounts > 5000)'
    )
    receipt_expected = models.BooleanField(
        default=True,
        verbose_name='Receipt Expected',
        help_text='Whether a receipt is required after disbursement'
    )
    account_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Account/GL Code',
        help_text='General Ledger account code for accounting purposes'
    )

    # Dates
    request_date = models.DateField(auto_now_add=True, verbose_name='Request Date')
    required_by_date = models.DateField(blank=True, null=True, verbose_name='Required By Date')

    # Status & Approval
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('pending', 'Pending Approval'),
            ('verified', 'Verified'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('disbursed', 'Disbursed'),
            ('cancelled', 'Cancelled')
        ],
        default='pending',
        verbose_name='Status'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priority'
    )

    # Verification
    verified_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='verified_petty_cash',
        verbose_name='Verified By'
    )
    verified_date = models.DateTimeField(blank=True, null=True, verbose_name='Verified Date')

    # Approval
    approved_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_petty_cash',
        verbose_name='Approved By'
    )
    approved_date = models.DateTimeField(blank=True, null=True, verbose_name='Approved Date')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Rejection Reason')

    # Disbursement Details
    disbursed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='disbursed_petty_cash',
        verbose_name='Disbursed By'
    )
    disbursed_date = models.DateField(blank=True, null=True, verbose_name='Date Disbursed')
    receipt_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Receipt Number'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Additional Notes')

    def save(self, *args, **kwargs):
        """Override save to auto-generate petty_cash_number"""
        if not self.petty_cash_number:
            # Generate petty cash number: PC-YYYY-NNNNNN
            from django.utils import timezone
            year = timezone.now().year

            # Get the last petty cash number for this year
            last_petty_cash = PettyCash.objects.filter(
                petty_cash_number__startswith=f'PC-{year}-'
            ).order_by('petty_cash_number').last()

            if last_petty_cash and last_petty_cash.petty_cash_number:
                # Extract the sequence number and increment
                try:
                    last_sequence = int(last_petty_cash.petty_cash_number.split('-')[-1])
                    new_sequence = last_sequence + 1
                except (ValueError, IndexError):
                    new_sequence = 1
            else:
                new_sequence = 1

            self.petty_cash_number = f'PC-{year}-{new_sequence:06d}'

        super().save(*args, **kwargs)

    class Meta:
        db_table = 'finance_petty_cash'
        verbose_name = 'Petty Cash'
        verbose_name_plural = 'Petty Cash'
        ordering = ['-request_date', '-created_at']
        indexes = [
            models.Index(fields=['petty_cash_number']),
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['request_date']),
        ]

    def __str__(self):
        return f"{self.petty_cash_number} - {self.employee.get_full_name()} (ZWG {self.amount})"
