"""
Finance Settings API Views
ViewSets for managing Finance-specific approval groups and workflows
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import ApprovalGroup, ApprovalGroupMembership, ApprovalWorkflow
from .finance_serializers import (
    ApprovalGroupListSerializer,
    ApprovalGroupDetailSerializer,
    ApprovalGroupCreateUpdateSerializer,
    FinanceWorkflowListSerializer,
    FinanceWorkflowDetailSerializer,
    FinanceWorkflowCreateUpdateSerializer,
    MembershipActionSerializer,
    ApprovalGroupMembershipDetailSerializer,
)
from hr_employee.models import Employee


class FinanceApprovalGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Finance approval groups.
    Automatically filters to show only finance-category groups.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for simple list view
    queryset = ApprovalGroup.objects.filter(category='finance').order_by('code')

    def get_serializer_class(self):
        if self.action == 'list':
            return ApprovalGroupListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ApprovalGroupCreateUpdateSerializer
        else:
            return ApprovalGroupDetailSerializer

    def perform_create(self, serializer):
        """Force category to 'finance' on create"""
        serializer.save(category='finance', created_by=self.request.user)

    def perform_update(self, serializer):
        """Ensure category remains 'finance' on update"""
        serializer.save(category='finance', modified_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='add-member')
    def add_member(self, request, pk=None):
        """
        Add a member to the approval group.
        POST /api/finance-approval-groups/{id}/add-member/
        Body: {"employee_id": "uuid", "role": "member/lead/admin"}
        """
        group = self.get_object()
        serializer = MembershipActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee_id = serializer.validated_data['employee_id']
        role = serializer.validated_data.get('role', 'member')

        try:
            employee = Employee.objects.get(id=employee_id, is_active=True)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found or inactive'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if already a member
        existing_membership = ApprovalGroupMembership.objects.filter(
            approval_group=group,
            employee=employee
        ).first()

        if existing_membership:
            # Reactivate if inactive, update role
            existing_membership.is_active = True
            existing_membership.role = role
            existing_membership.save()
            message = f'{employee.get_full_name()} membership updated in {group.name}'
        else:
            # Create new membership
            ApprovalGroupMembership.objects.create(
                approval_group=group,
                employee=employee,
                role=role,
                is_active=True
            )
            message = f'{employee.get_full_name()} added to {group.name}'

        return Response(
            {
                'success': True,
                'message': message,
                'group': ApprovalGroupDetailSerializer(group).data
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        """
        Remove a member from the approval group.
        POST /api/finance-approval-groups/{id}/remove-member/
        Body: {"employee_id": "uuid"}
        """
        group = self.get_object()
        employee_id = request.data.get('employee_id')

        if not employee_id:
            return Response(
                {'error': 'employee_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            membership = ApprovalGroupMembership.objects.get(
                approval_group=group,
                employee_id=employee_id
            )
            employee_name = membership.employee.get_full_name()
            membership.delete()

            return Response(
                {
                    'success': True,
                    'message': f'{employee_name} removed from {group.name}',
                    'group': ApprovalGroupDetailSerializer(group).data
                },
                status=status.HTTP_200_OK
            )
        except ApprovalGroupMembership.DoesNotExist:
            return Response(
                {'error': 'Member not found in this group'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['patch'], url_path='update-member-role')
    def update_member_role(self, request, pk=None):
        """
        Update a member's role in the group.
        PATCH /api/finance-approval-groups/{id}/update-member-role/
        Body: {"employee_id": "uuid", "role": "member/lead/admin"}
        """
        group = self.get_object()
        employee_id = request.data.get('employee_id')
        new_role = request.data.get('role')

        if not employee_id or not new_role:
            return Response(
                {'error': 'employee_id and role are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_role not in ['member', 'lead', 'admin']:
            return Response(
                {'error': 'Invalid role. Must be member, lead, or admin'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            membership = ApprovalGroupMembership.objects.get(
                approval_group=group,
                employee_id=employee_id
            )
            membership.role = new_role
            membership.save()

            return Response(
                {
                    'success': True,
                    'message': f'Role updated to {new_role}',
                    'membership': ApprovalGroupMembershipDetailSerializer(membership).data
                },
                status=status.HTTP_200_OK
            )
        except ApprovalGroupMembership.DoesNotExist:
            return Response(
                {'error': 'Member not found in this group'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], url_path='available-employees')
    def available_employees(self, request):
        """
        Get list of employees who can be added to finance groups.
        GET /api/finance-approval-groups/available-employees/
        """
        from approval.finance_serializers import EmployeeSummarySerializer

        # Get all active employees
        employees = Employee.objects.filter(is_active=True).order_by('first_name', 'last_name')

        # Optional: filter by department if provided
        department_id = request.query_params.get('department')
        if department_id:
            employees = employees.filter(department_id=department_id)

        serializer = EmployeeSummarySerializer(employees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='employee-groups')
    def employee_groups(self, request):
        """
        Get all employees with their current finance approval group.
        Useful for drag-and-drop UI to show which employees are already assigned.

        Returns:
        [
            {
                "employee_id": "...",
                "employee_number": "...",
                "employee_name": "...",
                "department": "...",
                "group_id": "..." | null,
                "group_code": "..." | null,
                "group_name": "..." | null,
                "role": "member|lead|admin" | null
            },
            ...
        ]
        """
        employees = Employee.objects.filter(is_active=True).prefetch_related('group_memberships').order_by('first_name', 'last_name')
        result = []

        for employee in employees:
            # Get current active membership in finance category groups
            current_membership = employee.group_memberships.filter(
                is_active=True,
                approval_group__category='finance'
            ).select_related('approval_group').first()

            result.append({
                'employee_id': str(employee.id),
                'employee_number': employee.employee_number,
                'employee_name': employee.get_full_name(),
                'department': str(employee.department.id) if employee.department else None,
                'group_id': str(current_membership.approval_group.id) if current_membership else None,
                'group_code': current_membership.approval_group.code if current_membership else None,
                'group_name': current_membership.approval_group.name if current_membership else None,
                'role': current_membership.role if current_membership else None,
            })

        return Response(result)


class FinanceWorkflowViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Finance workflows.
    Filters to show only finance-related workflow types.
    """
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Disable pagination for simple list view

    # Finance workflow types
    FINANCE_WORKFLOW_TYPES = ['petty_cash', 'payable', 'receivable', 'expense', 'procurement']

    queryset = ApprovalWorkflow.objects.filter(
        workflow_type__in=FINANCE_WORKFLOW_TYPES
    ).order_by('workflow_name')

    def get_serializer_class(self):
        if self.action == 'list':
            return FinanceWorkflowListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return FinanceWorkflowCreateUpdateSerializer
        else:
            return FinanceWorkflowDetailSerializer

    def perform_create(self, serializer):
        """Set created_by on create"""
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """Set modified_by on update"""
        serializer.save(modified_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='by-type')
    def by_type(self, request):
        """
        Get workflows grouped by type.
        GET /api/finance-workflows/by-type/
        """
        workflows_by_type = {}

        for workflow_type in self.FINANCE_WORKFLOW_TYPES:
            workflows = ApprovalWorkflow.objects.filter(
                workflow_type=workflow_type
            ).order_by('-is_active', 'workflow_name')

            serializer = FinanceWorkflowListSerializer(workflows, many=True)
            workflows_by_type[workflow_type] = serializer.data

        return Response(workflows_by_type)

    @action(detail=True, methods=['post'], url_path='duplicate')
    def duplicate(self, request, pk=None):
        """
        Duplicate a workflow with a new name.
        POST /api/finance-workflows/{id}/duplicate/
        Body: {"workflow_name": "New Workflow Name"}
        """
        original_workflow = self.get_object()
        new_name = request.data.get('workflow_name')

        if not new_name:
            return Response(
                {'error': 'workflow_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if name already exists
        if ApprovalWorkflow.objects.filter(workflow_name=new_name).exists():
            return Response(
                {'error': 'A workflow with this name already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create duplicate
        new_workflow = ApprovalWorkflow.objects.create(
            workflow_name=new_name,
            description=f"Copy of {original_workflow.workflow_name}",
            workflow_type=original_workflow.workflow_type,
            stages=original_workflow.stages,  # Deep copy of stages
            conditions=original_workflow.conditions,
            is_active=False,  # Start as inactive
            allow_parallel_approval=original_workflow.allow_parallel_approval,
            require_sequential=original_workflow.require_sequential,
            escalation_enabled=original_workflow.escalation_enabled,
            escalation_hours=original_workflow.escalation_hours,
            escalation_action=original_workflow.escalation_action,
            created_by=request.user
        )

        # Copy applicable groups
        new_workflow.applicable_groups.set(original_workflow.applicable_groups.all())

        serializer = FinanceWorkflowDetailSerializer(new_workflow)
        return Response(
            {
                'success': True,
                'message': f'Workflow duplicated as "{new_name}"',
                'workflow': serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path='toggle-active')
    def toggle_active(self, request, pk=None):
        """
        Toggle workflow active status.
        POST /api/finance-workflows/{id}/toggle-active/
        """
        workflow = self.get_object()
        workflow.is_active = not workflow.is_active
        workflow.save()

        return Response(
            {
                'success': True,
                'message': f'Workflow {"activated" if workflow.is_active else "deactivated"}',
                'is_active': workflow.is_active
            },
            status=status.HTTP_200_OK
        )
