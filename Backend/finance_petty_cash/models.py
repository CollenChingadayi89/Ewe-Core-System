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
        verbose_name='Amount (ZWG)'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )
    purpose = models.TextField(verbose_name='Purpose')
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

    # Dates
    request_date = models.DateField(auto_now_add=True, verbose_name='Request Date')
    required_by_date = models.DateField(blank=True, null=True, verbose_name='Required By Date')

    # Status & Approval
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('pending', 'Pending Approval'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('disbursed', 'Disbursed'),
            ('cancelled', 'Cancelled')
        ],
        default='draft',
        verbose_name='Status'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priority'
    )

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
