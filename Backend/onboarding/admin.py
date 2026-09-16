from django.contrib import admin
from .models import Onboarding


@admin.register(Onboarding)
class OnboardingAdmin(admin.ModelAdmin):
    """Admin interface for Onboarding model"""
    list_display = [
        'onboarding_number', 'employee', 'start_date',
        'completion_percentage', 'status', 'hr_coordinator'
    ]
    list_filter = ['status', 'start_date', 'probation_passed']
    search_fields = [
        'onboarding_number', 'employee__first_name',
        'employee__last_name', 'employee__employee_number'
    ]
    ordering = ['-start_date', '-created_at']
    readonly_fields = [
        'completion_percentage', 'created_at', 'updated_at',
        'created_by', 'modified_by'
    ]

    fieldsets = (
        ('Employee Information', {
            'fields': ('employee', 'onboarding_number')
        }),
        ('Dates', {
            'fields': ('start_date', 'expected_completion_date', 'actual_completion_date')
        }),
        ('Team Assignment', {
            'fields': ('assigned_buddy', 'hr_coordinator')
        }),
        ('Progress Tracking', {
            'fields': (
                'checklist', 'total_tasks', 'completed_tasks',
                'completion_percentage'
            )
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Feedback & Assessment', {
            'fields': (
                'feedback_30_days', 'feedback_60_days', 'feedback_90_days',
                'probation_passed'
            )
        }),
        ('Equipment & Access', {
            'fields': ('equipment_issued', 'access_granted')
        }),
        ('Training', {
            'fields': ('training_completed',)
        }),
        ('Additional Information', {
            'fields': ('notes',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )
