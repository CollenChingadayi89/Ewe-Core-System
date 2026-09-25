"""
Finance Payable Serializers
Money going OUT from SACCO to vendors/suppliers.
Supports approval workflows and payment tracking.
"""

from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from approval.services import PAY_ACTION, approval_summary
from core.constants import PayableCategory, PayeeType

from .models import Vendor, Payable, PayableDateChange
from .services import get_approval_request


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

BANK_TRANSFER = 'Bank Transfer'
MOBILE_MONEY = 'Mobile Money'
BANK_FIELDS = ['pay_to_bank_name', 'pay_to_bank_branch', 'pay_to_account_number', 'pay_to_account_name']
PAY_TO_FIELDS = [*BANK_FIELDS, 'pay_to_mobile_number']
# Payee details each payment method needs (branch is optional); other details are cleared
PAY_TO_REQUIRED = {
    BANK_TRANSFER: ['pay_to_bank_name', 'pay_to_account_number', 'pay_to_account_name'],
    MOBILE_MONEY: ['pay_to_mobile_number'],
}
PAY_TO_ALLOWED = {
    BANK_TRANSFER: BANK_FIELDS,
    MOBILE_MONEY: ['pay_to_mobile_number'],
}


class RescheduleSerializer(serializers.Serializer):
    collection_date = serializers.DateField()
    reason = serializers.CharField(max_length=1000)


class PayableDateChangeSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = PayableDateChange
        fields = ['id', 'old_date', 'new_date', 'reason', 'changed_by_name', 'stage_name', 'created_at']
        read_only_fields = fields


class PayableReadMixin(serializers.Serializer):
    """Payee, approval and payment fields shared by the list and detail serializers."""
    payee_type_display = serializers.CharField(source='get_payee_type_display', read_only=True)
    payee_name = serializers.CharField(read_only=True)
    payee_reference = serializers.CharField(read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_name = serializers.CharField(source='submitted_by.get_full_name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    paid_by_name = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    approval = serializers.SerializerMethodField()
    can_mark_paid = serializers.SerializerMethodField()
    procurement_installments = serializers.SerializerMethodField()

    def get_procurement_installments(self, obj):
        """Procurement installments this payable settles (uses the view's prefetch)."""
        return [
            {
                'id': str(link.installment_id),
                'record_id': str(link.installment.record_id),
                'record_number': link.installment.record.record_number,
                'procurement_number': link.installment.record.procurement.request_number,
                'item_description': link.installment.record.procurement.item_description,
                'label': link.installment.label,
                'due_date': link.installment.due_date,
                'amount': f"{link.amount:.2f}",
            }
            for link in obj.installment_links.all()
        ]

    def get_approved_by_name(self, obj):
        return obj.approved_by.get_full_name() if obj.approved_by else None

    def get_paid_by_name(self, obj):
        return obj.paid_by.get_full_name() if obj.paid_by else None

    def get_is_overdue(self, obj):
        return obj.is_overdue()

    def _approval(self, obj):
        # Computed once per object; approval and can_mark_paid both need it
        cache = self.context.setdefault('_approval_cache', {})
        if obj.pk not in cache:
            cache[obj.pk] = approval_summary(get_approval_request(obj), self.context.get('employee_id'))
        return cache[obj.pk]

    def get_approval(self, obj):
        return self._approval(obj)

    def get_can_mark_paid(self, obj):
        approval = self._approval(obj)
        return bool(
            obj.status == 'approved' and approval
            and approval['can_act'] and approval['current_action_type'] == PAY_ACTION
        )


COLLECTION_FIELDS = ['in_person_collection', 'collector_name', 'collector_id_number', 'collector_phone']
# The requested date is kept; approvers may move collection_date (history on the detail view)
SCHEDULE_FIELDS = ['requested_collection_date']

READ_FIELDS = [
    'payee_type', 'payee_type_display', 'payee_name', 'payee_reference',
    'category_display', 'status_display', 'submitted_by_name',
    'approved_by_name', 'paid_by_name', 'is_overdue', 'approval', 'can_mark_paid',
    *COLLECTION_FIELDS, 'collector_id_verified', 'procurement_installments', *SCHEDULE_FIELDS,
]


class PayableListSerializer(PayableReadMixin, serializers.ModelSerializer):
    """Serializer for payable list views."""

    class Meta:
        model = Payable
        fields = [
            'id',
            'payable_number',
            'vendor',
            'member',
            'invoice_number',
            'description',
            'category',
            'amount',
            'tax_amount',
            'total_amount',
            'currency',
            'invoice_date',
            'due_date',
            'collection_date',
            'paid_date',
            'payment_method',
            *PAY_TO_FIELDS,
            'status',
            'priority',
            'submitted_by',
            'created_at',
            'updated_at',
            *READ_FIELDS,
        ]
        read_only_fields = fields


class PayableDetailSerializer(PayableReadMixin, serializers.ModelSerializer):
    """Serializer for payable detail views, with payee contact details."""
    vendor_details = serializers.SerializerMethodField()
    member_details = serializers.SerializerMethodField()
    date_changes = PayableDateChangeSerializer(many=True, read_only=True)

    class Meta:
        model = Payable
        fields = [
            'id',
            'payable_number',
            'vendor',
            'vendor_details',
            'member',
            'member_details',
            'date_changes',
            'invoice_number',
            'description',
            'category',
            'amount',
            'currency',
            'tax_amount',
            'total_amount',
            'invoice_date',
            'due_date',
            'collection_date',
            'paid_date',
            'payment_method',
            'payment_reference',
            *PAY_TO_FIELDS,
            'status',
            'priority',
            'submitted_by',
            'approved_date',
            'rejection_reason',
            'attachments',
            'notes',
            'created_at',
            'updated_at',
            *READ_FIELDS,
        ]
        read_only_fields = fields

    def get_vendor_details(self, obj):
        if not obj.vendor:
            return None
        return {
            'id': str(obj.vendor.id),
            'vendor_code': obj.vendor.vendor_code,
            'company_name': obj.vendor.company_name,
            'contact_person': obj.vendor.contact_person,
            'phone': obj.vendor.phone,
            'email': obj.vendor.email,
            'vendor_type_display': obj.vendor.get_vendor_type_display(),
            'payment_terms': obj.vendor.payment_terms,
        }

    def get_member_details(self, obj):
        if not obj.member:
            return None
        return {
            'id': str(obj.member.id),
            'member_number': obj.member.member_number,
            'full_name': obj.member.get_full_name(),
            'phone': obj.member.phone,
            'email': obj.member.email,
            'account_status': obj.member.account_status,
        }


class PayableCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Creating and editing payables. submitted_by, status and approval fields are set
    server-side; the payee must match payee_type and the category must suit the payee.
    """
    invoice_date = serializers.DateField(required=False)
    # Procurement installments this payable settles (vendor payables; create only)
    procurement_installments = serializers.ListField(
        child=serializers.UUIDField(), required=False, allow_empty=True, write_only=True
    )

    class Meta:
        model = Payable
        fields = [
            'procurement_installments',
            *COLLECTION_FIELDS,
            'payee_type',
            'vendor',
            'member',
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
            'priority',
            'notes',
            *PAY_TO_FIELDS,
        ]

    def _value(self, attrs, field, default=None):
        """Incoming value, falling back to the instance being updated (supports PATCH)."""
        if field in attrs:
            return attrs[field]
        return getattr(self.instance, field, default) if self.instance else default

    def validate(self, attrs):
        payee_type = self._value(attrs, 'payee_type', PayeeType.VENDOR)
        vendor = self._value(attrs, 'vendor')
        member = self._value(attrs, 'member')
        errors = {}

        if payee_type == PayeeType.VENDOR:
            if vendor is None:
                errors['vendor'] = 'Select the vendor to pay.'
            elif not vendor.is_active:
                errors['vendor'] = 'Cannot create a payable for an inactive vendor.'
            if member is not None:
                errors['member'] = 'A vendor payable cannot also have a member payee.'
            if not self._value(attrs, 'invoice_date'):
                errors['invoice_date'] = 'Invoice date is required for vendor payables.'
        else:
            if member is None:
                errors['member'] = 'Select the member to pay.'
            elif member.is_deleted:
                errors['member'] = 'This member record has been deleted.'
            if vendor is not None:
                errors['vendor'] = 'A member payable cannot also have a vendor payee.'
            if not self._value(attrs, 'invoice_date'):
                # Member payouts have no invoice; the request date stands in for it
                attrs['invoice_date'] = timezone.localdate()

        category = self._value(attrs, 'category', PayableCategory.OTHER)
        if category not in PayableCategory.allowed_for(payee_type):
            errors['category'] = 'This category does not apply to the selected payee type.'

        amount = self._value(attrs, 'amount')
        if amount is not None and amount <= 0:
            errors['amount'] = 'Amount must be greater than zero.'
        tax_amount = self._value(attrs, 'tax_amount', Decimal('0'))
        if tax_amount is not None and tax_amount < 0:
            errors['tax_amount'] = 'Tax amount cannot be negative.'

        invoice_date = self._value(attrs, 'invoice_date')
        due_date = self._value(attrs, 'due_date')
        collection_date = self._value(attrs, 'collection_date')
        if invoice_date and due_date and invoice_date > due_date:
            errors['due_date'] = 'Due date must be on or after invoice date.'
        if invoice_date and collection_date and collection_date < invoice_date:
            errors['collection_date'] = 'Collection date cannot be before invoice date.'

        errors.update(self._validate_pay_to(attrs))
        errors.update(self._validate_collection(attrs))
        errors.update(self._validate_procurement(attrs, payee_type))

        if errors:
            raise serializers.ValidationError(errors)
        return attrs

    def _validate_collection(self, attrs) -> dict:
        """In-person collection needs to know who will collect; otherwise collector details are cleared."""
        if not self._value(attrs, 'in_person_collection', False):
            for field in ('collector_name', 'collector_id_number', 'collector_phone'):
                attrs[field] = None
            return {}
        return {
            field: 'Required when the payment is collected in person.'
            for field in ('collector_name', 'collector_id_number')
            if not (self._value(attrs, field) or '').strip()
        }

    def _validate_procurement(self, attrs, payee_type) -> dict:
        """
        Payables settling procurement installments are vendor payables in the Procurement
        category; the amount is set from the installments by the view. Once created, their
        payee, currency and amounts are fixed.
        """
        if self.instance is not None:
            if 'procurement_installments' in attrs:
                return {'procurement_installments': 'Installments cannot be changed after the payable is created.'}
            if self.instance.installment_links.exists():
                locked = [f for f in ('payee_type', 'vendor', 'currency', 'amount', 'tax_amount', 'category')
                          if f in attrs and attrs[f] != getattr(self.instance, f)]
                return {f: 'Fixed by the procurement installments this payable settles.' for f in locked}
            return {}

        if not attrs.get('procurement_installments'):
            attrs.pop('procurement_installments', None)
            return {}
        if payee_type != PayeeType.VENDOR:
            return {'procurement_installments': 'Only vendor payables can settle procurement installments.'}
        attrs['category'] = PayableCategory.PROCUREMENT
        attrs['tax_amount'] = Decimal('0')
        return {}

    def _validate_pay_to(self, attrs) -> dict:
        """
        Require the payee details the chosen payment method needs, and clear details that
        don't apply, so approvers only see where the money will actually go.
        """
        method = self._value(attrs, 'payment_method')
        required = PAY_TO_REQUIRED.get(method, [])
        errors = {
            field: f'Required for {method} payments.'
            for field in required
            if not (self._value(attrs, field) or '').strip()
        }
        if not errors:
            for field in PAY_TO_FIELDS:
                if field not in PAY_TO_ALLOWED.get(method, []):
                    attrs[field] = None
        return errors


class MarkPaidSerializer(serializers.Serializer):
    """Payment details recorded by the Pay-stage assignee."""
    paid_date = serializers.DateField(required=False)
    payment_method = serializers.CharField(max_length=50)
    payment_reference = serializers.CharField(max_length=50, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    # Required (true) for in-person collection: the payer checked the collector's ID
    collector_id_verified = serializers.BooleanField(required=False, default=False)

    def validate_paid_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError('Paid date cannot be in the future.')
        return value

    def validate(self, attrs):
        attrs.setdefault('paid_date', timezone.localdate())
        return attrs
