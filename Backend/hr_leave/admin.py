from django.contrib import admin
from .models import LeavePolicy, LeaveTransaction, LeaveRequest, PublicHoliday, WorkingHours


@admin.register(LeavePolicy)
class LeavePolicyAdmin(admin.ModelAdmin):
    list_display = ['code', 'display_name', 'leave_type', 'annual_entitlement_days', 'is_active']
    list_filter = ['leave_type', 'is_active', 'is_statutory']
    search_fields = ['code', 'display_name', 'leave_type']


@admin.register(LeaveTransaction)
class LeaveTransactionAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_policy', 'transaction_type', 'days', 'transaction_date']
    list_filter = ['transaction_type', 'leave_policy', 'transaction_date']
    search_fields = ['employee__first_name', 'employee__last_name']
    readonly_fields = ['created_at']


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_policy', 'start_date', 'end_date', 'total_days', 'status']
    list_filter = ['status', 'leave_policy', 'start_date']
    search_fields = ['employee__first_name', 'employee__last_name', 'reason']


@admin.register(PublicHoliday)
class PublicHolidayAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'is_recurring']
    list_filter = ['is_recurring', 'date']
    search_fields = ['name']


@admin.register(WorkingHours)
class WorkingHoursAdmin(admin.ModelAdmin):
    list_display = ['name', 'work_start_time', 'work_end_time', 'total_work_hours_per_day', 'is_default']
    list_filter = ['is_default', 'is_active']
    search_fields = ['name']
