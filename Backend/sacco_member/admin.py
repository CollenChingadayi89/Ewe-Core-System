from django.contrib import admin
from .models import Member


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    """Admin interface for SACCO Member model"""
    list_display = ['member_number', 'get_full_name', 'email', 'phone', 'account_status', 'join_date', 'outstanding_loan_balance', 'savings_balance']
    list_filter = ['account_status', 'membership_type', 'loan_status', 'credit_score', 'join_date']
    search_fields = ['member_number', 'first_name', 'last_name', 'email', 'phone', 'national_id']
    ordering = ['member_number']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    fieldsets = (
        ('Member Identification', {
            'fields': ('member_number', 'membership_type')
        }),
        ('Personal Information', {
            'fields': ('first_name', 'middle_name', 'last_name', 'email', 'phone', 'alternate_phone',
                      'national_id', 'date_of_birth', 'gender')
        }),
        ('Address', {
            'fields': ('address', 'city', 'province', 'postal_code', 'country')
        }),
        ('Employment', {
            'fields': ('occupation', 'employer', 'employer_address', 'monthly_income')
        }),
        ('Membership Details', {
            'fields': ('branch', 'join_date', 'account_status')
        }),
        ('Share Capital', {
            'fields': ('shares_owned', 'share_value', 'share_certificate_number')
        }),
        ('Savings', {
            'fields': ('savings_balance', 'deposits_this_month', 'withdrawals_this_month',
                      'deposits_ytd', 'withdrawals_ytd'),
            'classes': ('collapse',)
        }),
        ('Loans', {
            'fields': ('active_loans_count', 'total_loan_amount', 'outstanding_loan_balance',
                      'monthly_installment', 'next_payment_due', 'loan_status'),
            'classes': ('collapse',)
        }),
        ('Dividends', {
            'fields': ('last_dividend_amount', 'total_dividends_earned', 'current_dividend_rate'),
            'classes': ('collapse',)
        }),
        ('Activity & Credit', {
            'fields': ('last_transaction_date', 'transaction_count', 'credit_score'),
            'classes': ('collapse',)
        }),
        ('Next of Kin', {
            'fields': ('next_of_kin_name', 'next_of_kin_relationship', 'next_of_kin_phone', 'next_of_kin_address'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': ('created_at', 'updated_at', 'created_by', 'modified_by'),
            'classes': ('collapse',)
        }),
    )
