"""
Finance Payable Serializers
Money going OUT from SACCO to vendors/suppliers.
Supports approval workflows and payment tracking.
"""

from rest_framework import serializers
from decimal import Decimal
from .models import Vendor, Payable


# ============================================================================
# VENDOR SERIALIZERS
# ============================================================================

class VendorListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for vendor list views.
    Includes contact information and active status.
    """
    vendor_type_display = serializers.CharField(source='get_vendor_type_display', read_only=True)
    payables_count = serializers.SerializerMethodField()
    total_outstanding = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = [
            'id',
            'vendor_code',
            'company_name',
            'contact_person',
            'email',
            'phone',
            'vendor_type',
            'vendor_type_display',
            'payment_terms',
            'is_active',
            'payables_count',
            'total_outstanding',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_payables_count(self, obj):
        """Get count of payables for this vendor"""
        return obj.payables.filter(status__in=['draft', 'pending', 'approved']).count()

    def get_total_outstanding(self, obj):
        """Get total outstanding amount for approved but unpaid payables"""
        from django.db.models import Sum
        result = obj.payables.filter(status__in=['approved', 'overdue']).aggregate(
            total=Sum('total_amount')
        )
        return float(result['total'] or 0)


class VendorDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for vendor detail views.
    Includes full information with banking and tax details.
    """
    vendor_type_display = serializers.CharField(source='get_vendor_type_display', read_only=True)
    recent_payables = serializers.SerializerMethodField()
    statistics = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = [
            # Basic Info
            'id',
            'vendor_code',
            'company_name',
            'contact_person',
            'email',
            'phone',
            'alternate_phone',

            # Address
            'address',
            'city',
            'province',
            'postal_code',
            'country',

            # Banking Details
            'bank_name',
            'branch',
            'account_number',
            'account_holder_name',
            'swift_code',

            # Tax Information
            'tax_id',

            # Additional Info
            'vendor_type',
            'vendor_type_display',
            'payment_terms',
            'notes',
            'is_active',

            # Timestamps
            'created_at',
            'updated_at',
            'created_by',
            'modified_by',

            # Related
            'recent_payables',
            'statistics',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_recent_payables(self, obj):
        """Get 5 most recent payables"""
        recent = obj.payables.all().order_by('-invoice_date')[:5]
        return [{
            'id': str(p.id),
            'payable_number': p.payable_number,
            'invoice_number': p.invoice_number,
            'total_amount': float(p.total_amount),
            'invoice_date': p.invoice_date.isoformat(),
            'due_date': p.due_date.isoformat(),
            'status': p.status,
            'status_display': p.get_status_display(),
        } for p in recent]

    def get_statistics(self, obj):
        """Get vendor payment statistics"""
        from django.db.models import Sum, Count, Q

        payables = obj.payables.all()
        total_payables = payables.count()

        stats = payables.aggregate(
            total_paid=Sum('total_amount', filter=Q(status='paid')),
            total_pending=Sum('total_amount', filter=Q(status__in=['approved', 'pending'])),
            count_paid=Count('id', filter=Q(status='paid')),
            count_pending=Count('id', filter=Q(status__in=['approved', 'pending'])),
        )

        return {
            'total_payables': total_payables,
            'total_paid': float(stats['total_paid'] or 0),
            'total_pending': float(stats['total_pending'] or 0),
            'count_paid': stats['count_paid'],
            'count_pending': stats['count_pending'],
        }


class VendorCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating vendors.
    Validates required fields and email format.
    """

    class Meta:
        model = Vendor
        fields = [
            'company_name',
            'contact_person',
            'email',
            'phone',
            'alternate_phone',
            'address',
            'city',
            'province',
            'postal_code',
            'country',
            'bank_name',
            'branch',
            'account_number',
            'account_holder_name',
            'swift_code',
            'tax_id',
            'vendor_type',
            'payment_terms',
            'notes',
            'is_active',
        ]

    def validate(self, attrs):
        """Validate vendor data"""
        # Validate that bank details are complete if any are provided
        bank_fields = ['bank_name', 'branch', 'account_number', 'account_holder_name']
        bank_values = [attrs.get(field) for field in bank_fields]

        # If any bank field is provided, require all
        if any(bank_values) and not all(bank_values):
            raise serializers.ValidationError({
                'bank_name': 'All banking details must be provided (bank name, branch, account number, account holder).'
            })

        return attrs


# ============================================================================
# PAYABLE SERIALIZERS
# ============================================================================

class PayableListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for payable list views.
    Includes vendor name and overdue status.
    """
    vendor_name = serializers.CharField(source='vendor.company_name', read_only=True)
    vendor_code = serializers.CharField(source='vendor.vendor_code', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_name = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Payable
        fields = [
            'id',
            'payable_number',
            'vendor',
            'vendor_name',
            'vendor_code',
            'invoice_number',
            'category',
            'category_display',
            'amount',
            'tax_amount',
            'total_amount',
            'currency',
            'invoice_date',
            'due_date',
            'collection_date',
            'status',
            'status_display',
            'priority',
            'is_overdue',
            'submitted_by',
            'submitted_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_amount']

    def get_submitted_by_name(self, obj):
        """Get name of submitter"""
        return obj.submitted_by.get_full_name()

    def get_is_overdue(self, obj):
        """Check if payable is overdue"""
        return obj.is_overdue()


class PayableDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for payable detail views.
    Includes nested vendor info and approval chain.
    """
    vendor_details = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_details = serializers.SerializerMethodField()
    current_approver_details = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Payable
        fields = [
            # Basic Info
            'id',
            'payable_number',
            'vendor',
            'vendor_details',

            # Invoice Details
            'invoice_number',
            'description',
            'category',
            'category_display',

            # Amount Details
            'amount',
            'currency',
            'tax_amount',
            'total_amount',

            # Dates
            'invoice_date',
            'due_date',
            'collection_date',
            'paid_date',

            # Payment Details
            'payment_method',
            'payment_reference',

            # Status & Approval
            'status',
            'status_display',
            'priority',
            'submitted_by',
            'submitted_by_details',
            'current_approver',
            'current_approver_details',
            'approval_chain',
            'approved_date',
            'rejection_reason',

            # Additional Info
            'attachments',
            'notes',
            'is_overdue',

            # Timestamps
            'created_at',
            'updated_at',
            'created_by',
            'modified_by',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_amount']

    def get_vendor_details(self, obj):
        """Get vendor information"""
        return {
            'id': str(obj.vendor.id),
            'vendor_code': obj.vendor.vendor_code,
            'company_name': obj.vendor.company_name,
            'contact_person': obj.vendor.contact_person,
            'phone': obj.vendor.phone,
            'email': obj.vendor.email,
            'vendor_type': obj.vendor.vendor_type,
            'vendor_type_display': obj.vendor.get_vendor_type_display(),
            'payment_terms': obj.vendor.payment_terms,
        }

    def get_submitted_by_details(self, obj):
        """Get submitter information"""
        return {
            'id': str(obj.submitted_by.id),
            'employee_number': obj.submitted_by.employee_number,
            'first_name': obj.submitted_by.first_name,
            'last_name': obj.submitted_by.last_name,
            'full_name': obj.submitted_by.get_full_name(),
        }

    def get_current_approver_details(self, obj):
        """Get current approver information"""
        if obj.current_approver:
            return {
                'id': str(obj.current_approver.id),
                'employee_number': obj.current_approver.employee_number,
                'first_name': obj.current_approver.first_name,
                'last_name': obj.current_approver.last_name,
                'full_name': obj.current_approver.get_full_name(),
            }
        return None

    def get_is_overdue(self, obj):
        """Check if payable is overdue"""
        return obj.is_overdue()


class PayableCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating payables.
    Validates amounts and date ranges.
    """

    class Meta:
        model = Payable
        fields = [
            'vendor',
            'invoice_number',
            'description',
            'category',
            'amount',
            'currency',
            'tax_amount',
            'invoice_date',
            'due_date',
            'collection_date',
            'payment_method',
            'payment_reference',
            'priority',
            'attachments',
            'notes',
            'submitted_by',
        ]

    def validate(self, attrs):
        """Comprehensive validation for payables"""
        amount = attrs.get('amount')
        tax_amount = attrs.get('tax_amount', Decimal('0'))

        # Validate amounts are positive
        if amount and amount <= 0:
            raise serializers.ValidationError({
                'amount': 'Amount must be greater than zero.'
            })

        if tax_amount and tax_amount < 0:
            raise serializers.ValidationError({
                'tax_amount': 'Tax amount cannot be negative.'
            })

        # Validate dates
        invoice_date = attrs.get('invoice_date')
        due_date = attrs.get('due_date')

        if invoice_date and due_date and invoice_date > due_date:
            raise serializers.ValidationError({
                'due_date': 'Due date must be on or after invoice date.'
            })

        collection_date = attrs.get('collection_date')
        if collection_date and invoice_date and collection_date < invoice_date:
            raise serializers.ValidationError({
                'collection_date': 'Collection date cannot be before invoice date.'
            })

        # Validate vendor is active
        vendor = attrs.get('vendor')
        if vendor and not vendor.is_active:
            raise serializers.ValidationError({
                'vendor': 'Cannot create payable for inactive vendor.'
            })

        return attrs
