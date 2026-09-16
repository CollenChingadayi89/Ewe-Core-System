from django.contrib import admin
from .models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    """Admin interface for Vehicle model"""
    list_display = [
        'registration_number', 'make', 'model', 'year', 'vehicle_type',
        'assigned_to', 'status', 'current_mileage', 'next_service_date'
    ]
    list_filter = [
        'status', 'vehicle_type', 'fuel_type', 'ownership_type',
        'condition', 'assignment_type'
    ]
    search_fields = [
        'registration_number', 'make', 'model', 'vin',
        'assigned_to__first_name', 'assigned_to__last_name'
    ]
    ordering = ['registration_number']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Vehicle Identification', {
            'fields': ('registration_number', 'make', 'model', 'year', 'vin', 'color')
        }),
        ('Vehicle Type & Specifications', {
            'fields': ('vehicle_type', 'fuel_type', 'ownership_type')
        }),
        ('Purchase Details', {
            'fields': ('purchase_date', 'purchase_price', 'current_value')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'assignment_date', 'assignment_type')
        }),
        ('Mileage Tracking', {
            'fields': ('current_mileage', 'mileage_last_updated')
        }),
        ('Service & Maintenance', {
            'fields': (
                'last_service_date', 'last_service_mileage',
                'next_service_date', 'next_service_mileage', 'service_interval_km'
            )
        }),
        ('Insurance', {
            'fields': (
                'insurance_company', 'insurance_policy_number',
                'insurance_expiry_date', 'insurance_premium'
            )
        }),
        ('Licensing', {
            'fields': ('license_disk_expiry',)
        }),
        ('Status & Condition', {
            'fields': ('status', 'condition')
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )
