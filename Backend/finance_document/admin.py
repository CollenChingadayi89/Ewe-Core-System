from django.contrib import admin
from .models import Invoice, Estimate, Payment


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """
    Admin interface for Invoice model.
    Manages client invoices and tracks payment status.
    """
    list_display = [
        'invoice_number',
        'invoice_date',
        'client',
        'total_amount',
        'amount_paid',
        'amount_due',
        'currency',
        'status',
        'due_date'
    ]
    list_filter = [
        'status',
        'currency',
        'payment_terms',
        'invoice_date',
        'due_date',
        'created_at'
    ]
    search_fields = [
        'invoice_number',
        'client__first_name',
        'client__last_name',
        'client__email',
        'billing_email'
    ]
    readonly_fields = [
        'id',
        'invoice_number',
        'amount_paid',
        'amount_due',
        'sent_date',
        'viewed_date',
        'paid_date',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['client', 'project', 'deal', 'estimate']
    date_hierarchy = 'invoice_date'
    ordering = ['-invoice_date']

    fieldsets = (
        ('Invoice Information', {
            'fields': (
                'id',
                'invoice_number',
                'invoice_date',
                'due_date',
                'status'
            )
        }),
        ('Client Details', {
            'fields': (
                'client',
                'billing_address',
                'billing_email'
            )
        }),
        ('Amounts', {
            'fields': (
                'subtotal',
                'tax_rate',
                'tax_amount',
                'discount_amount',
                'total_amount',
                'amount_paid',
                'amount_due',
                'currency'
            )
        }),
        ('Line Items', {
            'fields': ('line_items',),
            'classes': ('collapse',)
        }),
        ('Payment Terms', {
            'fields': (
                'payment_terms',
                'payment_terms_notes'
            )
        }),
        ('References', {
            'fields': ('project', 'deal', 'estimate'),
            'classes': ('collapse',)
        }),
        ('Tracking', {
            'fields': (
                'sent_date',
                'viewed_date',
                'paid_date'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'internal_notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Audit Trail', {
            'fields': (
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(Estimate)
class EstimateAdmin(admin.ModelAdmin):
    """
    Admin interface for Estimate model.
    Manages price estimates and quotations.
    """
    list_display = [
        'estimate_number',
        'estimate_date',
        'client',
        'total_amount',
        'currency',
        'status',
        'expiry_date'
    ]
    list_filter = [
        'status',
        'currency',
        'estimate_date',
        'expiry_date',
        'created_at'
    ]
    search_fields = [
        'estimate_number',
        'client__first_name',
        'client__last_name',
        'client__email',
        'billing_email'
    ]
    readonly_fields = [
        'id',
        'estimate_number',
        'sent_date',
        'viewed_date',
        'accepted_date',
        'declined_date',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['client', 'project', 'deal']
    date_hierarchy = 'estimate_date'
    ordering = ['-estimate_date']

    fieldsets = (
        ('Estimate Information', {
            'fields': (
                'id',
                'estimate_number',
                'estimate_date',
                'expiry_date',
                'status'
            )
        }),
        ('Client Details', {
            'fields': (
                'client',
                'billing_address',
                'billing_email'
            )
        }),
        ('Amounts', {
            'fields': (
                'subtotal',
                'tax_rate',
                'tax_amount',
                'discount_amount',
                'total_amount',
                'currency'
            )
        }),
        ('Line Items', {
            'fields': ('line_items',),
            'classes': ('collapse',)
        }),
        ('References', {
            'fields': ('project', 'deal'),
            'classes': ('collapse',)
        }),
        ('Tracking', {
            'fields': (
                'sent_date',
                'viewed_date',
                'accepted_date',
                'declined_date',
                'decline_reason'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'internal_notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Audit Trail', {
            'fields': (
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """
    Admin interface for Payment model.
    Tracks all payments received from clients.
    """
    list_display = [
        'payment_number',
        'payment_date',
        'invoice',
        'client',
        'amount',
        'currency',
        'payment_method',
        'status',
        'processed_by'
    ]
    list_filter = [
        'status',
        'payment_method',
        'currency',
        'payment_date',
        'created_at'
    ]
    search_fields = [
        'payment_number',
        'invoice__invoice_number',
        'client__first_name',
        'client__last_name',
        'transaction_reference',
        'check_number'
    ]
    readonly_fields = [
        'id',
        'payment_number',
        'payment_time',
        'processed_date',
        'created_at',
        'updated_at',
        'created_by',
        'modified_by'
    ]
    autocomplete_fields = ['invoice', 'client', 'processed_by']
    date_hierarchy = 'payment_date'
    ordering = ['-payment_date', '-payment_time']

    fieldsets = (
        ('Payment Information', {
            'fields': (
                'id',
                'payment_number',
                'payment_date',
                'payment_time',
                'status'
            )
        }),
        ('Invoice & Client', {
            'fields': (
                'invoice',
                'client'
            )
        }),
        ('Payment Details', {
            'fields': (
                'amount',
                'currency',
                'payment_method',
                'transaction_reference',
                'bank_name',
                'check_number',
                'check_date'
            )
        }),
        ('Processing', {
            'fields': (
                'processed_by',
                'processed_date'
            )
        }),
        ('Refund Information', {
            'fields': (
                'refund_amount',
                'refund_date',
                'refund_reason'
            ),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes', 'tags', 'custom_fields'),
            'classes': ('collapse',)
        }),
        ('Audit Trail', {
            'fields': (
                'created_at',
                'updated_at',
                'created_by',
                'modified_by'
            ),
            'classes': ('collapse',)
        }),
    )
