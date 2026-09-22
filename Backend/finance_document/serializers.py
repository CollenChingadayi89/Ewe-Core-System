"""
Finance Document Serializers
Handles Invoice, Estimate, and Payment serialization
"""

from rest_framework import serializers
from .models import Invoice, Estimate, Payment


# ============================================================================
# INVOICE SERIALIZERS
# ============================================================================

class InvoiceListSerializer(serializers.ModelSerializer):
    """List view serializer for invoices"""
    client_name = serializers.CharField(source='client.full_name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'invoice_date', 'due_date', 'client',
            'client_name', 'subtotal', 'tax_amount', 'discount_amount',
            'total_amount', 'amount_paid', 'amount_due', 'currency',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']


class InvoiceDetailSerializer(serializers.ModelSerializer):
    """Detail view serializer for invoices"""
    client_details = serializers.SerializerMethodField()
    project_details = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']

    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'client_number': obj.client.client_number,
                'full_name': f"{obj.client.first_name} {obj.client.last_name}",
                'email': obj.client.email,
            }
        return None

    def get_project_details(self, obj):
        if obj.project:
            return {
                'id': obj.project.id,
                'project_number': obj.project.project_number,
                'project_name': obj.project.project_name,
            }
        return None


class InvoiceCreateUpdateSerializer(serializers.ModelSerializer):
    """Create/Update serializer for invoices"""
    class Meta:
        model = Invoice
        fields = [
            'invoice_date', 'due_date', 'client', 'billing_address',
            'billing_email', 'subtotal', 'tax_rate', 'tax_amount',
            'discount_amount', 'total_amount', 'amount_paid', 'amount_due',
            'currency', 'line_items', 'payment_terms', 'payment_terms_notes',
            'status', 'project', 'deal', 'notes', 'attachments', 'is_active'
        ]


# ============================================================================
# ESTIMATE SERIALIZERS
# ============================================================================

class EstimateListSerializer(serializers.ModelSerializer):
    """List view serializer for estimates"""
    client_name = serializers.CharField(source='client.full_name', read_only=True)

    class Meta:
        model = Estimate
        fields = [
            'id', 'estimate_number', 'estimate_date', 'valid_until', 'client',
            'client_name', 'subtotal', 'tax_amount', 'discount_amount',
            'total_amount', 'currency', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'estimate_number', 'created_at', 'updated_at']


class EstimateDetailSerializer(serializers.ModelSerializer):
    """Detail view serializer for estimates"""
    client_details = serializers.SerializerMethodField()
    converted_invoice_details = serializers.SerializerMethodField()

    class Meta:
        model = Estimate
        fields = '__all__'
        read_only_fields = ['id', 'estimate_number', 'created_at', 'updated_at']

    def get_client_details(self, obj):
        if obj.client:
            return {
                'id': obj.client.id,
                'client_number': obj.client.client_number,
                'full_name': f"{obj.client.first_name} {obj.client.last_name}",
                'email': obj.client.email,
            }
        return None

    def get_converted_invoice_details(self, obj):
        if obj.converted_to_invoice:
            return {
                'id': obj.converted_to_invoice.id,
                'invoice_number': obj.converted_to_invoice.invoice_number,
                'status': obj.converted_to_invoice.status,
            }
        return None


class EstimateCreateUpdateSerializer(serializers.ModelSerializer):
    """Create/Update serializer for estimates"""
    class Meta:
        model = Estimate
        fields = [
            'estimate_date', 'valid_until', 'client', 'billing_address',
            'contact_email', 'subtotal', 'tax_rate', 'tax_amount',
            'discount_amount', 'total_amount', 'currency', 'line_items',
            'payment_terms', 'status', 'deal', 'notes', 'attachments',
            'converted_to_invoice', 'is_active'
        ]


# ============================================================================
# PAYMENT SERIALIZERS
# ============================================================================

class PaymentListSerializer(serializers.ModelSerializer):
    """List view serializer for payments"""
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    client_name = serializers.CharField(source='invoice.client.full_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_number', 'payment_date', 'invoice', 'invoice_number',
            'client_name', 'amount', 'currency', 'payment_method', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'payment_number', 'created_at', 'updated_at']


class PaymentDetailSerializer(serializers.ModelSerializer):
    """Detail view serializer for payments"""
    invoice_details = serializers.SerializerMethodField()
    processed_by_details = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'payment_number', 'created_at', 'updated_at']

    def get_invoice_details(self, obj):
        if obj.invoice:
            return {
                'id': obj.invoice.id,
                'invoice_number': obj.invoice.invoice_number,
                'total_amount': str(obj.invoice.total_amount),
                'amount_paid': str(obj.invoice.amount_paid),
                'amount_due': str(obj.invoice.amount_due),
            }
        return None

    def get_processed_by_details(self, obj):
        if obj.processed_by:
            return {
                'id': obj.processed_by.id,
                'employee_number': obj.processed_by.employee_number,
                'full_name': obj.processed_by.full_name,
            }
        return None


class PaymentCreateUpdateSerializer(serializers.ModelSerializer):
    """Create/Update serializer for payments"""
    class Meta:
        model = Payment
        fields = [
            'payment_date', 'invoice', 'amount', 'currency', 'payment_method',
            'transaction_reference', 'payment_gateway', 'payment_gateway_response',
            'bank_name', 'account_number', 'cheque_number', 'mobile_number',
            'mobile_money_provider', 'notes', 'status', 'processed_by',
            'attachments', 'is_active'
        ]
