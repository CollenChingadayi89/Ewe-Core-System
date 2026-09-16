from django.contrib import admin
from .models import Receivable, ReceivablePayment


class ReceivablePaymentInline(admin.TabularInline):
    """Inline admin for receivable payments"""
    model = ReceivablePayment
    extra = 0
    fields = ['payment_number', 'payment_date', 'amount_paid', 'payment_method', 'reference_number']
    readonly_fields = ['payment_number', 'created_at']


@admin.register(Receivable)
class ReceivableAdmin(admin.ModelAdmin):
    """Admin interface for Receivable model"""
    list_display = ['receivable_number', 'member', 'category', 'amount', 'outstanding_balance', 'due_date', 'status', 'submitted_by']
    list_filter = ['status', 'category', 'priority', 'is_recurring', 'transaction_date', 'due_date']
    search_fields = ['receivable_number', 'member__member_number', 'member__first_name', 'member__last_name', 'description']
    ordering = ['-transaction_date', '-created_at']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by', 'outstanding_balance']
    inlines = [ReceivablePaymentInline]

    fieldsets = (
        ('Receivable Identification', {
            'fields': ('receivable_number', 'member', 'category')
        }),
        ('Amount Details', {
            'fields': ('amount', 'currency', 'amount_paid', 'outstanding_balance')
        }),
        ('Dates', {
            'fields': ('transaction_date', 'due_date', 'collection_date')
        }),
        ('Description', {
            'fields': ('description', 'notes')
        }),
        ('Loan Details', {
            'fields': ('loan_account_number', 'installment_number', 'total_installments',
                      'principal_amount', 'interest_amount', 'interest_rate'),
            'classes': ('collapse',)
        }),
        ('Share Purchase Details', {
            'fields': ('share_certificate_number', 'number_of_shares', 'share_price'),
            'classes': ('collapse',)
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority')
        }),
        ('Approval Workflow', {
            'fields': ('submitted_by', 'approved_by', 'approved_date', 'rejection_reason')
        }),
        ('Payment Tracking', {
            'fields': ('is_recurring', 'payment_method', 'reference_number')
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ReceivablePayment)
class ReceivablePaymentAdmin(admin.ModelAdmin):
    """Admin interface for Receivable Payment model"""
    list_display = ['payment_number', 'receivable', 'payment_date', 'amount_paid', 'payment_method', 'recorded_by']
    list_filter = ['payment_method', 'payment_date']
    search_fields = ['payment_number', 'receivable__receivable_number', 'reference_number']
    ordering = ['-payment_date', '-created_at']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Payment Identification', {
            'fields': ('payment_number', 'receivable')
        }),
        ('Payment Details', {
            'fields': ('payment_date', 'amount_paid', 'payment_method', 'reference_number')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Audit', {
            'fields': ('recorded_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
