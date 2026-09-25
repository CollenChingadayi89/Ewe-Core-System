from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.constants import (
    ApprovalStatus, CURRENCY_CHOICES, PRIORITY_CHOICES, PayableCategory, PayeeType,
)


class Vendor(BaseModel):
    """
    Vendor/Supplier/Client management.
    Organizations or individuals that SACCO pays money to.
    """
    vendor_code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Vendor Code',
        help_text='Unique vendor identifier (e.g., VND-001)'
    )
    company_name = models.CharField(max_length=200, verbose_name='Company/Business Name')
    contact_person = models.CharField(max_length=100, blank=True, null=True, verbose_name='Contact Person')
    email = models.EmailField(verbose_name='Email Address')
    phone = models.CharField(max_length=20, verbose_name='Phone Number')
    alternate_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Alternate Phone')

    # Address
    address = models.TextField(verbose_name='Physical Address')
    city = models.CharField(max_length=50, blank=True, null=True, verbose_name='City')
    province = models.CharField(max_length=50, blank=True, null=True, verbose_name='Province')
    postal_code = models.CharField(max_length=20, blank=True, null=True, verbose_name='Postal Code')
    country = models.CharField(max_length=50, default='Zimbabwe', verbose_name='Country')

    # Banking Details
    bank_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Bank Name')
    branch = models.CharField(max_length=100, blank=True, null=True, verbose_name='Branch Name')
    account_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Account Number')
    account_holder_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Account Holder Name')
    swift_code = models.CharField(max_length=20, blank=True, null=True, verbose_name='SWIFT/BIC Code')

    # Tax Information
    tax_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Tax ID/VAT Number',
        help_text='Zimbabwe tax identification number'
    )

    # Additional Info
    vendor_type = models.CharField(
        max_length=50,
        choices=[
            ('supplier', 'Supplier'),
            ('service_provider', 'Service Provider'),
            ('contractor', 'Contractor'),
            ('utility', 'Utility Company'),
            ('other', 'Other')
        ],
        default='supplier',
        verbose_name='Vendor Type'
    )
    payment_terms = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Payment Terms',
        help_text='e.g., Net 30, COD, 50% upfront'
    )
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    is_active = models.BooleanField(default=True, verbose_name='Is Active')

    class Meta:
        db_table = 'finance_vendor'
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
        ordering = ['company_name']
        indexes = [
            models.Index(fields=['vendor_code']),
            models.Index(fields=['company_name']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.vendor_code} - {self.company_name}"


class Payable(BaseModel):
    """
    Money going OUT from the SACCO.
    The payee is either a vendor/supplier (bills, invoices) or a SACCO member
    (dividends, interest, share buy-backs, savings withdrawals).
    """
    payable_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Payable Number',
        help_text='Unique identifier (e.g., PAY-2026-000001)'
    )

    # Payee (exactly one of vendor/member, matching payee_type — enforced by constraint)
    payee_type = models.CharField(
        max_length=10,
        choices=PayeeType.CHOICES,
        default=PayeeType.VENDOR,
        verbose_name='Payee Type'
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='payables',
        verbose_name='Vendor'
    )
    member = models.ForeignKey(
        'sacco_member.Member',
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        related_name='payables',
        verbose_name='Member'
    )

    # Invoice/Bill Details
    invoice_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Invoice/Bill Number',
        help_text='Vendor\'s invoice or bill number'
    )
    description = models.TextField(verbose_name='Description')
    category = models.CharField(
        max_length=50,
        choices=PayableCategory.CHOICES,
        default=PayableCategory.OTHER,
        verbose_name='Category'
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
    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        verbose_name='Tax/VAT Amount (ZWG)'
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Total Amount (ZWG)',
        help_text='Amount + Tax'
    )

    # Dates
    invoice_date = models.DateField(verbose_name='Invoice Date')
    due_date = models.DateField(verbose_name='Due Date')
    collection_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Collection Date',
        help_text='Scheduled payment date'
    )
    paid_date = models.DateField(blank=True, null=True, verbose_name='Date Paid')

    # Payment Details
    payment_method = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Payment Method',
        help_text='Bank Transfer, Cheque, Cash, etc.'
    )
    payment_reference = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Payment Reference',
        help_text='Transaction reference number'
    )

    # Where the money goes (captured on the request, so approvers see exactly what is paid out)
    pay_to_bank_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Bank Name')
    pay_to_bank_branch = models.CharField(max_length=100, blank=True, null=True, verbose_name='Bank Branch')
    pay_to_account_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Account Number')
    pay_to_account_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Account Holder Name')
    pay_to_mobile_number = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Mobile Money Number',
        help_text='EcoCash / OneMoney / InnBucks number for mobile money payments'
    )

    # Status & Approval
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('pending', 'Pending Approval'),
            ('approved', 'Approved'),
            ('paid', 'Paid'),
            ('rejected', 'Rejected'),
            ('cancelled', 'Cancelled'),
            ('overdue', 'Overdue')
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

    # Approval Workflow
    submitted_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='submitted_payables',
        verbose_name='Submitted By'
    )
    current_approver = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='pending_payable_approvals',
        verbose_name='Current Approver'
    )
    approval_chain = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Approval Chain',
        help_text='Array of approval steps with approver details'
    )
    approved_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_payables',
        verbose_name='Approved By',
        help_text='Set by the approval workflow on final approval'
    )
    approved_date = models.DateTimeField(blank=True, null=True, verbose_name='Approved Date')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Rejection Reason')
    paid_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='paid_payables',
        verbose_name='Paid By',
        help_text='Pay-stage assignee who recorded the payment'
    )

    # Approval requests for this payable (the approval workflow is the source of truth)
    approval_requests = GenericRelation(
        'approval.ApprovalRequest',
        content_type_field='content_type',
        object_id_field='object_id',
        related_query_name='payable',
    )

    # Attachments
    attachments = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Attachments',
        help_text='URLs to invoice/receipt documents'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Additional Notes')

    class Meta:
        db_table = 'finance_payable'
        verbose_name = 'Payable'
        verbose_name_plural = 'Payables'
        ordering = ['-invoice_date', '-created_at']
        indexes = [
            models.Index(fields=['payable_number']),
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['member', 'status']),
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['status', 'current_approver']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(payee_type=PayeeType.VENDOR, vendor__isnull=False, member__isnull=True)
                    | models.Q(payee_type=PayeeType.MEMBER, member__isnull=False, vendor__isnull=True)
                ),
                name='payable_payee_matches_type',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(payee_type=PayeeType.VENDOR, category__in=PayableCategory.VENDOR_VALUES)
                    | models.Q(payee_type=PayeeType.MEMBER, category__in=PayableCategory.MEMBER_VALUES)
                ),
                name='payable_category_matches_payee',
            ),
        ]

    def __str__(self):
        return f"{self.payable_number} - {self.payee_name} ({self.currency} {self.total_amount})"

    @property
    def payee(self):
        return self.member if self.payee_type == PayeeType.MEMBER else self.vendor

    @property
    def payee_name(self) -> str:
        if self.payee_type == PayeeType.MEMBER:
            return self.member.get_full_name() if self.member else ''
        return self.vendor.company_name if self.vendor else ''

    @property
    def payee_reference(self) -> str:
        """Vendor code or member number."""
        if self.payee_type == PayeeType.MEMBER:
            return self.member.member_number if self.member else ''
        return self.vendor.vendor_code if self.vendor else ''

    def save(self, *args, **kwargs):
        """Auto-calculate total amount"""
        self.total_amount = self.amount + self.tax_amount
        super().save(*args, **kwargs)

    def is_overdue(self):
        """Check if payable is overdue"""
        from django.utils import timezone
        if self.status in ['approved', 'pending']:
            return self.due_date < timezone.now().date()
        return False
