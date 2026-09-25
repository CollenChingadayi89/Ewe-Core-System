from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction
from .models import (
    ApprovalGroup,
    ApprovalGroupMembership,
    ApprovalWorkflow,
    ApprovalRequest,
    ApprovalStep,
    Notification
)
from .serializers import (
    ApprovalGroupSerializer,
    ApprovalGroupDetailSerializer,
    ApprovalGroupMembershipSerializer,
    ApprovalWorkflowSerializer,
    ApprovalRequestSerializer,
    ApprovalRequestDetailSerializer,
    ApprovalStepSerializer,
    NotificationSerializer
)
from .services import ApprovalActionError, approve_current_stage, reject_current_stage
from .utils import (
    update_content_object_status,
    notify_approval_required,
    notify_request_cancelled,
    notify_request_escalated,
    notify_request_created
)


class ApprovalGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ApprovalGroup model.

    Provides CRUD operations for approval groups.
    Only HR/Admin users can create/update/delete groups.
    """
    queryset = ApprovalGroup.objects.prefetch_related('members', 'memberships').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    search_fields = ['code', 'name', 'description']
    filterset_fields = ['group_type', 'is_active', 'department']
    ordering_fields = ['code', 'name', 'created_at']
    ordering = ['code']

    def get_serializer_class(self):
        """Use detailed serializer for retrieve and list actions"""
        if self.action in ['retrieve', 'list']:
            return ApprovalGroupDetailSerializer
        return ApprovalGroupSerializer

    def get_queryset(self):
        """Optimize queryset with prefetch"""
        queryset = super().get_queryset()
        # Don't annotate member_count - the model property already handles it
        return queryset

    @action(detail=True, methods=['post'], url_path='add-member')
    def add_member(self, request, pk=None):
        """
        Add an employee to the approval group.

        CONSTRAINT: Employees can only be in ONE active group at a time.
        Adding an employee to a new group automatically deactivates
        their membership in any other group.

        Request Body:
        {
            "employee_id": "uuid-of-employee",
            "role": "member" | "lead" | "admin"  (optional, defaults to "member")
        }

        Response:
        {
            "membership": { ... },
            "removed_from_group": { "id": "...", "name": "..." } | null
        }
        """
        group = self.get_object()
        employee_id = request.data.get('employee_id')
        role = request.data.get('role', 'member')

        if not employee_id:
            return Response(
                {'error': 'employee_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if employee exists
        from hr_employee.models import Employee
        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'Employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if employee is currently in another group
        previous_membership = ApprovalGroupMembership.get_employee_current_group(employee)
        removed_from = None

        if previous_membership and previous_membership.approval_group.id != group.id:
            # Employee is in a different group - store info for response
            removed_from = {
                'id': str(previous_membership.approval_group.id),
                'code': previous_membership.approval_group.code,
                'name': previous_membership.approval_group.name,
                'role': previous_membership.role
            }

        # Check if already a member of THIS group
        existing = ApprovalGroupMembership.objects.filter(
            approval_group=group,
            employee=employee
        ).first()

        if existing:
            # Update existing membership (this will auto-deactivate other groups via save())
            existing.role = role
            existing.is_active = True
            existing.save()
            serializer = ApprovalGroupMembershipSerializer(existing)
        else:
            # Create new membership (save() will auto-deactivate other groups)
            membership = ApprovalGroupMembership.objects.create(
                approval_group=group,
                employee=employee,
                role=role
            )
            serializer = ApprovalGroupMembershipSerializer(membership)

        return Response({
            'membership': serializer.data,
            'removed_from_group': removed_from
        }, status=status.HTTP_201_CREATED if not existing else status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        """
        Remove an employee from the approval group.

        Request Body:
        {
            "employee_id": "uuid-of-employee"
        }
        """
        group = self.get_object()
        employee_id = request.data.get('employee_id')

        if not employee_id:
            return Response(
                {'error': 'employee_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find and deactivate membership
        membership = ApprovalGroupMembership.objects.filter(
            approval_group=group,
            employee_id=employee_id
        ).first()

        if not membership:
            return Response(
                {'error': 'Employee is not a member of this group'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Deactivate instead of deleting (for audit trail)
        membership.is_active = False
        membership.save()

        return Response({
            'message': 'Member removed successfully'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='members')
    def get_members(self, request, pk=None):
        """
        Get all members of the approval group.

        Returns list of active members with their details.
        """
        group = self.get_object()
        memberships = group.memberships.filter(is_active=True).select_related('employee', 'employee__department')
        serializer = ApprovalGroupMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='employee-groups')
    def employee_groups(self, request):
        """
        Get all employees with their current approval group.
        Useful for drag-and-drop UI to show which employees are already assigned.

        Returns:
        [
            {
                "employee_id": "...",
                "employee_name": "...",
                "group_id": "..." | null,
                "group_name": "..." | null,
                "role": "..." | null
            },
            ...
        ]
        """
        from hr_employee.models import Employee

        employees = Employee.objects.filter(is_active=True).prefetch_related('group_memberships')
        result = []

        for employee in employees:
            # Get current active membership
            current_membership = employee.group_memberships.filter(is_active=True).select_related('approval_group').first()

            result.append({
                'employee_id': str(employee.id),
                'employee_number': employee.employee_number,
                'employee_name': employee.get_full_name(),
                'department': employee.department.name if employee.department else None,
                'group_id': str(current_membership.approval_group.id) if current_membership else None,
                'group_code': current_membership.approval_group.code if current_membership else None,
                'group_name': current_membership.approval_group.name if current_membership else None,
                'role': current_membership.role if current_membership else None
            })

        return Response(result)


class ApprovalWorkflowViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ApprovalWorkflow model.

    Provides CRUD operations for approval workflow templates.
    Only admin users can create/update/delete workflows.
    """
    queryset = ApprovalWorkflow.objects.prefetch_related('applicable_groups').all()
    serializer_class = ApprovalWorkflowSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    search_fields = ['workflow_name', 'description', 'workflow_type']
    filterset_fields = ['workflow_type', 'is_active']
    ordering_fields = ['workflow_name', 'created_at', 'updated_at']
    ordering = ['workflow_name']

    def create(self, request, *args, **kwargs):
        """
        Create workflow and associate with approval group.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        workflow = serializer.save(created_by=request.user)

        # Associate workflow with approval group
        applicable_group_id = request.data.get('applicable_group_id')
        if applicable_group_id:
            try:
                workflow.applicable_groups.add(applicable_group_id)
            except Exception as e:
                workflow.delete()  # Rollback
                return Response(
                    {'error': f'Invalid group ID: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            ApprovalWorkflowSerializer(workflow).data,
            status=status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        """
        Update workflow and its approval group association.
        """
        workflow = self.get_object()
        serializer = self.get_serializer(workflow, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        serializer.save(modified_by=request.user)

        # Update applicable group
        applicable_group_id = request.data.get('applicable_group_id')
        if applicable_group_id:
            workflow.applicable_groups.clear()
            workflow.applicable_groups.add(applicable_group_id)

        return Response(serializer.data)


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ApprovalRequest model.

    Provides CRUD operations plus custom actions:
    - approve: Approve the request and advance to next stage
    - reject: Reject the request
    - cancel: Cancel the request
    - escalate: Escalate to higher authority
    """
    queryset = ApprovalRequest.objects.select_related(
        'workflow',
        'requester',
        'current_approver',
        'rejected_by'
    ).prefetch_related('approval_steps').all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    search_fields = ['request_number', 'request_summary']
    filterset_fields = [
        'status',
        'priority',
        'workflow',
        'requester',
        'current_approver',
        'content_type'
    ]
    ordering_fields = ['submitted_date', 'due_date', 'created_at', 'priority']
    ordering = ['-submitted_date']

    def get_serializer_class(self):
        """Use detailed serializer for retrieve action"""
        if self.action == 'retrieve':
            return ApprovalRequestDetailSerializer
        return ApprovalRequestSerializer

    # ========================================================================
    # CUSTOM ACTION: APPROVE
    # ========================================================================

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        """
        Approve the current stage of an approval request.

        Request Body:
        {
            "comments": "Optional approval comments"
        }

        Advances to the next stage, or marks the request fully approved and updates
        the content object's status. See approval.services.approve_current_stage.
        """
        approval_request = self.get_object()
        approver = getattr(request.user, 'employee_profile', None)
        if approver is None:
            return Response(
                {'error': 'User does not have an employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            approve_current_stage(approval_request, approver, request.data.get('comments', ''))
        except ApprovalActionError as exc:
            return Response({'error': exc.message}, status=exc.status_code)

        serializer = ApprovalRequestDetailSerializer(approval_request)
        return Response(serializer.data)

    # ========================================================================
    # CUSTOM ACTION: REJECT
    # ========================================================================

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        """
        Reject an approval request.

        Request Body:
        {
            "comments": "Required rejection reason"
        }

        See approval.services.reject_current_stage.
        """
        approval_request = self.get_object()
        comments = request.data.get('comments', '')
        if not comments:
            return Response(
                {'error': 'Rejection reason (comments) is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        approver = getattr(request.user, 'employee_profile', None)
        if approver is None:
            return Response(
                {'error': 'User does not have an employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            reject_current_stage(approval_request, approver, comments)
        except ApprovalActionError as exc:
            return Response({'error': exc.message}, status=exc.status_code)

        serializer = ApprovalRequestDetailSerializer(approval_request)
        return Response(serializer.data)

    # ========================================================================
    # CUSTOM ACTION: CANCEL
    # ========================================================================

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        """
        Cancel an approval request.

        Request Body:
        {
            "reason": "Required cancellation reason"
        }

        Behavior:
        1. Verify user is requester or admin
        2. Mark request as cancelled
        3. Update content_object status (if applicable)
        """
        approval_request = self.get_object()
        reason = request.data.get('reason', '')

        if not reason:
            return Response(
                {'error': 'Cancellation reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get current user's employee profile
        try:
            user_employee = request.user.employee_profile
        except AttributeError:
            return Response(
                {'error': 'User does not have an employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify user is requester or has permission
        if approval_request.requester != user_employee and not request.user.is_staff:
            return Response(
                {'error': 'Only the requester or admin can cancel this request'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if request is in a state that can be cancelled
        if approval_request.status in ['approved', 'rejected', 'cancelled']:
            return Response(
                {'error': f'Cannot cancel request with status: {approval_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Save current approver before nullifying
            previous_approver = approval_request.current_approver

            # Mark request as cancelled
            approval_request.status = 'cancelled'
            approval_request.rejection_reason = reason
            approval_request.rejected_by = user_employee
            approval_request.rejection_date = timezone.now()
            approval_request.current_approver = None
            approval_request.save()

            # Update content_object status (no approval step for cancellation)
            update_content_object_status(approval_request, approved_step=None, action='cancel')

            # Notify previous approver if exists
            if previous_approver:
                notify_request_cancelled(approval_request, user_employee, reason)

        serializer = ApprovalRequestDetailSerializer(approval_request)
        return Response(serializer.data)

    # ========================================================================
    # CUSTOM ACTION: ESCALATE
    # ========================================================================

    @action(detail=True, methods=['post'], url_path='escalate')
    def escalate(self, request, pk=None):
        """
        Escalate an approval request to higher authority.

        Request Body:
        {
            "escalate_to": "employee_uuid",
            "reason": "Optional escalation reason"
        }

        Behavior:
        1. Mark current step as escalated
        2. Change current approver to escalated_to
        3. Create notification
        """
        approval_request = self.get_object()
        escalate_to_id = request.data.get('escalate_to')
        reason = request.data.get('reason', 'Request escalated')

        if not escalate_to_id:
            return Response(
                {'error': 'escalate_to employee ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get current user's employee profile
        try:
            user_employee = request.user.employee_profile
        except AttributeError:
            return Response(
                {'error': 'User does not have an employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get escalate_to employee
        from hr_employee.models import Employee
        try:
            escalate_to_employee = Employee.objects.get(id=escalate_to_id)
        except Employee.DoesNotExist:
            return Response(
                {'error': 'escalate_to employee not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if request can be escalated
        if approval_request.status not in ['pending', 'in_progress']:
            return Response(
                {'error': f'Cannot escalate request with status: {approval_request.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Get current stage
            workflow = approval_request.workflow
            if workflow:
                stages = workflow.stages
                current_stage_number = approval_request.current_stage

                current_stage = next(
                    (s for s in stages if s['stage_number'] == current_stage_number),
                    None
                )

                # Create escalated step
                if current_stage:
                    ApprovalStep.objects.create(
                        approval_request=approval_request,
                        stage_number=current_stage_number,
                        stage_name=current_stage['stage_name'],
                        approver=user_employee,
                        status='skipped',
                        decision_date=timezone.now(),
                        comments=f'Escalated: {reason}',
                        is_escalated=True,
                        escalated_at=timezone.now(),
                        escalated_to=escalate_to_employee
                    )

            # Update current approver
            approval_request.current_approver = escalate_to_employee
            approval_request.status = 'escalated'
            approval_request.save()

            # Notify escalated employee
            notify_request_escalated(approval_request, escalate_to_employee)

        serializer = ApprovalRequestDetailSerializer(approval_request)
        return Response(serializer.data)


class ApprovalStepViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for ApprovalStep model (READ-ONLY).

    Approval steps are the audit trail of approval decisions.
    They cannot be modified or deleted after creation.
    """
    queryset = ApprovalStep.objects.select_related(
        'approval_request',
        'approver',
        'escalated_to'
    ).all()
    serializer_class = ApprovalStepSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['approval_request', 'approver', 'status', 'stage_number']
    ordering_fields = ['created_at', 'decision_date', 'stage_number']
    ordering = ['approval_request', 'stage_number', 'created_at']


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Notification model.

    Provides endpoints for managing user notifications.
    Users can only see their own notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    filterset_fields = ['notification_type', 'is_read', 'priority']
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'priority', 'is_read']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filter notifications to only show the current user's notifications.
        """
        try:
            user_employee = self.request.user.employee_profile
            return Notification.objects.filter(
                recipient=user_employee
            ).select_related(
                'recipient',
                'approval_request'
            )
        except AttributeError:
            # User has no employee profile
            return Notification.objects.none()

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """
        Mark a notification as read.

        Example:
            POST /api/notifications/{id}/mark-read/
        """
        notification = self.get_object()
        notification.mark_as_read()

        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """
        Mark all notifications as read for the current user.

        Example:
            POST /api/notifications/mark-all-read/
        """
        try:
            user_employee = request.user.employee_profile
            unread_notifications = Notification.objects.filter(
                recipient=user_employee,
                is_read=False
            )

            count = unread_notifications.count()
            unread_notifications.update(
                is_read=True,
                read_at=timezone.now()
            )

            return Response({
                'message': f'{count} notifications marked as read',
                'count': count
            })
        except AttributeError:
            return Response(
                {'error': 'User does not have an employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """
        Get the count of unread notifications for the current user.

        Example:
            GET /api/notifications/unread-count/
        """
        try:
            user_employee = request.user.employee_profile
            count = Notification.objects.filter(
                recipient=user_employee,
                is_read=False
            ).count()

            return Response({
                'unread_count': count
            })
        except AttributeError:
            return Response(
                {'error': 'User does not have an employee profile'},
                status=status.HTTP_400_BAD_REQUEST
            )
