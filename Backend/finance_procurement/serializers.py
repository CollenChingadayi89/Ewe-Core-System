from rest_framework import serializers
from .models import ProcurementInstallment, ProcurementPayment, ProcurementRecord, ProcurementRequest
from finance_payable.models import Vendor
from django.utils import timezone
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
    selected_by_name = serializers.SerializerMethodField()
    approval = serializers.SerializerMethodField()
    record = serializers.SerializerMethodField()

    class Meta:
        model = ProcurementRequest
        fields = '__all__'
        # The award (winning quotation, vendor) is only set through the award action
        read_only_fields = [
            'request_number', 'request_date', 'created_at', 'updated_at',
            'vendor', 'selected_quotation_index', 'selection_reason', 'selected_by', 'selected_at',
        ]

    def get_selected_by_name(self, obj):
        return obj.selected_by.get_full_name() if obj.selected_by else None

    def get_approval(self, obj):
        from approval.services import approval_summary
        from .records import get_approval_request
        return approval_summary(get_approval_request(obj), self.context.get('employee_id'))

    def get_record(self, obj):
        """The procurement record created on final approval, if any."""
        try:
            record = obj.record
        except ProcurementRecord.DoesNotExist:
            return None
        return {'id': str(record.id), 'record_number': record.record_number, 'status': record.status}

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

        if not all(isinstance(q, dict) for q in value):
            raise serializers.ValidationError("Each quotation must be an object")

        # Each quotation comes from a vendor on record; names are taken from the vendor
        vendor_ids = [str(q.get('vendor_id') or '') for q in value]
        vendors = {
            str(v.id): v for v in Vendor.objects.filter(id__in=[i for i in vendor_ids if i], is_active=True)
        }
        for idx, (quotation, vendor_id) in enumerate(zip(value, vendor_ids)):
            vendor = vendors.get(vendor_id)
            if vendor is None:
                raise serializers.ValidationError(
                    f"Quotation {idx + 1}: Select an active vendor/supplier"
                )
            quotation['vendor_id'] = vendor_id
            quotation['vendor_name'] = vendor.company_name
            quotation['is_selected'] = False  # the winner is chosen at final approval

            if not get_quotation_document_path(quotation):
                raise serializers.ValidationError(
                    f"Quotation {idx + 1}: A quotation document is required"
                )

        if len(set(vendor_ids)) != len(vendor_ids):
            raise serializers.ValidationError("Each quotation must come from a different vendor/supplier")

        return value

    def to_representation(self, instance):
        """Hide internal storage paths; expose only whether a document can be viewed."""
        data = super().to_representation(instance)
        data['quotations'] = [
            {
                'vendor_id': q.get('vendor_id'),
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
        """Required by date can be today or later (not in the past)."""
        if value and value < timezone.localdate():
            raise serializers.ValidationError("Required by date cannot be in the past.")
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



# ============================================================================
# PROCUREMENT RECORDS (installments and payments)
# ============================================================================

class ProcurementPaymentSerializer(serializers.ModelSerializer):
    """Read-only ledger entry."""
    payable_number = serializers.CharField(source='payable.payable_number', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)
    installment_label = serializers.CharField(source='installment.label', read_only=True)

    class Meta:
        model = ProcurementPayment
        fields = ['id', 'installment', 'installment_label', 'payable', 'payable_number',
                  'amount', 'paid_date', 'recorded_by_name', 'created_at']
        read_only_fields = fields


class ProcurementInstallmentSerializer(serializers.ModelSerializer):
    outstanding = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    status = serializers.CharField(read_only=True)
    reserved_by = serializers.SerializerMethodField()

    class Meta:
        model = ProcurementInstallment
        fields = ['id', 'sequence', 'label', 'due_date', 'amount', 'amount_paid', 'outstanding', 'status', 'reserved_by']
        read_only_fields = fields

    def get_reserved_by(self, obj):
        """Open payable currently covering this installment, if any."""
        from .records import OPEN_PAYABLE_STATUSES
        for link in obj.payable_links.all():
            if link.payable.status in OPEN_PAYABLE_STATUSES:
                return {'id': str(link.payable_id), 'payable_number': link.payable.payable_number}
        return None


class ProcurementRecordSerializer(serializers.ModelSerializer):
    """Procurement record with its schedule; payments are included on the detail view."""
    procurement_number = serializers.CharField(source='procurement.request_number', read_only=True)
    item_description = serializers.CharField(source='procurement.item_description', read_only=True)
    requested_by_name = serializers.CharField(source='procurement.requested_by.get_full_name', read_only=True)
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    vendor_code = serializers.CharField(source='vendor.vendor_code', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    terms_set_by_name = serializers.SerializerMethodField()
    amount_paid = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()
    next_due = serializers.SerializerMethodField()
    installments = ProcurementInstallmentSerializer(many=True, read_only=True)
    can_edit_terms = serializers.SerializerMethodField()
    terms_locked_reason = serializers.SerializerMethodField()

    class Meta:
        model = ProcurementRecord
        fields = [
            'id', 'record_number', 'procurement', 'procurement_number', 'item_description', 'requested_by_name',
            'vendor', 'vendor_name', 'vendor_code', 'currency', 'total_amount', 'deposit_amount',
            'installment_count', 'frequency', 'frequency_display', 'first_due_date', 'status', 'status_display',
            'terms_set_by_name', 'terms_set_at', 'amount_paid', 'balance', 'next_due', 'installments',
            'can_edit_terms', 'terms_locked_reason', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def _paid(self, obj):
        return sum((i.amount_paid for i in obj.installments.all()), Decimal('0'))

    def get_terms_set_by_name(self, obj):
        return obj.terms_set_by.get_full_name() if obj.terms_set_by else None

    def get_amount_paid(self, obj):
        return f"{self._paid(obj):.2f}"

    def get_balance(self, obj):
        return f"{obj.total_amount - self._paid(obj):.2f}"

    def get_next_due(self, obj):
        upcoming = [i for i in obj.installments.all() if i.amount_paid < i.amount]
        if not upcoming:
            return None
        nxt = upcoming[0]
        return {'label': nxt.label, 'due_date': nxt.due_date, 'outstanding': f"{nxt.outstanding:.2f}"}

    def get_can_edit_terms(self, obj):
        from .records import can_edit_terms
        request = self.context.get('request')
        return bool(request and can_edit_terms(obj, request.user))

    def get_terms_locked_reason(self, obj):
        # Only computed on the detail view (one record) to keep the list query-count flat
        if not self.context.get('include_payments'):
            return None
        from .records import terms_locked_reason
        return terms_locked_reason(obj)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self.context.get('include_payments'):
            payments = ProcurementPayment.objects.filter(installment__record=instance).select_related(
                'payable', 'recorded_by', 'installment'
            )
            data['payments'] = ProcurementPaymentSerializer(payments, many=True).data
        return data


class ScheduleRowSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=50, required=False, allow_blank=True)
    due_date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))


class PaymentTermsSerializer(serializers.Serializer):
    """Terms entered by the requester/Finance; `installments` are the (optionally adjusted) rows."""
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0.01'))
    deposit_amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0'), default=Decimal('0'))
    installment_count = serializers.IntegerField(min_value=1, max_value=120)
    frequency = serializers.ChoiceField(choices=ProcurementRecord.Frequency.choices)
    first_due_date = serializers.DateField()
    installments = ScheduleRowSerializer(many=True, required=False)


class OutstandingInstallmentSerializer(serializers.ModelSerializer):
    """Installments a vendor payable can settle (payables form picker)."""
    record_id = serializers.UUIDField(source='record.id', read_only=True)
    record_number = serializers.CharField(source='record.record_number', read_only=True)
    procurement_number = serializers.CharField(source='record.procurement.request_number', read_only=True)
    item_description = serializers.CharField(source='record.procurement.item_description', read_only=True)
    currency = serializers.CharField(source='record.currency', read_only=True)
    outstanding = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ProcurementInstallment
        fields = ['id', 'record_id', 'record_number', 'procurement_number', 'item_description',
                  'label', 'due_date', 'amount', 'amount_paid', 'outstanding', 'currency']
        read_only_fields = fields
