from django.db import models
from core.models import BaseModel


class Vehicle(BaseModel):
    """
    Fleet management for SACCO vehicles.
    Tracks registration, assignment, maintenance, and insurance.
    """
    # Vehicle Identification
    registration_number = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Registration Number',
        help_text='Vehicle registration/license plate number'
    )
    make = models.CharField(max_length=50, verbose_name='Make/Manufacturer')
    model = models.CharField(max_length=50, verbose_name='Model')
    year = models.IntegerField(verbose_name='Year of Manufacture')
    vin = models.CharField(
        max_length=17,
        unique=True,
        blank=True,
        null=True,
        verbose_name='VIN',
        help_text='Vehicle Identification Number (17 characters)'
    )
    color = models.CharField(max_length=30, blank=True, null=True, verbose_name='Color')

    # Vehicle Type
    vehicle_type = models.CharField(
        max_length=50,
        choices=[
            ('sedan', 'Sedan'),
            ('suv', 'SUV'),
            ('truck', 'Truck'),
            ('van', 'Van/Minibus'),
            ('motorcycle', 'Motorcycle'),
            ('other', 'Other')
        ],
        default='sedan',
        verbose_name='Vehicle Type'
    )
    fuel_type = models.CharField(
        max_length=20,
        choices=[
            ('petrol', 'Petrol/Gasoline'),
            ('diesel', 'Diesel'),
            ('electric', 'Electric'),
            ('hybrid', 'Hybrid')
        ],
        default='petrol',
        verbose_name='Fuel Type'
    )

    # Ownership & Purchase
    ownership_type = models.CharField(
        max_length=20,
        choices=[
            ('owned', 'Owned'),
            ('leased', 'Leased'),
            ('rented', 'Rented')
        ],
        default='owned',
        verbose_name='Ownership Type'
    )
    purchase_date = models.DateField(blank=True, null=True, verbose_name='Purchase Date')
    purchase_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Purchase Price (ZWG)'
    )
    current_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Current Value (ZWG)'
    )

    # Assignment
    assigned_to = models.ForeignKey(
        'hr_employee.Employee',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='assigned_vehicles',
        verbose_name='Assigned To'
    )
    assignment_date = models.DateField(blank=True, null=True, verbose_name='Assignment Date')
    assignment_type = models.CharField(
        max_length=20,
        choices=[
            ('permanent', 'Permanent Assignment'),
            ('temporary', 'Temporary Assignment'),
            ('pool', 'Pool Vehicle')
        ],
        default='pool',
        verbose_name='Assignment Type'
    )

    # Mileage Tracking
    current_mileage = models.IntegerField(
        default=0,
        verbose_name='Current Mileage (km)',
        help_text='Odometer reading in kilometers'
    )
    mileage_last_updated = models.DateField(
        blank=True,
        null=True,
        verbose_name='Mileage Last Updated'
    )

    # Service & Maintenance
    last_service_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Last Service Date'
    )
    last_service_mileage = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Last Service Mileage (km)'
    )
    next_service_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Next Service Date'
    )
    next_service_mileage = models.IntegerField(
        blank=True,
        null=True,
        verbose_name='Next Service Mileage (km)',
        help_text='Mileage at which next service is due'
    )
    service_interval_km = models.IntegerField(
        default=5000,
        verbose_name='Service Interval (km)',
        help_text='Kilometers between services'
    )

    # Insurance
    insurance_company = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Insurance Company'
    )
    insurance_policy_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Insurance Policy Number'
    )
    insurance_expiry_date = models.DateField(
        blank=True,
        null=True,
        verbose_name='Insurance Expiry Date'
    )
    insurance_premium = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name='Insurance Premium (ZWG)'
    )

    # Licensing
    license_disk_expiry = models.DateField(
        blank=True,
        null=True,
        verbose_name='License Disk Expiry Date',
        help_text='Vehicle license/road tax expiry'
    )

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active/In Service'),
            ('maintenance', 'Under Maintenance'),
            ('repair', 'Under Repair'),
            ('inactive', 'Inactive'),
            ('sold', 'Sold'),
            ('written_off', 'Written Off')
        ],
        default='active',
        verbose_name='Status'
    )
    condition = models.CharField(
        max_length=20,
        choices=[
            ('excellent', 'Excellent'),
            ('good', 'Good'),
            ('fair', 'Fair'),
            ('poor', 'Poor')
        ],
        default='good',
        verbose_name='Condition'
    )

    # Additional Info
    notes = models.TextField(blank=True, null=True, verbose_name='Notes')

    class Meta:
        db_table = 'vehicle'
        verbose_name = 'Vehicle'
        verbose_name_plural = 'Vehicles'
        ordering = ['registration_number']
        indexes = [
            models.Index(fields=['registration_number']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['status']),
            models.Index(fields=['next_service_date']),
            models.Index(fields=['insurance_expiry_date']),
        ]

    def __str__(self):
        return f"{self.registration_number} - {self.make} {self.model} ({self.year})"

    def is_service_due(self):
        """Check if vehicle is due for service"""
        from django.utils import timezone

        # Check date-based service
        if self.next_service_date and self.next_service_date <= timezone.now().date():
            return True

        # Check mileage-based service
        if self.next_service_mileage and self.current_mileage >= self.next_service_mileage:
            return True

        return False

    def is_insurance_expired(self):
        """Check if insurance is expired"""
        from django.utils import timezone
        if self.insurance_expiry_date:
            return self.insurance_expiry_date < timezone.now().date()
        return False

    def is_license_expired(self):
        """Check if license disk is expired"""
        from django.utils import timezone
        if self.license_disk_expiry:
            return self.license_disk_expiry < timezone.now().date()
        return False
