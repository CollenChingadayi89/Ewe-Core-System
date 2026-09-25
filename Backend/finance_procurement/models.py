import uuid

from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.conf import settings
from core.models import BaseModel
from core.constants import ApprovalStatus, CURRENCY_CHOICES, PRIORITY_CHOICES


class ProcurementRequest(BaseModel):
    """
    Purchase requisitions and procurement requests.
    Formal requests for purchasing goods/services from vendors.
    """
    request_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Request Number',
        help_text='Unique identifier (e.g., PR-2026-000001)'
    )

    # Requester Information
    requested_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.PROTECT,
        related_name='procurement_requests',
        verbose_name='Requested By'
    )

    # Vendor Information (optional - may not be known at request time)
    vendor = models.ForeignKey(
        'finance_payable.Vendor',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='procurement_requests',
        verbose_name='Preferred Vendor'
    )

    # Item/Service Details
    item_description = models.TextField(verbose_name='Item/Service Description')
    category = models.CharField(
        max_length=50,
        choices=[
            ('equipment', 'Equipment'),
            ('furniture', 'Furniture'),
            ('office_supplies', 'Office Supplies'),
            ('it_hardware', 'IT Hardware'),
            ('software', 'Software'),
            ('services', 'Professional Services'),
            ('maintenance', 'Maintenance'),
            ('other', 'Other')
        ],
        default='other',
        verbose_name='Category'
    )

    # Quantity & Pricing
    quantity = models.IntegerField(default=1, verbose_name='Quantity')
    unit = models.CharField(
        max_length=20,
        default='pcs',
        verbose_name='Unit of Measurement',
        help_text='e.g., pcs, boxes, kg, liters, services'
    )
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Unit Price (ZWG)',
        help_text='Estimated or quoted price per unit'
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Total Amount (ZWG)',
        help_text='Quantity × Unit Price'
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='ZWG',
        verbose_name='Currency'
    )

    # Quotations (minimum 3 required) - Simplified to document-only
    quotations = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Vendor Quotations',
        help_text='Array of quotation documents: [{"vendor_name": "ABC Ltd", "document_url": "path/to/doc", "is_selected": true}]'
    )

    # Line Items (similar to petty cash)
    line_items = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Line Items',
        help_text='Array of items: [{"description": "Item", "quantity": 2, "unit": "pcs", "unit_price": 100.00, "amount": 200.00}]'
    )

    # Employee Assignment
    is_for_employee = models.BooleanField(
        default=False,
        verbose_name='Is for Specific Employee(s)',
        help_text='True if items are for individual employee(s), False if for organization'
    )
    assigned_employees = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Assigned Employees',
        help_text='Array of employee IDs when is_for_employee=True'
    )

    # Justification & Specifications
    business_justification = models.TextField(
        verbose_name='Business Justification',
        help_text='Why this purchase is necessary'
    )
    technical_specifications = models.TextField(
        blank=True,
        null=True,
        verbose_name='Technical Specifications',
        help_text='Detailed technical requirements or specifications'
    )
    budget_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Budget Code',
        help_text='Budget line item for this expense'
    )
    delivery_location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        verbose_name='Delivery Location',
        help_text='Where items should be delivered'
    )
    request_type = models.CharField(
        max_length=20,
        choices=[
            ('new', 'New Purchase'),
            ('replacement', 'Replacement'),
            ('rental', 'Rental'),
            ('lease', 'Lease'),
            ('service', 'Service Contract'),
            ('installment', 'Installment Purchase'),
        ],
        default='new',
        verbose_name='Request Type'
    )

    # Dates
    request_date = models.DateField(auto_now_add=True, verbose_name='Request Date')
    required_by_date = models.DateField(verbose_name='Required By Date')

    # Status & Approval
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('pending', 'Pending Approval'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected'),
            ('ordered', 'Ordered'),
            ('received', 'Received'),
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

    # Approval Workflow
    current_approver = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='pending_procurement_approvals',
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
        related_name='approved_procurement_requests',
        verbose_name='Approved By'
    )
    approved_date = models.DateTimeField(blank=True, null=True, verbose_name='Approved Date')
    rejection_reason = models.TextField(blank=True, null=True, verbose_name='Rejection Reason')

    # Purchase Order Details
    po_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Purchase Order Number',
        help_text='Generated after approval'
    )
    ordered_date = models.DateField(blank=True, null=True, verbose_name='Date Ordered')
    received_date = models.DateField(blank=True, null=True, verbose_name='Date Received')

    # Attachments
    attachments = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Attachments',
        help_text='URLs to quotes, specifications, or related documents'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Additional Notes')

    # Approval requests for this procurement (GenericRelation for prefetching; no DB column)
    approval_requests = GenericRelation(
        'approval.ApprovalRequest',
        content_type_field='content_type',
        object_id_field='object_id',
        related_query_name='procurement_request',
    )

    # Award: the final approver picks the winning quotation (its vendor becomes `vendor`)
    selected_quotation_index = models.PositiveSmallIntegerField(
        blank=True, null=True, verbose_name='Winning Quotation',
        help_text='Position of the winning quotation in `quotations`'
    )
    selection_reason = models.TextField(blank=True, null=True, verbose_name='Reason for Selection')
    selected_by = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='awarded_procurement_requests',
        verbose_name='Selected By'
    )
    selected_at = models.DateTimeField(blank=True, null=True, verbose_name='Selected At')

    class Meta:
        db_table = 'finance_procurement_request'
        verbose_name = 'Procurement Request'
        verbose_name_plural = 'Procurement Requests'
        ordering = ['-request_date', '-created_at']
        indexes = [
            models.Index(fields=['request_number']),
            models.Index(fields=['requested_by', 'status']),
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['status', 'current_approver']),
            models.Index(fields=['required_by_date']),
        ]

    def __str__(self):
        return f"{self.request_number} - {self.item_description[:50]} (ZWG {self.total_amount})"

    def save(self, *args, **kwargs):
        """Auto-generate request number and calculate total amount"""
        # Auto-generate request number if not provided
        if not self.request_number:
            from django.utils import timezone
            year = timezone.now().year

            # Get the last procurement request number for this year
            last_request = ProcurementRequest.objects.filter(
                request_number__startswith=f'PR-{year}-'
            ).order_by('request_number').last()

            if last_request and last_request.request_number:
                try:
                    last_sequence = int(last_request.request_number.split('-')[-1])
                    new_sequence = last_sequence + 1
                except (ValueError, IndexError):
                    new_sequence = 1
            else:
                new_sequence = 1

            self.request_number = f'PR-{year}-{new_sequence:06d}'

        # Auto-calculate total amount
        if self.unit_price:
            self.total_amount = self.quantity * self.unit_price

        super().save(*args, **kwargs)

    def validate_final_approval(self):
        """Approval-engine hook: the final approver must award a quotation before approving."""
        if self.selected_quotation_index is None:
            return 'Select the winning quotation (with a reason) before giving final approval.'
        return None

    def on_final_approval(self):
        """Approval-engine hook: create the procurement record for the awarded vendor."""
        from .records import create_procurement_record
        create_procurement_record(self)


class ProcurementRecord(BaseModel):
    """
    Created when a procurement request is finally approved: links the purchase to the
    winning vendor and tracks what is owed through an installment schedule.
    """
    class Frequency(models.TextChoices):
        ONCE = 'once', 'Single payment'
        WEEKLY = 'weekly', 'Weekly'
        MONTHLY = 'monthly', 'Monthly'
        QUARTERLY = 'quarterly', 'Quarterly'

    class Status(models.TextChoices):
        AWAITING_TERMS = 'awaiting_terms', 'Awaiting Payment Terms'
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Fully Paid'
        CANCELLED = 'cancelled', 'Cancelled'

    record_number = models.CharField(max_length=50, unique=True, verbose_name='Record Number')
    procurement = models.OneToOneField(
        ProcurementRequest, on_delete=models.PROTECT, related_name='record', verbose_name='Procurement Request'
    )
    vendor = models.ForeignKey(
        'finance_payable.Vendor', on_delete=models.PROTECT, related_name='procurement_records', verbose_name='Vendor'
    )
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='ZWG', verbose_name='Currency')

    # Payment terms
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Total Amount')
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Deposit')
    installment_count = models.PositiveSmallIntegerField(default=1, verbose_name='Number of Installments')
    frequency = models.CharField(max_length=10, choices=Frequency.choices, default=Frequency.ONCE, verbose_name='Frequency')
    first_due_date = models.DateField(blank=True, null=True, verbose_name='First Due Date')
    terms_set_by = models.ForeignKey(
        'hr_employee.Employee', on_delete=models.SET_NULL, blank=True, null=True,
        related_name='procurement_terms_set', verbose_name='Terms Set By'
    )
    terms_set_at = models.DateTimeField(blank=True, null=True, verbose_name='Terms Set At')

    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.AWAITING_TERMS, verbose_name='Status'
    )

    class Meta:
        db_table = 'finance_procurement_record'
        verbose_name = 'Procurement Record'
        verbose_name_plural = 'Procurement Records'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['vendor', 'status']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"{self.record_number} - {self.vendor.company_name} ({self.currency} {self.total_amount})"


class ProcurementInstallment(models.Model):
    """One scheduled payment on a procurement record (sequence 0 is the deposit)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    record = models.ForeignKey(ProcurementRecord, on_delete=models.CASCADE, related_name='installments')
    sequence = models.PositiveSmallIntegerField(verbose_name='Sequence')
    label = models.CharField(max_length=50, verbose_name='Label')
    due_date = models.DateField(verbose_name='Due Date')
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Amount')
    # Only changed by finance_procurement.services.apply_payable_payment, under a row lock
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='Amount Paid')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'finance_procurement_installment'
        ordering = ['record', 'sequence']
        constraints = [
            models.UniqueConstraint(fields=['record', 'sequence'], name='unique_installment_sequence'),
            models.CheckConstraint(
                condition=models.Q(amount_paid__lte=models.F('amount')) & models.Q(amount_paid__gte=0),
                name='installment_paid_within_amount',
            ),
        ]

    def __str__(self):
        return f"{self.record.record_number} - {self.label}"

    @property
    def outstanding(self):
        return self.amount - self.amount_paid

    @property
    def status(self) -> str:
        if self.amount_paid >= self.amount:
            return 'paid'
        return 'partially_paid' if self.amount_paid > 0 else 'pending'


class ProcurementPayment(models.Model):
    """
    Immutable ledger of money paid against an installment (the audit trail).
    Created only when a linked payable is marked paid; never edited or deleted.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    installment = models.ForeignKey(ProcurementInstallment, on_delete=models.PROTECT, related_name='payments')
    payable = models.ForeignKey(
        'finance_payable.Payable', on_delete=models.PROTECT, related_name='procurement_payments'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='Amount')
    paid_date = models.DateField(verbose_name='Paid Date')
    recorded_by = models.ForeignKey(
        'hr_employee.Employee', on_delete=models.PROTECT, related_name='procurement_payments_recorded'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'finance_procurement_payment'
        ordering = ['-paid_date', '-created_at']
        constraints = [
            models.UniqueConstraint(fields=['installment', 'payable'], name='unique_payment_per_payable_installment'),
            models.CheckConstraint(condition=models.Q(amount__gt=0), name='procurement_payment_positive'),
        ]

    def __str__(self):
        return f"{self.installment} - {self.amount} ({self.paid_date})"
