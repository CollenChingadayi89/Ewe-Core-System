from rest_framework import serializers
from .models import (
    ApprovalGroup,
    ApprovalGroupMembership,
    ApprovalWorkflow,
    ApprovalRequest,
    ApprovalStep,
    Notification
)


class ApprovalGroupMembershipSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalGroupMembership model"""

    # Add employee details
    employee_name = serializers.CharField(
        source='employee.get_full_name',
        read_only=True
    )
    employee_number = serializers.CharField(
        source='employee.employee_number',
        read_only=True
    )
    department = serializers.CharField(
        source='employee.department.name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ApprovalGroupMembership
        fields = [
            'id',
            'approval_group',
            'employee',
            'employee_name',
            'employee_number',
            'department',
            'role',
            'joined_at',
            'is_active'
        ]
        read_only_fields = ['joined_at']


class ApprovalGroupSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalGroup model (list view)"""

    # Add display names
    department_name = serializers.CharField(
        source='department.name',
        read_only=True,
        allow_null=True
    )
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ApprovalGroup
        fields = [
            'id',
            'code',
            'name',
            'description',
            'group_type',
            'department',
            'department_name',
            'member_count',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['member_count', 'created_at', 'updated_at']


class ApprovalGroupDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for ApprovalGroup with full member list"""

    # Department details
    department_name = serializers.CharField(
        source='department.name',
        read_only=True,
        allow_null=True
    )

    # Nested memberships
    memberships = ApprovalGroupMembershipSerializer(
        many=True,
        read_only=True
    )

    # Member count
    member_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = ApprovalGroup
        fields = [
            'id',
            'code',
            'name',
            'description',
            'group_type',
            'department',
            'department_name',
            'memberships',
            'member_count',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['member_count', 'memberships', 'created_at', 'updated_at']


class ApprovalWorkflowSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalWorkflow model"""

    class Meta:
        model = ApprovalWorkflow
        fields = '__all__'


class ApprovalStepSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalStep model"""

    # Add display names
    approver_name = serializers.CharField(
        source='approver.get_full_name',
        read_only=True
    )
    escalated_to_name = serializers.CharField(
        source='escalated_to.get_full_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ApprovalStep
        fields = '__all__'


class ApprovalRequestSerializer(serializers.ModelSerializer):
    """Serializer for ApprovalRequest model (list view)"""

    # Add display names
    requester_name = serializers.CharField(
        source='requester.get_full_name',
        read_only=True
    )
    current_approver_name = serializers.CharField(
        source='current_approver.get_full_name',
        read_only=True,
        allow_null=True
    )
    workflow_name = serializers.CharField(
        source='workflow.workflow_name',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = ApprovalRequest
        fields = '__all__'


class ApprovalRequestDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for ApprovalRequest model.
    Includes nested workflow details, requester details, and approval steps.
    """

    # Nested workflow
    workflow_details = ApprovalWorkflowSerializer(
        source='workflow',
        read_only=True
    )

    # Requester details
    requester_details = serializers.SerializerMethodField()

    # Current approver details
    current_approver_details = serializers.SerializerMethodField()

    # Rejected by details
    rejected_by_details = serializers.SerializerMethodField()

    # Approval steps (audit trail)
    approval_steps = ApprovalStepSerializer(
        many=True,
        read_only=True
    )

    # Content object details (the actual leave request, expense, etc.)
    content_object_details = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalRequest
        fields = '__all__'

    def get_requester_details(self, obj):
        """Get requester employee details"""
        if not obj.requester:
            return None

        return {
            'id': str(obj.requester.id),
            'employee_number': obj.requester.employee_number,
            'first_name': obj.requester.first_name,
            'last_name': obj.requester.last_name,
            'full_name': obj.requester.get_full_name(),
            'department': obj.requester.department.name if obj.requester.department else None,
            'designation': obj.requester.designation.title if obj.requester.designation else None,
            'email': obj.requester.user.email if obj.requester.user else None,
        }

    def get_current_approver_details(self, obj):
        """Get current approver employee details"""
        if not obj.current_approver:
            return None

        return {
            'id': str(obj.current_approver.id),
            'employee_number': obj.current_approver.employee_number,
            'first_name': obj.current_approver.first_name,
            'last_name': obj.current_approver.last_name,
            'full_name': obj.current_approver.get_full_name(),
            'department': obj.current_approver.department.name if obj.current_approver.department else None,
            'designation': obj.current_approver.designation.title if obj.current_approver.designation else None,
            'email': obj.current_approver.user.email if obj.current_approver.user else None,
        }

    def get_rejected_by_details(self, obj):
        """Get rejected by employee details"""
        if not obj.rejected_by:
            return None

        return {
            'id': str(obj.rejected_by.id),
            'employee_number': obj.rejected_by.employee_number,
            'first_name': obj.rejected_by.first_name,
            'last_name': obj.rejected_by.last_name,
            'full_name': obj.rejected_by.get_full_name(),
        }

    def get_content_object_details(self, obj):
        """Get the related content object (leave request, expense, etc.)"""
        content_object = obj.content_object

        if not content_object:
            return None

        # Determine content type and serialize accordingly
        content_type_model = obj.content_type.model

        if content_type_model == 'leaverequest':
            # LeaveRequest details
            return {
                'type': 'leave_request',
                'request_number': getattr(content_object, 'request_number', None),
                'employee': content_object.employee.get_full_name() if content_object.employee else None,
                'leave_policy': content_object.leave_policy.display_name if content_object.leave_policy else None,
                'leave_type': content_object.leave_policy.leave_type if content_object.leave_policy else None,
                'start_date': content_object.start_date.strftime('%d/%m/%Y') if content_object.start_date else None,
                'end_date': content_object.end_date.strftime('%d/%m/%Y') if content_object.end_date else None,
                'total_days': content_object.total_days,
                'working_days_count': content_object.working_days_count,
                'reason': content_object.reason,
                'status': content_object.status,
                'emergency_contact': getattr(content_object, 'emergency_contact', None),
                'emergency_address': getattr(content_object, 'emergency_address', None),
            }

        elif content_type_model == 'expense':
            # Expense details
            return {
                'type': 'expense',
                'expense_number': getattr(content_object, 'expense_number', None),
                'category': getattr(content_object, 'category', None),
                'amount': float(content_object.amount) if hasattr(content_object, 'amount') else None,
                'date': content_object.date.strftime('%d/%m/%Y') if hasattr(content_object, 'date') else None,
                'description': getattr(content_object, 'description', None),
                'status': content_object.status if hasattr(content_object, 'status') else None,
            }

        elif content_type_model == 'pettycash':
            # Petty Cash details
            return {
                'type': 'petty_cash',
                'voucher_number': getattr(content_object, 'voucher_number', None),
                'amount': float(content_object.amount) if hasattr(content_object, 'amount') else None,
                'purpose': getattr(content_object, 'purpose', None),
                'date': content_object.date.strftime('%d/%m/%Y') if hasattr(content_object, 'date') else None,
                'status': content_object.status if hasattr(content_object, 'status') else None,
            }

        elif content_type_model == 'payable':
            # Payable details
            return {
                'type': 'payable',
                'invoice_number': getattr(content_object, 'invoice_number', None),
                'vendor': getattr(content_object, 'vendor', None),
                'amount': float(content_object.amount) if hasattr(content_object, 'amount') else None,
                'due_date': content_object.due_date.strftime('%d/%m/%Y') if hasattr(content_object, 'due_date') else None,
                'description': getattr(content_object, 'description', None),
                'status': content_object.status if hasattr(content_object, 'status') else None,
            }

        elif content_type_model == 'receivable':
            # Receivable details
            return {
                'type': 'receivable',
                'invoice_number': getattr(content_object, 'invoice_number', None),
                'member': getattr(content_object, 'member', None),
                'service_type': getattr(content_object, 'service_type', None),
                'amount': float(content_object.amount) if hasattr(content_object, 'amount') else None,
                'due_date': content_object.due_date.strftime('%d/%m/%Y') if hasattr(content_object, 'due_date') else None,
                'description': getattr(content_object, 'description', None),
                'status': content_object.status if hasattr(content_object, 'status') else None,
            }

        elif content_type_model == 'procurement':
            # Procurement details
            return {
                'type': 'procurement',
                'request_number': getattr(content_object, 'request_number', None),
                'item': getattr(content_object, 'item', None),
                'quantity': getattr(content_object, 'quantity', None),
                'estimated_cost': float(content_object.estimated_cost) if hasattr(content_object, 'estimated_cost') else None,
                'purpose': getattr(content_object, 'purpose', None),
                'status': content_object.status if hasattr(content_object, 'status') else None,
            }

        else:
            # Generic fallback for unknown content types
            return {
                'type': content_type_model,
                'id': str(content_object.id) if hasattr(content_object, 'id') else None,
                'status': content_object.status if hasattr(content_object, 'status') else None,
            }


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""

    # Add display names
    recipient_name = serializers.CharField(
        source='recipient.get_full_name',
        read_only=True
    )
    approval_request_number = serializers.CharField(
        source='approval_request.request_number',
        read_only=True,
        allow_null=True
    )

    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['is_read', 'read_at']
