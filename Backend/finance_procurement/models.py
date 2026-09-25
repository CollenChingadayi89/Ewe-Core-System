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
            ('service', 'Service Contract')
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
