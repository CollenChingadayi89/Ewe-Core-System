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

    # Justification
    business_justification = models.TextField(
        verbose_name='Business Justification',
        help_text='Why this purchase is necessary'
    )
    budget_code = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Budget Code',
        help_text='Budget line item for this expense'
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
        """Auto-calculate total amount"""
        if self.unit_price:
            self.total_amount = self.quantity * self.unit_price
        super().save(*args, **kwargs)
