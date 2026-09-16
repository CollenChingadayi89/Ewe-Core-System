from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.constants import (
    ReceivableCategory,
    ReceivableStatus,
    CURRENCY_CHOICES,
    PRIORITY_CHOICES
)


class Receivable(BaseModel):
    """
    Money coming INTO SACCO from members.
    Supports 15 SACCO service categories including loans, shares, registrations.
    """
    # Receivable Identification
    receivable_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Receivable Number',
        help_text='Unique identifier (e.g., RCV-2026-000001)'
    )

    # Member Information
    member = models.ForeignKey(
        'sacco_member.Member',
        on_delete=models.PROTECT,
        related_name='receivables',
        verbose_name='Member'
    )

    # Service Category
    category = models.CharField(
        max_length=30,
        choices=ReceivableCategory.CHOICES,
        verbose_name='Service Category',
        help_text='Type of SACCO service (loan, share purchase, registration, etc.)'
    )

    # Amount Details
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
    amount_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Amount Paid (ZWG)'
    )
    outstanding_balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Outstanding Balance (ZWG)',
        help_text='Calculated: amount - amount_paid'
    )

    # Dates
    transaction_date = models.DateField(verbose_name='Transaction Date')
    due_date = models.DateField(verbose_name='Due Date')
    collection_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Collection Date',
        help_text='Scheduled collection date for recurring payments'
    )

    # Description
    description = models.TextField(verbose_name='Description')
    notes = models.TextField(blank=True, null=True, verbose_name='Additional Notes')

    # Service-Specific Fields
    # For Loans
    loan_account_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Loan Account Number',
        help_text='For loan-related receivables'
    )
    installment_number = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Installment Number',
        help_text='e.g., 8 (for 8/12 installments)'
    )
    total_installments = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Total Installments',
        help_text='e.g., 12 (for 8/12 installments)'
    )
    principal_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Principal Amount (ZWG)',
        help_text='Principal portion of loan payment'
    )
    interest_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Interest Amount (ZWG)',
        help_text='Interest portion of loan payment'
    )
    interest_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Interest Rate (%)',
        help_text='0% or 10% for loan types'
    )

    # For Share Purchases
    share_certificate_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Share Certificate Number',
        help_text='For share purchase receivables'
    )
    number_of_shares = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Number of Shares',
        help_text='Quantity of shares purchased'
    )
    share_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Share Price (ZWG)',
        help_text='Price per share'
    )

    # Status & Approval
    status = models.CharField(
        max_length=20,
        choices=ReceivableStatus.CHOICES,
        default=ReceivableStatus.DRAFT,
        verbose_name='Status'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        verbose_name='Priority'
    )

    # Approval Workflow
    submitted_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='submitted_receivables',
        verbose_name='Submitted By'
    )
    approved_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_receivables',
        verbose_name='Approved By'
    )
    approved_date = models.DateTimeField(blank=True, null=True, verbose_name='Approved Date')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Rejection Reason')

    # Payment Tracking
    is_recurring = models.BooleanField(
        default=False,
        verbose_name='Is Recurring Payment',
        help_text='True for monthly contributions (Ewe Cub, Mukando, etc.)'
    )
    payment_method = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Payment Method',
        help_text='Cash, Bank Transfer, Mobile Money, etc.'
    )
    reference_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Reference Number',
        help_text='External payment reference'
    )

    class Meta:
        db_table = 'finance_receivable'
        verbose_name = 'Receivable'
        verbose_name_plural = 'Receivables'
        ordering = ['-transaction_date', '-created_at']
        indexes = [
            models.Index(fields=['receivable_number']),
            models.Index(fields=['member', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['transaction_date']),
        ]

    def __str__(self):
        return f"{self.receivable_number} - {self.member.member_number} ({self.get_category_display()})"

    def save(self, *args, **kwargs):
        """Auto-calculate outstanding balance"""
        self.outstanding_balance = self.amount - self.amount_paid
        super().save(*args, **kwargs)

    def is_overdue(self):
        """Check if receivable is overdue"""
        from django.utils import timezone
        if self.status in [ReceivableStatus.APPROVED, ReceivableStatus.PARTIALLY_PAID, ReceivableStatus.SCHEDULED]:
            return self.due_date < timezone.now().date()
        return False


class ReceivablePayment(models.Model):
    """
    Partial payment tracking for receivables.
    Supports installment payments and partial collections.
    """
    receivable = models.ForeignKey(
        Receivable,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name='Receivable'
    )
    payment_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Payment Number',
        help_text='Unique payment identifier (e.g., PMT-2026-000001)'
    )
    payment_date = models.DateField(verbose_name='Payment Date')
    amount_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Amount Paid (ZWG)'
    )
    payment_method = models.CharField(
        max_length=50,
        verbose_name='Payment Method',
        help_text='Cash, Bank Transfer, Mobile Money, EcoCash, etc.'
    )
    reference_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Reference Number',
        help_text='Transaction reference from payment provider'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    # Audit fields
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='recorded_payments',
        verbose_name='Recorded By'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'finance_receivable_payment'
        verbose_name = 'Receivable Payment'
        verbose_name_plural = 'Receivable Payments'
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['receivable', 'payment_date']),
            models.Index(fields=['payment_number']),
        ]

    def __str__(self):
        return f"{self.payment_number} - {self.receivable.receivable_number} (ZWG {self.amount_paid})"
