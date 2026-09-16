from django.contrib import admin
from .models import Asset


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['asset_number', 'name', 'category', 'assigned_to', 'status', 'condition']
    list_filter = ['category', 'status', 'condition']
    search_fields = ['asset_number', 'name', 'serial_number']
