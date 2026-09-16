from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.constants import ApprovalStatus, CURRENCY_CHOICES, PRIORITY_CHOICES


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
    Money going OUT from SACCO to vendors/suppliers.
    Represents bills, invoices, and payments to be made.
    """
    payable_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Payable Number',
        help_text='Unique identifier (e.g., PAY-2026-000001)'
    )

    # Vendor Information
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.PROTECT,
        related_name='payables',
        verbose_name='Vendor'
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
        choices=[
            ('utilities', 'Utilities'),
            ('rent', 'Rent'),
            ('supplies', 'Office Supplies'),
            ('equipment', 'Equipment'),
            ('services', 'Professional Services'),
            ('maintenance', 'Maintenance'),
            ('insurance', 'Insurance'),
            ('taxes', 'Taxes & Fees'),
            ('salaries', 'Salaries & Wages'),
            ('other', 'Other')
        ],
        default='other',
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
    approved_date = models.DateTimeField(blank=True, null=True, verbose_name='Approved Date')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Rejection Reason')

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
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['status', 'current_approver']),
        ]

    def __str__(self):
        return f"{self.payable_number} - {self.vendor.company_name} (ZWG {self.total_amount})"

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
