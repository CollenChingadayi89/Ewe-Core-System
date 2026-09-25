from rest_framework import serializers
from .models import Expense


class ExpenseSerializer(serializers.ModelSerializer):
    """Serializer for Expense model with validation"""

    # Read-only computed fields
    employee_name = serializers.SerializerMethodField()
    employee_number = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)

    class Meta:
        model = Expense
        fields = [
            'id', 'expense_number', 'employee', 'employee_name', 'employee_number',
            'employee_department', 'category', 'category_display', 'description',
            'amount', 'currency', 'currency_display', 'expense_date', 'submission_date',
            'receipt_number', 'attachments', 'status', 'status_display',
            'priority', 'priority_display', 'current_approver', 'approval_chain',
            'approved_by', 'approved_by_name', 'approved_date', 'rejection_reason',
            'paid_date', 'payment_method', 'payment_reference', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'expense_number', 'submission_date', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        """Get full name of employee"""
        return obj.employee.get_full_name() if obj.employee else None

    def get_employee_number(self, obj):
        """Get employee number"""
        return obj.employee.employee_number if obj.employee else None

    def get_employee_department(self, obj):
        """Get employee department"""
        if obj.employee and hasattr(obj.employee, 'department'):
            return obj.employee.department.name if obj.employee.department else None
        return None

    def get_approved_by_name(self, obj):
        """Get name of approver"""
        return obj.approved_by.get_full_name() if obj.approved_by else None

