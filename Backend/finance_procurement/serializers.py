from rest_framework import serializers
from .models import ProcurementRequest
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .services import get_quotation_document_path


class ProcurementRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for ProcurementRequest model with quotations validation
    """

    # Read-only fields for display
    employee_name = serializers.SerializerMethodField()
    employee_department = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    vendor_name = serializers.SerializerMethodField()

    class Meta:
        model = ProcurementRequest
        fields = '__all__'
        read_only_fields = ['request_number', 'request_date', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        """Get the full name of the requesting employee"""
        if obj.requested_by:
            return obj.requested_by.get_full_name()
        return None

    def get_employee_department(self, obj):
        """Get the department of the requesting employee"""
        if obj.requested_by and obj.requested_by.department:
            return obj.requested_by.department.name
        return None

    def get_approved_by_name(self, obj):
        """Get the full name of the final approver"""
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None

    def get_vendor_name(self, obj):
        """Get the preferred vendor's company name"""
        if obj.vendor:
            return obj.vendor.company_name
        return None

    def validate_quotations(self, value):
        """
        Validate quotations and their uploaded documents.

        File metadata (file_path etc.) is attached by the view after it stores the
        uploads, and the view signals this via the 'quotation_documents_attached'
        context flag. Without that flag quotations are rejected, so a client can never
        point a quotation at an arbitrary file in storage (e.g. via PUT/PATCH).
        Note: Winner selection happens later during procurement approval process,
        not at initial request stage.
        """
        if not self.context.get('quotation_documents_attached'):
            raise serializers.ValidationError(
                "Quotations can only be submitted with their documents when creating a request."
            )

        if not isinstance(value, list):
            raise serializers.ValidationError("Quotations must be an array")

        # Require minimum 3 quotations for approval
        if len(value) < 3:
            raise serializers.ValidationError(
                f"Minimum 3 quotation documents required. You have provided {len(value)}."
            )

        for idx, quotation in enumerate(value):
            if not isinstance(quotation, dict):
                raise serializers.ValidationError(f"Quotation {idx + 1}: Must be an object")

            vendor_name = quotation.get('vendor_name')
            if not isinstance(vendor_name, str) or not vendor_name.strip():
                raise serializers.ValidationError(
                    f"Quotation {idx + 1}: Vendor name cannot be empty"
                )

            if not get_quotation_document_path(quotation):
                raise serializers.ValidationError(
                    f"Quotation {idx + 1}: A quotation document is required"
                )

        return value

    def to_representation(self, instance):
        """Hide internal storage paths; expose only whether a document can be viewed."""
        data = super().to_representation(instance)
        data['quotations'] = [
            {
                'vendor_name': q.get('vendor_name'),
                'is_selected': bool(q.get('is_selected')),
                'file_name': q.get('file_name') or q.get('document_url'),
                'file_size': q.get('file_size'),
                'content_type': q.get('content_type'),
                'has_document': get_quotation_document_path(q) is not None,
            }
            for q in (data.get('quotations') or [])
            if isinstance(q, dict)
        ]
        return data

    def validate_line_items(self, value):
        """
        Validate line items structure (similar to petty cash)
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Line items must be an array")

        # Require at least 1 line item
        if len(value) == 0:
            raise serializers.ValidationError("At least one line item is required")

        required_fields = ['description', 'quantity', 'unit', 'unit_price', 'amount']

        for idx, item in enumerate(value):
            # Check if item is a dict
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f"Line item {idx + 1}: Must be an object/dict"
                )

            # Check required fields
            for field in required_fields:
                if field not in item:
                    raise serializers.ValidationError(
                        f"Line item {idx + 1}: Missing required field '{field}'"
                    )

            # Validate description
            if not item['description'] or not str(item['description']).strip():
                raise serializers.ValidationError(
                    f"Line item {idx + 1}: Description cannot be empty"
                )

            # Validate numeric fields
            try:
                quantity = float(item['quantity'])
                if quantity <= 0:
                    raise serializers.ValidationError(
                        f"Line item {idx + 1}: Quantity must be greater than zero"
                    )
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    f"Line item {idx + 1}: Invalid quantity format"
                )

            try:
                unit_price = float(item['unit_price'])
                if unit_price < 0:
                    raise serializers.ValidationError(
                        f"Line item {idx + 1}: Unit price cannot be negative"
                    )
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    f"Line item {idx + 1}: Invalid unit price format"
                )

            try:
                amount = float(item['amount'])
                if amount < 0:
                    raise serializers.ValidationError(
                        f"Line item {idx + 1}: Amount cannot be negative"
                    )
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    f"Line item {idx + 1}: Invalid amount format"
                )

            # Verify calculation: amount = quantity × unit_price
            expected_amount = quantity * unit_price
            if abs(amount - expected_amount) > 0.01:  # Allow 0.01 tolerance for floating point
                raise serializers.ValidationError(
                    f"Line item {idx + 1}: Amount ({amount}) does not match quantity × unit_price ({expected_amount})"
                )

        return value

    def validate_assigned_employees(self, value):
        """
        Validate assigned employees array
        """
        if not isinstance(value, list):
            raise serializers.ValidationError("Assigned employees must be an array")

        return value

    def validate_required_by_date(self, value):
        """
        Validate that required by date is at least 14 days from today
        to allow time for quotation collection process
        """
        if value:
            today = timezone.now().date()
            min_required_date = today + timedelta(days=14)

            if value < min_required_date:
                raise serializers.ValidationError(
                    f"Required by date must be at least 14 days from today (minimum: {min_required_date.strftime('%d/%m/%Y')}). "
                    "This allows time for quotation collection and approval process."
                )

        return value

    def validate_priority(self, value):
        """
        Validate priority - High/Urgent requires stronger justification
        """
        # This will be checked in validate() method where we have access to all fields
        return value

    def validate(self, data):
        """
        Object-level validation
        """
        # Check if high/urgent priority has sufficient justification
        priority = data.get('priority', 'medium')
        justification = data.get('business_justification', '')

        if priority in ['high', 'urgent']:
            if len(justification) < 100:
                raise serializers.ValidationError({
                    'business_justification': (
                        f"High/Urgent priority requests require detailed justification "
                        f"(minimum 100 characters). You have provided {len(justification)} characters."
                    )
                })

        # Validate line items total matches total_amount
        line_items = data.get('line_items', [])
        total_amount = data.get('total_amount')

        if line_items and total_amount is not None:
            # total_amount is a Decimal (DecimalField); compare in Decimal to avoid
            # float/Decimal arithmetic errors. str() avoids float binary artefacts.
            calculated_total = sum(
                (Decimal(str(item['amount'])) for item in line_items), Decimal('0')
            )
            if abs(calculated_total - total_amount) > Decimal('0.01'):
                raise serializers.ValidationError({
                    'total_amount': (
                        f"Total amount ({total_amount}) does not match "
                        f"sum of line items ({calculated_total})"
                    )
                })

        # Validate assigned_employees based on is_for_employee flag
        is_for_employee = data.get('is_for_employee', False)
        assigned_employees = data.get('assigned_employees', [])

        if is_for_employee and not assigned_employees:
            raise serializers.ValidationError({
                'assigned_employees': (
                    "When 'is_for_employee' is True, at least one employee must be assigned"
                )
            })

        if not is_for_employee and assigned_employees:
            raise serializers.ValidationError({
                'assigned_employees': (
                    "When 'is_for_employee' is False, assigned_employees should be empty"
                )
            })

        return data

    def create(self, validated_data):
        """
        Create procurement request with auto-approval workflow trigger
        """
        # The model's save() method will auto-generate request_number
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Update procurement request
        """
        # Prevent modification of certain fields after approval
        if instance.status in ['approved', 'ordered', 'received']:
            immutable_fields = ['quantity', 'unit_price', 'total_amount', 'item_description']
            for field in immutable_fields:
                if field in validated_data and validated_data[field] != getattr(instance, field):
                    raise serializers.ValidationError({
                        field: f"Cannot modify {field} after procurement request has been approved"
                    })

        return super().update(instance, validated_data)
