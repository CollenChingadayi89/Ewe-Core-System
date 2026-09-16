from django.contrib import admin
from .models import ProcurementRequest


@admin.register(ProcurementRequest)
class ProcurementRequestAdmin(admin.ModelAdmin):
    list_display = ['request_number', 'requested_by', 'item_description', 'total_amount', 'status', 'required_by_date']
    list_filter = ['status', 'category', 'priority', 'request_date']
    search_fields = ['request_number', 'item_description', 'requested_by__first_name']
