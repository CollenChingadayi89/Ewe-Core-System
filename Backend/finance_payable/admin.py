from django.contrib import admin
from .models import Vendor, Payable


@admin.register(Vendor)
class VendorAdmin(admin.ModelAdmin):
    list_display = ['vendor_code', 'company_name', 'email', 'phone', 'is_active']
    list_filter = ['is_active', 'vendor_type']
    search_fields = ['vendor_code', 'company_name', 'email']


@admin.register(Payable)
class PayableAdmin(admin.ModelAdmin):
    list_display = ['payable_number', 'payee_type', 'vendor', 'member', 'currency', 'total_amount', 'due_date', 'status']
    list_filter = ['status', 'payee_type', 'category', 'currency', 'due_date']
    search_fields = ['payable_number', 'invoice_number', 'description', 'member__member_number']
    raw_id_fields = ['vendor', 'member', 'submitted_by', 'approved_by', 'paid_by']
