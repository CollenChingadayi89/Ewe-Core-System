from django.contrib import admin
from .models import Expense


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['expense_number', 'employee', 'category', 'amount', 'expense_date', 'status']
    list_filter = ['status', 'category', 'expense_date']
    search_fields = ['expense_number', 'employee__first_name', 'employee__last_name', 'description']
