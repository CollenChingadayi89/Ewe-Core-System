from django.db import models
from core.models import BaseModel


class Asset(BaseModel):
    """
    IT assets and equipment tracking.
    Manages computers, furniture, and other organizational assets.
    """
    asset_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Asset Number',
        help_text='Unique asset identifier (e.g., AST-2026-001)'
    )
    name = models.CharField(max_length=200, verbose_name='Asset Name')
    category = models.CharField(
        max_length=50,
        choices=[
            ('computer', 'Computer/Laptop'),
            ('monitor', 'Monitor'),
            ('printer', 'Printer'),
            ('phone', 'Phone/Mobile'),
            ('furniture', 'Furniture'),
            ('equipment', 'Office Equipment'),
            ('other', 'Other')
        ],
        default='other',
        verbose_name='Category'
    )
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    serial_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Serial Number'
    )
    manufacturer = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Manufacturer'
    )
    model = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Model'
    )

    # Purchase Details
    purchase_date = models.DateField(blank=True, null=True, verbose_name='Purchase Date')
    purchase_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Purchase Price (ZWG)'
    )
    supplier = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Supplier'
    )

    # Current Value & Status
    current_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Current Value (ZWG)'
    )
    condition = models.CharField(
        max_length=20,
        choices=[
            ('new', 'New'),
            ('good', 'Good'),
            ('fair', 'Fair'),
            ('poor', 'Poor'),
            ('damaged', 'Damaged')
        ],
        default='good',
        verbose_name='Condition'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('available', 'Available'),
            ('assigned', 'Assigned'),
            ('in_repair', 'In Repair'),
            ('disposed', 'Disposed'),
            ('lost', 'Lost/Stolen')
        ],
        default='available',
        verbose_name='Status'
    )

    # Assignment
    assigned_to = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='assigned_assets',
        verbose_name='Assigned To'
    )
    assignment_date = models.DateField(blank=True, null=True, verbose_name='Assignment Date')
    location = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Location'
    )

    # Warranty
    warranty_expiry = models.DateField(blank=True, null=True, verbose_name='Warranty Expiry Date')

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        db_table = 'asset'
        verbose_name = 'Asset'
        verbose_name_plural = 'Assets'
        ordering = ['asset_number']
        indexes = [
            models.Index(fields=['asset_number']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['assigned_to']),
        ]

    def __str__(self):
        return f"{self.asset_number} - {self.name}"
