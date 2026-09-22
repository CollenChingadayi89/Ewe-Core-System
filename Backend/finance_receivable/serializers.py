"""
Finance Receivable Serializers
Money coming INTO SACCO from members for 15 service categories.
Supports partial payments and approval workflows.
"""

from rest_framework import serializers
from decimal import Decimal
from .models import Receivable, ReceivablePayment


# ============================================================================
# RECEIVABLE SERIALIZERS
# ============================================================================

class ReceivableListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for receivable list views.
    Includes member name and category display.
    """
    member_name = serializers.CharField(source='member.get_full_name', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Receivable
        fields = [
            'id',
            'receivable_number',
            'member',
            'member_name',
            'member_number',
            'category',
            'category_display',
            'amount',
            'currency',
            'amount_paid',
            'outstanding_balance',
            'transaction_date',
            'due_date',
            'collection_date',
            'status',
            'status_display',
            'priority',
            'is_recurring',
            'is_overdue',
            'submitted_by',
            'submitted_by_name',
            'approved_by',
            'approved_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'outstanding_balance']

    def get_submitted_by_name(self, obj):
        """Get name of submitter"""
        return obj.submitted_by.get_full_name()

    def get_approved_by_name(self, obj):
        """Get name of approver"""
        if obj.approved_by:
            return obj.approved_by.get_full_name()
        return None

    def get_is_overdue(self, obj):
        """Check if receivable is overdue"""
        return obj.is_overdue()


class ReceivableDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for receivable detail views.
    Includes nested member info and payment history.
    """
    member_details = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    submitted_by_details = serializers.SerializerMethodField()
    approved_by_details = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Receivable
        fields = [
            # Basic Info
            'id',
            'receivable_number',
            'member',
            'member_details',

            # Category & Amount
            'category',
            'category_display',
            'amount',
            'currency',
            'amount_paid',
            'outstanding_balance',

            # Dates
            'transaction_date',
            'due_date',
            'collection_date',

            # Description
            'description',
            'notes',

            # Loan-Specific
            'loan_account_number',
            'installment_number',
            'total_installments',
            'principal_amount',
            'interest_amount',
            'interest_rate',

            # Share-Specific
            'share_certificate_number',
            'number_of_shares',
            'share_price',

            # Status & Approval
            'status',
            'status_display',
            'priority',
            'submitted_by',
            'submitted_by_details',
            'approved_by',
            'approved_by_details',
            'approved_date',
            'rejection_reason',

            # Payment Tracking
            'is_recurring',
            'payment_method',
            'reference_number',
            'is_overdue',

            # Timestamps
            'created_at',
            'updated_at',
            'created_by',
            'modified_by',

            # Related
            'payments',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'outstanding_balance']

    def get_member_details(self, obj):
        """Get member information"""
        return {
            'id': str(obj.member.id),
            'member_number': obj.member.member_number,
            'first_name': obj.member.first_name,
            'last_name': obj.member.last_name,
            'full_name': obj.member.get_full_name(),
            'phone': obj.member.phone,
            'email': obj.member.email,
            'status': obj.member.status,
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

    def get_approved_by_details(self, obj):
        """Get approver information"""
        if obj.approved_by:
            return {
                'id': str(obj.approved_by.id),
                'employee_number': obj.approved_by.employee_number,
                'first_name': obj.approved_by.first_name,
                'last_name': obj.approved_by.last_name,
                'full_name': obj.approved_by.get_full_name(),
                'approved_date': obj.approved_date,
            }
        return None

    def get_payments(self, obj):
        """Get payment history"""
        payments = obj.payments.all().order_by('-payment_date')
        return ReceivablePaymentSerializer(payments, many=True).data

    def get_is_overdue(self, obj):
        """Check if receivable is overdue"""
        return obj.is_overdue()


class ReceivableCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating receivables.
    Validates amounts and category-specific fields.
    """

    class Meta:
        model = Receivable
        fields = [
            'member',
            'category',
            'amount',
            'currency',
            'transaction_date',
            'due_date',
            'collection_date',
            'description',
            'notes',
            # Loan fields
            'loan_account_number',
            'installment_number',
            'total_installments',
            'principal_amount',
            'interest_amount',
            'interest_rate',
            # Share fields
            'share_certificate_number',
            'number_of_shares',
            'share_price',
            # Payment tracking
            'is_recurring',
            'payment_method',
            'reference_number',
            'priority',
            'submitted_by',
        ]

    def validate(self, attrs):
        """Comprehensive validation for receivables"""
        category = attrs.get('category')
        amount = attrs.get('amount')

        # Validate dates
        transaction_date = attrs.get('transaction_date')
        due_date = attrs.get('due_date')
        if transaction_date and due_date and transaction_date > due_date:
            raise serializers.ValidationError({
                'due_date': 'Due date must be after transaction date.'
            })

        # Validate loan-specific fields
        if category and category.startswith('loan'):
            if not attrs.get('loan_account_number'):
                raise serializers.ValidationError({
                    'loan_account_number': 'Loan account number is required for loan receivables.'
                })

            # Validate installment fields
            installment_number = attrs.get('installment_number')
            total_installments = attrs.get('total_installments')
            if installment_number and total_installments:
                if installment_number > total_installments:
                    raise serializers.ValidationError({
                        'installment_number': f'Installment number cannot exceed total installments ({total_installments}).'
                    })

            # Validate principal + interest = amount
            principal = attrs.get('principal_amount')
            interest = attrs.get('interest_amount')
            if principal and interest and amount:
                if principal + interest != amount:
                    raise serializers.ValidationError({
                        'amount': 'Amount must equal principal + interest.'
                    })

        # Validate share-specific fields
        if category == 'share-purchase':
            if not attrs.get('share_certificate_number'):
                raise serializers.ValidationError({
                    'share_certificate_number': 'Share certificate number is required for share purchases.'
                })

            # Validate share calculation
            number_of_shares = attrs.get('number_of_shares')
            share_price = attrs.get('share_price')
            if number_of_shares and share_price and amount:
                expected_amount = Decimal(str(number_of_shares)) * share_price
                if expected_amount != amount:
                    raise serializers.ValidationError({
                        'amount': f'Amount must equal number of shares × share price (expected: {expected_amount}).'
                    })

        # Validate registration categories
        if category and category.startswith('registration'):
            # Registration fees are typically one-time, non-recurring
            if attrs.get('is_recurring'):
                raise serializers.ValidationError({
                    'is_recurring': 'Registration fees cannot be recurring.'
                })

        return attrs


# ============================================================================
# RECEIVABLE PAYMENT SERIALIZERS
# ============================================================================

class ReceivablePaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for receivable partial payments.
    """
    receivable_number = serializers.CharField(source='receivable.receivable_number', read_only=True)
    member_name = serializers.CharField(source='receivable.member.get_full_name', read_only=True)
    recorded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ReceivablePayment
        fields = [
            'id',
            'receivable',
            'receivable_number',
            'member_name',
            'payment_number',
            'payment_date',
            'amount_paid',
            'payment_method',
            'reference_number',
            'notes',
            'recorded_by',
            'recorded_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_recorded_by_name(self, obj):
        """Get recorder's name"""
        if hasattr(obj.recorded_by, 'employee_profile'):
            return obj.recorded_by.employee_profile.get_full_name()
        return obj.recorded_by.email


class ReceivablePaymentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating receivable payments.
    Validates payment amount against outstanding balance.
    """

    class Meta:
        model = ReceivablePayment
        fields = [
            'receivable',
            'payment_date',
            'amount_paid',
            'payment_method',
            'reference_number',
            'notes',
            'recorded_by',
        ]

    def validate(self, attrs):
        """Validate payment amount"""
        receivable = attrs.get('receivable')
        amount_paid = attrs.get('amount_paid')

        if amount_paid <= 0:
            raise serializers.ValidationError({
                'amount_paid': 'Payment amount must be positive.'
            })

        if amount_paid > receivable.outstanding_balance:
            raise serializers.ValidationError({
                'amount_paid': f'Payment amount cannot exceed outstanding balance (ZWG {receivable.outstanding_balance}).'
            })

        return attrs
