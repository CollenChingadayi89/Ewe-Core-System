from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.validators import min_value_zero, validate_positive_decimal
from core.constants import CURRENCY_CHOICES


class Invoice(BaseModel):
    """
    Client invoices for services rendered or products sold.
    Supports partial payments and tracks payment status.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('viewed', 'Viewed'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]

    PAYMENT_TERMS_CHOICES = [
        ('immediate', 'Due Immediately'),
        ('net_7', 'Net 7 Days'),
        ('net_15', 'Net 15 Days'),
        ('net_30', 'Net 30 Days'),
        ('net_60', 'Net 60 Days'),
        ('net_90', 'Net 90 Days'),
        ('eom', 'End of Month'),
        ('custom', 'Custom Terms'),
    ]

    # Invoice Identification
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Invoice Number',
        help_text='Unique invoice identifier (e.g., INV-2026-001)'
    )
    invoice_date = models.DateField(verbose_name='Invoice Date')
    due_date = models.DateField(verbose_name='Due Date')

    # Client Information
    client = models.ForeignKey(
        'crm.Client',
        on_delete=models.PROTECT,
        related_name='invoices',
        verbose_name='Client'
    )
    billing_address = models.TextField(verbose_name='Billing Address')
    billing_email = models.EmailField(blank=True, null=True, verbose_name='Billing Email')

    # Amounts
    subtotal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[min_value_zero],
        verbose_name='Subtotal',
        help_text='Amount before tax and discounts'
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Tax Rate (%)'
    )
    tax_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Tax Amount'
    )
    discount_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Discount Amount'
    )
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[min_value_zero],
        verbose_name='Total Amount'
    )
    amount_paid = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Amount Paid'
    )
    amount_due = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[min_value_zero],
        verbose_name='Amount Due'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )

    # Line Items (stored as JSON)
    line_items = models.JSONField(
        default=list,
        verbose_name='Line Items',
        help_text='Array of invoice line items with description, quantity, unit_price, amount'
    )

    # Payment Terms
    payment_terms = models.CharField(
        max_length=20,
        choices=PAYMENT_TERMS_CHOICES,
        default='net_30',
        verbose_name='Payment Terms'
    )
    payment_terms_notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Payment Terms Notes'
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='Status'
    )

    # References
    project = models.ForeignKey(
        'crm.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        verbose_name='Project'
    )
    deal = models.ForeignKey(
        'crm.Deal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        verbose_name='Deal'
    )
    estimate = models.ForeignKey(
        'Estimate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        verbose_name='Related Estimate'
    )

    # Tracking
    sent_date = models.DateTimeField(null=True, blank=True, verbose_name='Sent Date')
    viewed_date = models.DateTimeField(null=True, blank=True, verbose_name='First Viewed Date')
    paid_date = models.DateTimeField(null=True, blank=True, verbose_name='Fully Paid Date')

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes/Terms')
    internal_notes = models.TextField(blank=True, null=True, verbose_name='Internal Notes')
    tags = models.JSONField(default=list, blank=True, verbose_name='Tags')
    custom_fields = models.JSONField(default=dict, blank=True, verbose_name='Custom Fields')

    class Meta:
        db_table = 'finance_invoice'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-invoice_date', '-invoice_number']
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['invoice_date']),
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.client} ({self.currency} {self.total_amount})"

    def calculate_totals(self):
        """Calculate total amounts from line items"""
        self.amount_due = self.total_amount - self.amount_paid
        self.save(update_fields=['amount_due'])

    def is_overdue(self):
        """Check if invoice is overdue"""
        from django.utils import timezone
        if self.status not in ['paid', 'cancelled', 'refunded']:
            return self.due_date < timezone.now().date()
        return False


class Estimate(BaseModel):
    """
    Price estimates/quotations for potential clients.
    Can be converted to invoices once accepted.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('viewed', 'Viewed'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    # Estimate Identification
    estimate_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Estimate Number',
        help_text='Unique estimate identifier (e.g., EST-2026-001)'
    )
    estimate_date = models.DateField(verbose_name='Estimate Date')
    expiry_date = models.DateField(verbose_name='Expiry Date')

    # Client Information
    client = models.ForeignKey(
        'crm.Client',
        on_delete=models.PROTECT,
        related_name='estimates',
        verbose_name='Client'
    )
    billing_address = models.TextField(verbose_name='Billing Address')
    billing_email = models.EmailField(blank=True, null=True, verbose_name='Billing Email')

    # Amounts
    subtotal = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[min_value_zero],
        verbose_name='Subtotal'
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Tax Rate (%)'
    )
    tax_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Tax Amount'
    )
    discount_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Discount Amount'
    )
    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[min_value_zero],
        verbose_name='Total Amount'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )

    # Line Items (stored as JSON)
    line_items = models.JSONField(
        default=list,
        verbose_name='Line Items',
        help_text='Array of estimate line items with description, quantity, unit_price, amount'
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        verbose_name='Status'
    )

    # References
    project = models.ForeignKey(
        'crm.Project',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estimates',
        verbose_name='Project'
    )
    deal = models.ForeignKey(
        'crm.Deal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estimates',
        verbose_name='Deal'
    )

    # Tracking
    sent_date = models.DateTimeField(null=True, blank=True, verbose_name='Sent Date')
    viewed_date = models.DateTimeField(null=True, blank=True, verbose_name='First Viewed Date')
    accepted_date = models.DateTimeField(null=True, blank=True, verbose_name='Accepted Date')
    declined_date = models.DateTimeField(null=True, blank=True, verbose_name='Declined Date')
    decline_reason = models.TextField(blank=True, null=True, verbose_name='Decline Reason')

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes/Terms')
    internal_notes = models.TextField(blank=True, null=True, verbose_name='Internal Notes')
    tags = models.JSONField(default=list, blank=True, verbose_name='Tags')
    custom_fields = models.JSONField(default=dict, blank=True, verbose_name='Custom Fields')

    class Meta:
        db_table = 'finance_estimate'
        verbose_name = 'Estimate'
        verbose_name_plural = 'Estimates'
        ordering = ['-estimate_date', '-estimate_number']
        indexes = [
            models.Index(fields=['estimate_number']),
            models.Index(fields=['client', 'status']),
            models.Index(fields=['estimate_date']),
            models.Index(fields=['expiry_date', 'status']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.estimate_number} - {self.client} ({self.currency} {self.total_amount})"

    def is_expired(self):
        """Check if estimate is expired"""
        from django.utils import timezone
        if self.status not in ['accepted', 'declined', 'cancelled']:
            return self.expiry_date < timezone.now().date()
        return False

    def convert_to_invoice(self, invoice_date, due_date, payment_terms='net_30'):
        """Convert accepted estimate to invoice"""
        if self.status != 'accepted':
            raise ValueError("Only accepted estimates can be converted to invoices")

        from django.utils import timezone
        invoice_number = f"INV-{timezone.now().year}-{Invoice.objects.count() + 1:05d}"

        invoice = Invoice.objects.create(
            invoice_number=invoice_number,
            invoice_date=invoice_date,
            due_date=due_date,
            client=self.client,
            billing_address=self.billing_address,
            billing_email=self.billing_email,
            subtotal=self.subtotal,
            tax_rate=self.tax_rate,
            tax_amount=self.tax_amount,
            discount_amount=self.discount_amount,
            total_amount=self.total_amount,
            amount_paid=0,
            amount_due=self.total_amount,
            currency=self.currency,
            line_items=self.line_items,
            payment_terms=payment_terms,
            status='draft',
            project=self.project,
            deal=self.deal,
            estimate=self,
            notes=self.notes,
            internal_notes=self.internal_notes,
            tags=self.tags,
            custom_fields=self.custom_fields,
        )
        return invoice


class Payment(BaseModel):
    """
    Payment records for invoices.
    Tracks all payments received from clients.
    """
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
        ('ecocash', 'EcoCash'),
        ('onemoney', 'OneMoney'),
        ('innbucks', 'InnBucks'),
        ('check', 'Check/Cheque'),
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('paypal', 'PayPal'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
        ('cancelled', 'Cancelled'),
    ]

    # Payment Identification
    payment_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Payment Number',
        help_text='Unique payment identifier (e.g., PAY-2026-001)'
    )
    payment_date = models.DateField(verbose_name='Payment Date')
    payment_time = models.TimeField(auto_now_add=True, verbose_name='Payment Time')

    # Invoice Reference
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name='payments',
        verbose_name='Invoice'
    )

    # Client Information
    client = models.ForeignKey(
        'crm.Client',
        on_delete=models.PROTECT,
        related_name='payments',
        verbose_name='Client'
    )

    # Payment Details
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[validate_positive_decimal],
        verbose_name='Amount'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        verbose_name='Payment Method'
    )

    # Payment Method Specific Details
    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Transaction Reference',
        help_text='Bank ref, mobile money ref, check number, etc.'
    )
    bank_name = models.CharField(max_length=100, blank=True, null=True, verbose_name='Bank Name')
    check_number = models.CharField(max_length=50, blank=True, null=True, verbose_name='Check Number')
    check_date = models.DateField(blank=True, null=True, verbose_name='Check Date')

    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Status'
    )

    # Processing Details
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='processed_payments',
        verbose_name='Processed By'
    )
    processed_date = models.DateTimeField(null=True, blank=True, verbose_name='Processed Date')

    # Refund Information
    refund_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
        validators=[min_value_zero],
        verbose_name='Refund Amount'
    )
    refund_date = models.DateField(null=True, blank=True, verbose_name='Refund Date')
    refund_reason = models.TextField(blank=True, null=True, verbose_name='Refund Reason')

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')
    tags = models.JSONField(default=list, blank=True, verbose_name='Tags')
    custom_fields = models.JSONField(default=dict, blank=True, verbose_name='Custom Fields')

    class Meta:
        db_table = 'finance_payment'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date', '-payment_time']
        indexes = [
            models.Index(fields=['payment_number']),
            models.Index(fields=['invoice', 'status']),
            models.Index(fields=['client', 'payment_date']),
            models.Index(fields=['payment_date']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_method']),
        ]

    def __str__(self):
        return f"{self.payment_number} - {self.invoice.invoice_number} ({self.currency} {self.amount})"

    def save(self, *args, **kwargs):
        """Update invoice amounts when payment is saved"""
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # Update invoice amounts
        if self.status == 'completed':
            self.invoice.amount_paid += self.amount
            self.invoice.amount_due = self.invoice.total_amount - self.invoice.amount_paid

            # Update invoice status
            if self.invoice.amount_due <= 0:
                self.invoice.status = 'paid'
                self.invoice.paid_date = self.payment_date
            elif self.invoice.amount_paid > 0:
                self.invoice.status = 'partially_paid'

            self.invoice.save(update_fields=['amount_paid', 'amount_due', 'status', 'paid_date'])
