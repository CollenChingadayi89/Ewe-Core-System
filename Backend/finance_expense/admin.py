from django.contrib import admin
from django.utils.html import format_html
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = [
        'expense_number',
        'employee',
        'category',
        'formatted_amount',  # Custom method to show currency + amount
        'expense_date',
        'status_badge',      # Custom method for colored status
        'priority'
    ]
    list_filter = ['status', 'category', 'priority', 'currency', 'expense_date', 'submission_date']
    search_fields = ['expense_number', 'employee__first_name', 'employee__last_name', 'description']
    readonly_fields = ['expense_number', 'submission_date', 'created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('expense_number', 'employee', 'category', 'description')
        }),
        ('Amount Details', {
            'fields': ('amount', 'currency', 'expense_date', 'submission_date')
        }),
        ('Receipt/Documentation', {
            'fields': ('receipt_number', 'attachments')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority')
        }),
        ('Approval Details', {
            'fields': ('current_approver', 'approval_chain', 'approved_by', 'approved_date', 'rejection_reason'),
            'classes': ('collapse',)
        }),
        ('Payment Details', {
            'fields': ('paid_date', 'payment_method', 'payment_reference'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def formatted_amount(self, obj):
        """Display amount with currency"""
        return f"{obj.currency} {obj.amount:,.2f}"
    formatted_amount.short_description = 'Amount'
    formatted_amount.admin_order_field = 'amount'

    def status_badge(self, obj):
        """Display status with color badge"""
        colors = {
            'draft': '#gray',
            'pending': '#FFA500',
            'approved': '#00d084',
            'rejected': '#ff4d4f',
            'paid': '#1890ff',
            'cancelled': '#d9d9d9'
        }
        color = colors.get(obj.status, '#gray')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    status_badge.admin_order_field = 'status'
