from rest_framework import serializers
from .models import PettyCash


class PettyCashSerializer(serializers.ModelSerializer):
    """Serializer for PettyCash model with validation"""

    # Read-only computed fields
    employee_name = serializers.SerializerMethodField()
    employee_number = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    verified_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    disbursed_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    currency_display = serializers.CharField(source='get_currency_display', read_only=True)

    class Meta:
        model = PettyCash
        fields = [
            'id', 'petty_cash_number', 'employee', 'employee_name', 'employee_number',
            'employee_department', 'amount', 'currency', 'currency_display', 'purpose',
            'line_items', 'category', 'category_display', 'justification', 'receipt_expected',
            'account_code', 'request_date', 'required_by_date', 'status', 'status_display',
            'priority', 'priority_display', 'verified_by', 'verified_by_name', 'verified_date',
            'approved_by', 'approved_by_name', 'approved_date', 'rejection_reason',
            'disbursed_by', 'disbursed_by_name', 'disbursed_date', 'receipt_number',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'petty_cash_number', 'request_date', 'created_at', 'updated_at']

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

    def get_verified_by_name(self, obj):
        """Get name of verifier"""
        return obj.verified_by.get_full_name() if obj.verified_by else None

    def get_approved_by_name(self, obj):
        """Get name of approver"""
        return obj.approved_by.get_full_name() if obj.approved_by else None

    def get_disbursed_by_name(self, obj):
        """Get name of person who disbursed"""
        if obj.disbursed_by:
            return f"{obj.disbursed_by.first_name} {obj.disbursed_by.last_name}".strip()
        return None

    def validate_line_items(self, value):
        """Validate line items structure"""
        if not value:
            return value

        if not isinstance(value, list):
            raise serializers.ValidationError('Line items must be an array')

        for idx, item in enumerate(value):
            # Validate each line item has required fields
            if not isinstance(item, dict):
                raise serializers.ValidationError(f'Line item {idx + 1} must be an object')

            required_fields = ['description', 'quantity', 'unit_price', 'amount', 'currency']
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(f'Line item {idx + 1} missing required field: {field}')

            # Validate currency field
            if item['currency'] not in ['ZWG', 'USD']:
                raise serializers.ValidationError(f'Line item {idx + 1}: currency must be either ZWG or USD')

            # Validate numeric values
            try:
                quantity = float(item['quantity'])
                unit_price = float(item['unit_price'])
                amount = float(item['amount'])

                if quantity <= 0:
                    raise serializers.ValidationError(f'Line item {idx + 1}: quantity must be greater than 0')
                if unit_price < 0:
                    raise serializers.ValidationError(f'Line item {idx + 1}: unit_price cannot be negative')
                if amount < 0:
                    raise serializers.ValidationError(f'Line item {idx + 1}: amount cannot be negative')

                # Verify calculation (allow small floating point differences)
                expected_amount = quantity * unit_price
                if abs(amount - expected_amount) > 0.01:
                    raise serializers.ValidationError(
                        f'Line item {idx + 1}: amount ({amount}) does not match quantity × unit_price ({expected_amount})'
                    )
            except (ValueError, TypeError) as e:
                raise serializers.ValidationError(f'Line item {idx + 1}: invalid numeric value - {str(e)}')

        return value

    def validate(self, data):
        """Validate petty cash request"""
        amount = data.get('amount')
        justification = data.get('justification')
        line_items = data.get('line_items', [])

        # If line items exist, validate that amount matches total
        if line_items:
            calculated_total = sum(float(item['amount']) for item in line_items)
            if amount and abs(float(amount) - calculated_total) > 0.01:
                raise serializers.ValidationError({
                    'amount': f'Total amount ({amount}) must match sum of line items ({calculated_total})'
                })

        # Require justification for high-value requests (> 5000 in any currency)
        if amount and amount > 5000 and not justification:
            raise serializers.ValidationError({
                'justification': 'Justification is required for amounts greater than 5000'
            })

        return data

