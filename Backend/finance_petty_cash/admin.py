from django.contrib import admin
from .models import PettyCash


@admin.register(PettyCash)
class PettyCashAdmin(admin.ModelAdmin):
    list_display = ['petty_cash_number', 'employee', 'amount', 'category', 'status', 'request_date']
    list_filter = ['status', 'category', 'request_date']
    search_fields = ['petty_cash_number', 'employee__first_name', 'employee__last_name', 'purpose']
