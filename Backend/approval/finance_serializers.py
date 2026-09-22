"""
Finance-Specific Serializers for Approval Groups and Workflows
Provides detailed serialization for Finance Settings UI
"""

from rest_framework import serializers
from .models import ApprovalGroup, ApprovalGroupMembership, ApprovalWorkflow
from hr_employee.models import Employee


class EmployeeSummarySerializer(serializers.ModelSerializer):
    """Lightweight employee serializer for finance settings"""
    full_name = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_number', 'first_name', 'last_name', 'full_name',
            'email', 'department', 'department_name', 'role', 'is_active'
        ]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_email(self, obj):
        """Get email from related User model"""
        return obj.user.email if obj.user else None


class ApprovalGroupMembershipDetailSerializer(serializers.ModelSerializer):
    """Detailed membership info with employee details"""
    employee_details = EmployeeSummarySerializer(source='employee', read_only=True)

    class Meta:
        model = ApprovalGroupMembership
        fields = [
            'id', 'approval_group', 'employee', 'employee_details',
            'role', 'is_active', 'joined_at'
        ]
        read_only_fields = ['joined_at']


class ApprovalGroupListSerializer(serializers.ModelSerializer):
    """List serializer for approval groups"""
    member_count = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    group_type_display = serializers.CharField(source='get_group_type_display', read_only=True)

    class Meta:
        model = ApprovalGroup
        fields = [
            'id', 'code', 'name', 'description', 'group_type', 'group_type_display',
            'category', 'category_display', 'department', 'department_name',
            'is_active', 'member_count', 'created_at', 'updated_at'
        ]

    def get_member_count(self, obj):
        return obj.member_count

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None


class ApprovalGroupDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with full member list"""
    members_detail = ApprovalGroupMembershipDetailSerializer(
        source='memberships',
        many=True,
        read_only=True
    )
    member_count = serializers.SerializerMethodField()
    department_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    group_type_display = serializers.CharField(source='get_group_type_display', read_only=True)

    class Meta:
        model = ApprovalGroup
        fields = [
            'id', 'code', 'name', 'description', 'group_type', 'group_type_display',
            'category', 'category_display', 'department', 'department_name',
            'is_active', 'member_count', 'members_detail',
            'created_at', 'updated_at', 'created_by', 'modified_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    def get_member_count(self, obj):
        return obj.member_count

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None


class ApprovalGroupCreateUpdateSerializer(serializers.ModelSerializer):
    """Create/Update serializer for approval groups"""
    code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ApprovalGroup
        fields = [
            'id', 'code', 'name', 'description', 'group_type',
            'category', 'department', 'is_active'
        ]

    def _generate_code(self, name, category):
        """Generate unique group code from name and category"""
        import re

        # Get category prefix
        category_prefix = {
            'finance': 'FIN',
            'leave': 'LEAVE',
            'procurement': 'PROC',
            'hr': 'HR',
            'general': 'GEN'
        }.get(category, 'GRP')

        # Clean and create code from name
        # Remove special characters and convert to uppercase
        clean_name = re.sub(r'[^a-zA-Z0-9\s]', '', name)
        # Take first letters of each word, max 4 letters
        words = clean_name.split()
        if len(words) > 1:
            name_part = ''.join([w[0] for w in words if w])[:4].upper()
        else:
            # Single word - take first 4 letters
            name_part = clean_name[:4].upper()

        # Build base code
        base_code = f"GRP-{category_prefix}-{name_part}"

        # Ensure uniqueness by adding number if needed
        code = base_code
        counter = 1
        while ApprovalGroup.objects.filter(code=code).exists():
            code = f"{base_code}-{counter}"
            counter += 1

        return code

    def create(self, validated_data):
        """Auto-generate code if not provided"""
        if not validated_data.get('code'):
            validated_data['code'] = self._generate_code(
                validated_data['name'],
                validated_data.get('category', 'general')
            )
        else:
            validated_data['code'] = validated_data['code'].upper()

        return super().create(validated_data)

    def validate_code(self, value):
        """Ensure code is unique if manually provided"""
        if not value:
            return value

        instance = self.instance
        if instance:
            # Update - allow same code
            if ApprovalGroup.objects.exclude(pk=instance.pk).filter(code=value).exists():
                raise serializers.ValidationError("An approval group with this code already exists.")
        else:
            # Create - check uniqueness
            if ApprovalGroup.objects.filter(code=value).exists():
                raise serializers.ValidationError("An approval group with this code already exists.")
        return value.upper()


class FinanceWorkflowListSerializer(serializers.ModelSerializer):
    """List serializer for finance workflows"""
    workflow_type_display = serializers.CharField(source='get_workflow_type_display', read_only=True)
    stage_count = serializers.SerializerMethodField()
    applicable_group_codes = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalWorkflow
        fields = [
            'id', 'workflow_name', 'description', 'workflow_type', 'workflow_type_display',
            'is_active', 'stage_count', 'require_sequential', 'allow_parallel_approval',
            'escalation_enabled', 'escalation_hours', 'applicable_group_codes',
            'created_at', 'updated_at'
        ]

    def get_stage_count(self, obj):
        return len(obj.stages) if obj.stages else 0

    def get_applicable_group_codes(self, obj):
        return list(obj.applicable_groups.values_list('code', flat=True))


class FinanceWorkflowDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for finance workflows with full configuration"""
    workflow_type_display = serializers.CharField(source='get_workflow_type_display', read_only=True)
    applicable_groups_detail = ApprovalGroupListSerializer(source='applicable_groups', many=True, read_only=True)
    stage_count = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalWorkflow
        fields = [
            'id', 'workflow_name', 'description', 'workflow_type', 'workflow_type_display',
            'stages', 'applicable_groups_detail', 'conditions', 'is_active',
            'allow_parallel_approval', 'require_sequential', 'escalation_enabled',
            'escalation_hours', 'escalation_action', 'stage_count',
            'created_at', 'updated_at', 'created_by', 'modified_by'
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'modified_by']

    def get_stage_count(self, obj):
        return len(obj.stages) if obj.stages else 0


class FinanceWorkflowCreateUpdateSerializer(serializers.ModelSerializer):
    """Create/Update serializer for finance workflows"""
    applicable_group_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = ApprovalWorkflow
        fields = [
            'id', 'workflow_name', 'description', 'workflow_type', 'stages',
            'applicable_group_ids', 'conditions', 'is_active',
            'allow_parallel_approval', 'require_sequential', 'escalation_enabled',
            'escalation_hours', 'escalation_action'
        ]

    def validate_stages(self, value):
        """Validate stages configuration"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Stages must be a list")

        if len(value) == 0:
            raise serializers.ValidationError("At least one approval stage is required")

        # Validate stage numbers are sequential
        stage_numbers = [s.get('stage_number') for s in value]
        if sorted(stage_numbers) != list(range(1, len(value) + 1)):
            raise serializers.ValidationError("Stage numbers must be sequential starting from 1")

        # Validate each stage has required fields
        for stage in value:
            if 'stage_number' not in stage:
                raise serializers.ValidationError("Each stage must have a stage_number")
            if 'stage_name' not in stage:
                raise serializers.ValidationError("Each stage must have a stage_name")
            if 'approver_type' not in stage:
                raise serializers.ValidationError("Each stage must have an approver_type")

        return value

    def create(self, validated_data):
        """Create workflow and link to approval groups"""
        group_ids = validated_data.pop('applicable_group_ids', [])
        workflow = ApprovalWorkflow.objects.create(**validated_data)

        if group_ids:
            groups = ApprovalGroup.objects.filter(id__in=group_ids)
            workflow.applicable_groups.set(groups)

        return workflow

    def update(self, instance, validated_data):
        """Update workflow and link to approval groups"""
        group_ids = validated_data.pop('applicable_group_ids', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if group_ids is not None:
            groups = ApprovalGroup.objects.filter(id__in=group_ids)
            instance.applicable_groups.set(groups)

        return instance


class MembershipActionSerializer(serializers.Serializer):
    """Serializer for adding/removing members from groups"""
    employee_id = serializers.UUIDField(required=True)
    role = serializers.ChoiceField(
        choices=['member', 'lead', 'admin'],
        default='member'
    )
    is_active = serializers.BooleanField(default=True)
