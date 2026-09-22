"""
Approval System Utilities
Helper functions for auto-creating approval requests and determining approvers.
"""

from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from decimal import Decimal

from .models import ApprovalWorkflow, ApprovalRequest, ApprovalGroup
from hr_employee.models import Employee


def auto_create_approval_request(content_object, requester, workflow_type, priority='medium', amount=None):
    """
    Automatically create an approval request for any content object.

    Args:
        content_object: The object requiring approval (LeaveRequest, Payable, etc.)
        requester: Employee who is requesting approval
        workflow_type: Type of workflow ('leave', 'expense', 'payable', etc.)
        priority: Priority level ('low', 'medium', 'high')
        amount: Optional monetary amount for conditional workflow selection

    Returns:
        ApprovalRequest instance or None if no workflow found

    Example:
        approval_request = auto_create_approval_request(
            content_object=leave_request,
            requester=employee,
            workflow_type='leave',
            priority='medium'
        )
    """
    # Find appropriate workflow (now considers requester's approval groups)
    workflow = get_appropriate_workflow(workflow_type, requester, priority, amount)

    if not workflow:
        return None

    # Generate request number
    last_request = ApprovalRequest.objects.order_by('-created_at').first()
    if last_request and last_request.request_number:
        try:
            last_number = int(last_request.request_number.split('-')[-1])
            next_number = last_number + 1
        except (ValueError, IndexError):
            next_number = 1
    else:
        next_number = 1

    request_number = f"APR-{timezone.now().year}-{next_number:06d}"

    # Generate request summary based on content type
    request_summary = generate_request_summary(content_object, workflow_type)

    # Determine initial approver
    current_approver = determine_first_approver(workflow, requester)

    # Calculate due date based on workflow (if escalation enabled)
    due_date = None
    if workflow.escalation_enabled and workflow.escalation_hours:
        from datetime import timedelta
        due_date = timezone.now() + timedelta(hours=workflow.escalation_hours)

    # Create approval request
    approval_request = ApprovalRequest.objects.create(
        request_number=request_number,
        workflow=workflow,
        content_type=ContentType.objects.get_for_model(content_object),
        object_id=content_object.id,
        requester=requester,
        request_summary=request_summary,
        current_stage=1,
        current_approver=current_approver,
        status='pending',
        priority=priority,
        amount=amount,
        due_date=due_date,
        submitted_date=timezone.now(),
    )

    # CREATE APPROVAL STEPS FOR STAGE 1 (NEW!)
    if workflow.stages:
        first_stage = workflow.stages[0]
        create_approval_steps_for_stage(approval_request, first_stage)

    # Send notifications
    # Notify the requester that their request was created
    notify_request_created(approval_request)

    # Notify the first approver that they have a new approval request
    if current_approver:
        notify_approval_required(approval_request)

    return approval_request


def get_appropriate_workflow(workflow_type, requester, priority='medium', amount=None):
    """
    Find the most appropriate workflow for the request using 3-tier priority logic.

    PRIORITY 1: Workflows assigned to requester's approval groups (M2M applicable_groups)
    PRIORITY 2: Workflows with conditions matching requester (department, role, amount, etc.)
    PRIORITY 3: Default workflow with no conditions/groups (company-wide)

    Args:
        workflow_type: Type of workflow ('leave', 'expense', 'payable', etc.)
        requester: Employee instance (requester of the approval)
        priority: Priority level ('low', 'medium', 'high', 'urgent')
        amount: Optional monetary amount

    Returns:
        ApprovalWorkflow instance or None
    """
    # ========================================================================
    # PRIORITY 1: Group-Specific Workflows (HIGHEST PRIORITY)
    # ========================================================================

    # Get requester's active approval groups
    requester_groups = ApprovalGroup.objects.filter(
        members=requester,
        is_active=True
    )

    if requester_groups.exists():
        # Find workflows assigned to any of requester's groups
        group_workflow = ApprovalWorkflow.objects.filter(
            workflow_type=workflow_type,
            is_active=True,
            applicable_groups__in=requester_groups
        ).distinct().first()

        if group_workflow:
            return group_workflow

    # ========================================================================
    # PRIORITY 2: Condition-Based Workflows
    # ========================================================================

    # Get requester group codes for condition matching
    requester_group_codes = list(requester_groups.values_list('code', flat=True))

    # Get all workflows with conditions, excluding those with applicable_groups
    workflows = ApprovalWorkflow.objects.filter(
        workflow_type=workflow_type,
        is_active=True
    ).exclude(
        applicable_groups__isnull=False  # Exclude group-specific workflows
    ).order_by('-created_at')

    for workflow in workflows:
        conditions = workflow.conditions or {}

        # If no conditions, this is a default workflow (skip for now)
        if not conditions:
            continue

        # Check all conditions (AND logic - all must match)
        conditions_met = True

        # Check approval group conditions
        if 'approval_groups' in conditions and conditions['approval_groups']:
            if not any(g in requester_group_codes for g in conditions['approval_groups']):
                conditions_met = False

        # Check department conditions
        if conditions_met and 'departments' in conditions and conditions['departments']:
            if not requester.department or requester.department.code not in conditions['departments']:
                conditions_met = False

        # Check employee role conditions
        if conditions_met and 'employee_roles' in conditions and conditions['employee_roles']:
            if requester.role not in conditions['employee_roles']:
                conditions_met = False

        # Check priority conditions
        if conditions_met and 'priority' in conditions and conditions['priority']:
            if priority not in conditions['priority']:
                conditions_met = False

        # Check amount conditions
        if conditions_met and amount is not None:
            if 'min_amount' in conditions:
                if amount < Decimal(str(conditions['min_amount'])):
                    conditions_met = False

            if conditions_met and 'max_amount' in conditions:
                if amount > Decimal(str(conditions['max_amount'])):
                    conditions_met = False

        # If all conditions matched, return this workflow
        if conditions_met:
            return workflow

    # ========================================================================
    # PRIORITY 3: Default Workflow (Company-Wide, No Conditions)
    # ========================================================================

    default_workflow = ApprovalWorkflow.objects.filter(
        workflow_type=workflow_type,
        is_active=True,
        conditions__isnull=True
    ).exclude(
        applicable_groups__isnull=False  # Exclude group-specific workflows
    ).first()

    if default_workflow:
        return default_workflow

    # ========================================================================
    # FALLBACK: Any active workflow of this type
    # ========================================================================

    fallback_workflow = ApprovalWorkflow.objects.filter(
        workflow_type=workflow_type,
        is_active=True
    ).first()

    return fallback_workflow


def determine_first_approver(workflow, requester):
    """
    Determine the first approver based on workflow configuration.

    NEW: Supports 'group' approver type for group-based approvals.

    Args:
        workflow: ApprovalWorkflow instance
        requester: Employee requesting approval

    Returns:
        Employee instance or None
    """
    if not workflow.stages:
        return None

    # Get first stage
    first_stage = next((s for s in workflow.stages if s['stage_number'] == 1), None)

    if not first_stage:
        return None

    approver_type = first_stage.get('approver_type')

    # ========================================================================
    # NEW: Group-based approver
    # ========================================================================
    if approver_type == 'group':
        approver_group_id = first_stage.get('approver_group_id')

        if not approver_group_id:
            return None

        try:
            approval_group = ApprovalGroup.objects.get(
                id=approver_group_id,
                is_active=True
            )

            # Return first active group member
            # NOTE: approval/views.py will handle 'any' vs 'all' approval logic
            first_member = approval_group.members.filter(
                is_active=True
            ).first()

            return first_member

        except ApprovalGroup.DoesNotExist:
            return None

    # ========================================================================
    # Position-based: requester's manager
    # ========================================================================
    elif approver_type == 'position':
        approver_position = first_stage.get('approver_position')

        if approver_position == 'manager':
            return requester.reports_to
        elif approver_position == 'supervisor':
            # Could traverse up hierarchy if needed
            return requester.reports_to

    # ========================================================================
    # Role-based: first employee with that role
    # ========================================================================
    elif approver_type == 'role':
        approver_role = first_stage.get('approver_position')

        approver = Employee.objects.filter(
            role=approver_role,
            is_active=True
        ).first()

        return approver

    # ========================================================================
    # Department head: head of requester's department
    # ========================================================================
    elif approver_type == 'department_head':
        if requester.department:
            # Assuming department has a 'head' field
            # Or find employees with department_head role in that department
            department_head = Employee.objects.filter(
                department=requester.department,
                role='department_head',
                is_active=True
            ).first()

            return department_head

    # ========================================================================
    # Specific employees: get first from list
    # ========================================================================
    elif approver_type == 'specific':
        approver_ids = first_stage.get('approver_employee_ids', [])

        if approver_ids:
            first_approver = Employee.objects.filter(
                id__in=approver_ids,
                is_active=True
            ).first()

            return first_approver

    return None


def generate_request_summary(content_object, workflow_type):
    """
    Generate a human-readable summary for the approval request.

    Args:
        content_object: The object being approved
        workflow_type: Type of workflow

    Returns:
        String summary
    """
    if workflow_type == 'leave':
        # LeaveRequest object
        if hasattr(content_object, 'leave_policy') and hasattr(content_object, 'working_days_count'):
            return f"{content_object.leave_policy.display_name}: {content_object.working_days_count} days"
        return "Leave Request"

    elif workflow_type == 'expense':
        # Expense object
        if hasattr(content_object, 'category') and hasattr(content_object, 'total_amount'):
            return f"Expense ({content_object.category}): ZWG {content_object.total_amount:,.2f}"
        return "Expense Request"

    elif workflow_type == 'payable':
        # Payable object
        if hasattr(content_object, 'vendor') and hasattr(content_object, 'total_amount'):
            vendor_name = content_object.vendor.company_name if content_object.vendor else "Vendor"
            return f"Payment to {vendor_name}: ZWG {content_object.total_amount:,.2f}"
        return "Payable Request"

    elif workflow_type == 'receivable':
        # Receivable object
        if hasattr(content_object, 'member') and hasattr(content_object, 'amount'):
            member_name = f"{content_object.member.first_name} {content_object.member.last_name}"
            return f"Payment from {member_name}: ZWG {content_object.amount:,.2f}"
        return "Receivable Request"

    elif workflow_type == 'petty_cash':
        # Petty cash object
        if hasattr(content_object, 'amount'):
            return f"Petty Cash: ZWG {content_object.amount:,.2f}"
        return "Petty Cash Request"

    elif workflow_type == 'procurement':
        # Procurement object
        if hasattr(content_object, 'total_amount'):
            return f"Procurement: ZWG {content_object.total_amount:,.2f}"
        return "Procurement Request"

    elif workflow_type == 'document':
        # Document object
        if hasattr(content_object, 'title'):
            return f"Document: {content_object.title}"
        return "Document Approval"

    # Default fallback
    return f"{workflow_type.replace('_', ' ').title()} Request"


def update_content_object_status(approval_request, new_status):
    """
    Update the status of the content object when approval request status changes.

    Args:
        approval_request: ApprovalRequest instance
        new_status: New status ('approved', 'rejected', 'cancelled')

    Example:
        update_content_object_status(approval_request, 'approved')
    """
    content_object = approval_request.content_object

    if not content_object:
        return

    # Only update if content object has a status field
    if hasattr(content_object, 'status'):
        content_object.status = new_status
        content_object.save()


# ========================================================================
# NOTIFICATION UTILITIES
# ========================================================================

def create_notification(recipient, notification_type, title, message, approval_request=None, priority='medium', action_url=None, metadata=None):
    """
    Create a notification for a user.

    Args:
        recipient: Employee who will receive the notification
        notification_type: Type of notification (approval_required, approved, rejected, etc.)
        title: Notification title
        message: Notification message
        approval_request: Related ApprovalRequest (optional)
        priority: Notification priority (low, medium, high, urgent)
        action_url: URL to navigate to when clicked (optional)
        metadata: Additional data (optional)

    Returns:
        Notification instance

    Example:
        create_notification(
            recipient=approver,
            notification_type='approval_required',
            title='New Approval Request',
            message='You have a new leave request to approve',
            approval_request=approval_request,
            priority='medium'
        )
    """
    from .models import Notification

    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        title=title,
        message=message,
        approval_request=approval_request,
        priority=priority,
        action_url=action_url,
        metadata=metadata or {}
    )

    return notification


def notify_approval_required(approval_request):
    """
    Notify the current approver that they have a new approval request.

    Args:
        approval_request: ApprovalRequest instance

    Returns:
        Notification instance or None
    """
    if not approval_request.current_approver:
        return None

    # Get workflow and stage info
    workflow = approval_request.workflow
    stage_name = "Approval"

    if workflow and workflow.stages:
        current_stage = next(
            (s for s in workflow.stages if s['stage_number'] == approval_request.current_stage),
            None
        )
        if current_stage:
            stage_name = current_stage.get('stage_name', 'Approval')

    title = f"New Approval Required: {approval_request.request_number}"
    message = f"You have a new {stage_name} request from {approval_request.requester.get_full_name()}.\n\n{approval_request.request_summary}"

    action_url = f"/approvals/{approval_request.id}"

    return create_notification(
        recipient=approval_request.current_approver,
        notification_type='approval_required',
        title=title,
        message=message,
        approval_request=approval_request,
        priority=approval_request.priority,
        action_url=action_url,
        metadata={
            'request_number': approval_request.request_number,
            'requester_id': str(approval_request.requester.id),
            'stage': approval_request.current_stage
        }
    )


def notify_request_approved(approval_request, approver):
    """
    Notify the requester that their request was approved.

    Args:
        approval_request: ApprovalRequest instance
        approver: Employee who approved the request

    Returns:
        Notification instance
    """
    title = f"Request Approved: {approval_request.request_number}"
    message = f"Your request has been approved by {approver.get_full_name()}.\n\n{approval_request.request_summary}"

    action_url = f"/approvals/{approval_request.id}"

    return create_notification(
        recipient=approval_request.requester,
        notification_type='approved',
        title=title,
        message=message,
        approval_request=approval_request,
        priority='medium',
        action_url=action_url,
        metadata={
            'request_number': approval_request.request_number,
            'approver_id': str(approver.id),
            'approved_at': timezone.now().isoformat()
        }
    )


def notify_request_rejected(approval_request, rejector, reason):
    """
    Notify the requester that their request was rejected.

    Args:
        approval_request: ApprovalRequest instance
        rejector: Employee who rejected the request
        reason: Rejection reason

    Returns:
        Notification instance
    """
    title = f"Request Rejected: {approval_request.request_number}"
    message = f"Your request has been rejected by {rejector.get_full_name()}.\n\nReason: {reason}\n\n{approval_request.request_summary}"

    action_url = f"/approvals/{approval_request.id}"

    return create_notification(
        recipient=approval_request.requester,
        notification_type='rejected',
        title=title,
        message=message,
        approval_request=approval_request,
        priority='high',
        action_url=action_url,
        metadata={
            'request_number': approval_request.request_number,
            'rejector_id': str(rejector.id),
            'rejection_reason': reason,
            'rejected_at': timezone.now().isoformat()
        }
    )


def notify_request_cancelled(approval_request, canceller, reason):
    """
    Notify the current approver that a request was cancelled.

    Args:
        approval_request: ApprovalRequest instance
        canceller: Employee who cancelled the request
        reason: Cancellation reason

    Returns:
        Notification instance or None
    """
    if not approval_request.current_approver:
        return None

    title = f"Request Cancelled: {approval_request.request_number}"
    message = f"A request has been cancelled by {canceller.get_full_name()}.\n\nReason: {reason}\n\n{approval_request.request_summary}"

    action_url = f"/approvals/{approval_request.id}"

    return create_notification(
        recipient=approval_request.current_approver,
        notification_type='cancelled',
        title=title,
        message=message,
        approval_request=approval_request,
        priority='low',
        action_url=action_url,
        metadata={
            'request_number': approval_request.request_number,
            'canceller_id': str(canceller.id),
            'cancellation_reason': reason,
            'cancelled_at': timezone.now().isoformat()
        }
    )


def notify_request_escalated(approval_request, escalated_to):
    """
    Notify the escalated approver that a request has been escalated to them.

    Args:
        approval_request: ApprovalRequest instance
        escalated_to: Employee to whom the request was escalated

    Returns:
        Notification instance
    """
    title = f"Escalated Request: {approval_request.request_number}"
    message = f"A request from {approval_request.requester.get_full_name()} has been escalated to you for approval.\n\n{approval_request.request_summary}"

    action_url = f"/approvals/{approval_request.id}"

    return create_notification(
        recipient=escalated_to,
        notification_type='escalated',
        title=title,
        message=message,
        approval_request=approval_request,
        priority='urgent',
        action_url=action_url,
        metadata={
            'request_number': approval_request.request_number,
            'requester_id': str(approval_request.requester.id),
            'escalated_at': timezone.now().isoformat()
        }
    )


def notify_stage_advanced(approval_request, new_approver, stage_name):
    """
    Notify the new approver when a request advances to the next stage.

    Args:
        approval_request: ApprovalRequest instance
        new_approver: Employee who is now the current approver
        stage_name: Name of the new stage

    Returns:
        Notification instance
    """
    title = f"New Approval Required: {approval_request.request_number}"
    message = f"A request from {approval_request.requester.get_full_name()} has advanced to {stage_name} and requires your approval.\n\n{approval_request.request_summary}"

    action_url = f"/approvals/{approval_request.id}"

    return create_notification(
        recipient=new_approver,
        notification_type='stage_advanced',
        title=title,
        message=message,
        approval_request=approval_request,
        priority=approval_request.priority,
        action_url=action_url,
        metadata={
            'request_number': approval_request.request_number,
            'requester_id': str(approval_request.requester.id),
            'stage': approval_request.current_stage,
            'stage_name': stage_name
        }
    )


def notify_request_created(approval_request):
    """
    Notify the requester that their approval request was created successfully.

    Args:
        approval_request: ApprovalRequest instance

    Returns:
        Notification instance
    """
    title = f"Request Submitted: {approval_request.request_number}"

    approver_name = "the approver"
    if approval_request.current_approver:
        approver_name = approval_request.current_approver.get_full_name()

    message = f"Your request has been submitted and is awaiting approval from {approver_name}.\n\n{approval_request.request_summary}"

    action_url = f"/approvals/{approval_request.id}"

    return create_notification(
        recipient=approval_request.requester,
        notification_type='request_created',
        title=title,
        message=message,
        approval_request=approval_request,
        priority='low',
        action_url=action_url,
        metadata={
            'request_number': approval_request.request_number,
            'submitted_at': approval_request.submitted_date.isoformat()
        }
    )


# ============================================================================
# AUTO-ADVANCE AND NOTIFICATION FUNCTIONS
# ============================================================================

def create_approval_steps_for_stage(approval_request, stage_config):
    """
    Create approval steps for a specific stage.

    Args:
        approval_request: ApprovalRequest instance
        stage_config: Dict containing stage configuration from workflow
    """
    from .models import ApprovalStep

    stage_num = stage_config['stage_number']
    approver_ids = stage_config.get('approver_employee_ids', [])
    action_type = stage_config.get('action_type', 'approve')

    for approver_id in approver_ids:
        ApprovalStep.objects.create(
            approval_request=approval_request,
            stage_number=stage_num,
            stage_name=stage_config['stage_name'],
            approver_id=approver_id,
            action_type=action_type,
            status='pending',
        )


def advance_approval_stage(approval_request):
    """
    Auto-advance to next stage after current stage is approved.
    Mark as complete if all stages are done.

    Args:
        approval_request: ApprovalRequest instance
    """
    from .models import ApprovalStep

    current_stage = approval_request.current_stage
    workflow = approval_request.workflow

    # Get current stage configuration
    stage_config = None
    for stage in workflow.stages:
        if stage['stage_number'] == current_stage:
            stage_config = stage
            break

    if not stage_config:
        return

    # Check if all steps in current stage meet approval logic
    current_stage_steps = ApprovalStep.objects.filter(
        approval_request=approval_request,
        stage_number=current_stage
    )

    approval_logic = stage_config.get('approval_logic', 'any')
    approved_count = current_stage_steps.filter(status='approved').count()
    total_count = current_stage_steps.count()

    stage_complete = False
    if approval_logic == 'any' and approved_count >= 1:
        stage_complete = True
    elif approval_logic == 'all' and approved_count == total_count:
        stage_complete = True

    if not stage_complete:
        return

    # Mark remaining pending steps as skipped
    current_stage_steps.filter(status='pending').update(status='skipped')

    # Check if there's a next stage
    next_stage_num = current_stage + 1
    next_stage_config = None
    for stage in workflow.stages:
        if stage['stage_number'] == next_stage_num:
            next_stage_config = stage
            break

    if next_stage_config:
        # Advance to next stage
        approval_request.current_stage = next_stage_num

        # Get first approver from next stage
        next_approver_ids = next_stage_config.get('approver_employee_ids', [])
        next_approver = Employee.objects.filter(id__in=next_approver_ids).first() if next_approver_ids else None

        approval_request.current_approver = next_approver
        approval_request.status = 'in_progress'
        approval_request.save(update_fields=['current_stage', 'current_approver', 'status'])

        # Create approval steps for next stage
        create_approval_steps_for_stage(approval_request, next_stage_config)

        # Notify next approver
        if next_approver:
            notify_approval_required(approval_request)

    else:
        # All stages complete - mark as approved
        approval_request.current_stage = current_stage
        approval_request.current_approver = None
        approval_request.status = 'approved'
        approval_request.final_approval_date = timezone.now()
        approval_request.save(update_fields=['current_approver', 'status', 'final_approval_date'])

        # Update the original object
        update_content_object_status(approval_request, 'approved')

        # Send final notification
        notify_final_approval(approval_request)


def update_content_object_status(approval_request, new_status):
    """
    Update the status of the object being approved.

    Args:
        approval_request: ApprovalRequest instance
        new_status: New status to set ('approved' or 'rejected')
    """
    content_object = approval_request.content_object

    if hasattr(content_object, 'status'):
        content_object.status = new_status
        content_object.save(update_fields=['status'])


def notify_approval_action(approval_step, action_type='approved'):
    """
    Send notifications when an approval action is taken.

    Args:
        approval_step: ApprovalStep instance
        action_type: 'approved' or 'rejected'
    """
    from .models import Notification

    approval_request = approval_step.approval_request

    # Action verbs for messages
    action_verbs = {
        'approved': 'approved',
        'rejected': 'rejected',
    }

    # Action labels based on step's action_type
    action_labels = {
        'certify': 'certified',
        'recommend': 'recommended',
        'approve': 'approved',
        'review': 'reviewed',
    }

    action_label = action_labels.get(approval_step.action_type, 'processed')

    # Build message based on action type
    if action_type == 'approved':
        title = f'Request {action_label.capitalize()}'
        message = f'{approval_step.approver.get_full_name()} has {action_label} your {approval_request.workflow.workflow_type} request'
    else:
        title = 'Request Rejected'
        message = f'{approval_step.approver.get_full_name()} has rejected your {approval_request.workflow.workflow_type} request'

    if approval_step.comments:
        message += f'\n\nComments: {approval_step.comments}'

    # Notify the requester
    create_notification(
        recipient=approval_request.requester,
        notification_type=action_type,
        title=title,
        message=message,
        approval_request=approval_request,
        priority='high' if action_type == 'rejected' else 'medium',
        action_url=f'/approvals/{approval_request.id}',
        metadata={
            'request_number': approval_request.request_number,
            'stage_number': approval_step.stage_number,
            'approver': approval_step.approver.get_full_name(),
            'action_type': approval_step.action_type,
        }
    )


def notify_final_approval(approval_request):
    """
    Notify requester when all stages are complete.

    Args:
        approval_request: ApprovalRequest instance
    """
    title = 'Request Fully Approved'
    message = f'Great news! Your {approval_request.workflow.workflow_type} request has been fully approved and processed.'

    return create_notification(
        recipient=approval_request.requester,
        notification_type='approved',
        title=title,
        message=message,
        approval_request=approval_request,
        priority='high',
        action_url=f'/approvals/{approval_request.id}',
        metadata={
            'request_number': approval_request.request_number,
            'final_approval_date': approval_request.final_approval_date.isoformat() if approval_request.final_approval_date else None,
        }
    )
