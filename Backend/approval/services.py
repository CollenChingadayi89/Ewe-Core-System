"""
Approval engine actions shared by the approval API and feature modules.

Feature modules (e.g. payables "mark paid") complete workflow stages through these
functions so there is one implementation of stage progression.
"""
from django.db import transaction
from django.utils import timezone
from rest_framework import status

from .models import ApprovalRequest, ApprovalStep
from .utils import (
    determine_first_approver,
    notify_request_approved,
    notify_request_rejected,
    notify_stage_advanced,
    update_content_object_status,
)

PAY_ACTION = 'pay'


class ApprovalActionError(Exception):
    """An approval action was refused. Carries the HTTP status the API should return."""

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def get_stage_config(approval_request: ApprovalRequest, stage_number: int) -> dict | None:
    """Return the workflow stage configuration for a stage number, if any."""
    workflow = approval_request.workflow
    if not workflow:
        return None
    return next((s for s in workflow.stages if s['stage_number'] == stage_number), None)


def is_final_stage(approval_request: ApprovalRequest) -> bool:
    """True when approving the current stage would complete the workflow."""
    next_stage = get_stage_config(approval_request, approval_request.current_stage + 1)
    return next_stage is None or not next_stage.get('is_required', True)


def current_action_type(approval_request: ApprovalRequest | None) -> str | None:
    """Action type ('approve', 'pay', ...) of the request's current stage."""
    if approval_request is None:
        return None
    stage = get_stage_config(approval_request, approval_request.current_stage)
    return stage.get('action_type', 'approve') if stage else None


def approval_summary(approval_request: ApprovalRequest | None, employee_id) -> dict | None:
    """
    Where an object is in its approval workflow, and whether the viewer can act now.
    can_act mirrors the engine's check (current approver + open request).
    """
    if approval_request is None:
        return None
    stages = approval_request.workflow.stages if approval_request.workflow else []
    stage = get_stage_config(approval_request, approval_request.current_stage)
    is_open = approval_request.status in ('pending', 'in_progress')
    return {
        'id': str(approval_request.id),
        'request_number': approval_request.request_number,
        'status': approval_request.status,
        'current_stage': approval_request.current_stage,
        'total_stages': len(stages),
        'current_stage_name': stage.get('stage_name') if stage and is_open else None,
        'current_action_type': current_action_type(approval_request) if is_open else None,
        'is_final_stage': bool(is_open and is_final_stage(approval_request)),
        'current_approver_name': (
            approval_request.current_approver.get_full_name()
            if is_open and approval_request.current_approver else None
        ),
        'can_act': bool(is_open and employee_id and approval_request.current_approver_id == employee_id),
    }


def _check_final_approval_allowed(approval_request: ApprovalRequest) -> None:
    """
    Objects can refuse completion of their workflow until they are ready, by defining
    validate_final_approval() -> str | None (an error message, or None when ready).
    """
    if not is_final_stage(approval_request):
        return
    validator = getattr(approval_request.content_object, 'validate_final_approval', None)
    message = validator() if callable(validator) else None
    if message:
        raise ApprovalActionError(message)


def _check_can_act(approval_request: ApprovalRequest, approver, action: str) -> None:
    if approval_request.current_approver_id != approver.id:
        raise ApprovalActionError(
            'You are not the current approver for this request', status.HTTP_403_FORBIDDEN
        )
    if approval_request.status not in ['pending', 'in_progress']:
        raise ApprovalActionError(f'Cannot {action} request with status: {approval_request.status}')


def _determine_stage_approver(stage_config: dict, requester):
    """Resolve the approver for a single stage using the workflow's first-approver rules."""

    class SingleStageWorkflow:
        def __init__(self, stages):
            self.stages = stages

    return determine_first_approver(SingleStageWorkflow([stage_config]), requester)


def mark_awaiting_payment(approval_request: ApprovalRequest, stage_config: dict | None, approved_by=None) -> None:
    """
    When a request reaches a Pay stage, everything that needed approving has been approved,
    so the underlying object is set to 'approved' (awaiting payment) if it supports that status.
    `approved_by` (the approver who completed the last approval stage) is recorded when the
    object tracks it, since the final Pay stage sets 'paid' rather than 'approved'.
    """
    if not stage_config or stage_config.get('action_type') != PAY_ACTION:
        return
    content_object = approval_request.content_object
    if content_object is None or not hasattr(content_object, 'status'):
        return
    valid_statuses = {value for value, _ in content_object._meta.get_field('status').choices or []}
    if 'approved' not in valid_statuses or content_object.status == 'approved':
        return

    field_names = {f.name for f in content_object._meta.concrete_fields}
    update_fields = ['status']
    content_object.status = 'approved'
    if approved_by is not None and 'approved_by' in field_names:
        content_object.approved_by = approved_by
        update_fields.append('approved_by')
    if approved_by is not None and 'approved_date' in field_names:
        content_object.approved_date = timezone.now()
        update_fields.append('approved_date')
    if 'updated_at' in field_names:
        update_fields.append('updated_at')
    content_object.save(update_fields=update_fields)


def approve_current_stage(approval_request: ApprovalRequest, approver, comments: str = '') -> ApprovalRequest:
    """
    Approve the current stage for `approver` and advance the workflow.

    Raises ApprovalActionError if the approver cannot act on the request.
    """
    _check_can_act(approval_request, approver, 'approve')
    _check_final_approval_allowed(approval_request)

    with transaction.atomic():
        workflow = approval_request.workflow
        if not workflow:
            raise ApprovalActionError('Approval request has no workflow configured')

        stages = workflow.stages
        current_stage_number = approval_request.current_stage
        current_stage = get_stage_config(approval_request, current_stage_number)
        if not current_stage:
            raise ApprovalActionError(f'Stage {current_stage_number} not found in workflow')

        try:
            approval_step = ApprovalStep.objects.get(
                approval_request=approval_request,
                stage_number=current_stage_number,
                approver=approver,
                status='pending'
            )
        except ApprovalStep.DoesNotExist:
            raise ApprovalActionError(
                'No pending approval step found for this approver', status.HTTP_404_NOT_FOUND
            )

        approval_step.status = 'approved'
        approval_step.decision_date = timezone.now()
        approval_step.comments = comments
        approval_step.save()

        if current_stage.get('approval_logic', 'any') == 'all':
            approved_count = ApprovalStep.objects.filter(
                approval_request=approval_request,
                stage_number=current_stage_number,
                status='approved'
            ).count()
            required_approvers = len(current_stage.get('approver_employee_ids', []))

            if approved_count < required_approvers:
                # Still waiting for other approvers in this stage
                approval_request.status = 'in_progress'
                approval_request.save()
                return approval_request

        next_stage_number = current_stage_number + 1
        next_stage = next((s for s in stages if s['stage_number'] == next_stage_number), None)

        if next_stage and next_stage.get('is_required', True):
            auto_conditions = next_stage.get('auto_approve_conditions')
            should_auto_approve = False
            if auto_conditions and 'amount_less_than' in auto_conditions:
                amount = float(approval_request.amount or 0)
                should_auto_approve = amount < auto_conditions['amount_less_than']

            if should_auto_approve:
                ApprovalStep.objects.create(
                    approval_request=approval_request,
                    stage_number=next_stage_number,
                    stage_name=next_stage['stage_name'],
                    approver=approver,
                    status='approved',
                    decision_date=timezone.now(),
                    comments='Auto-approved based on workflow conditions'
                )
                approval_request.current_stage = next_stage_number + 1
                approval_request.status = 'in_progress'
                approval_request.save()
                # Handle the stage after the auto-approved one
                return approve_current_stage(approval_request, approver, comments)

            approval_request.current_stage = next_stage_number
            approval_request.status = 'in_progress'
            next_approver = _determine_stage_approver(next_stage, approval_request.requester)
            approval_request.current_approver = next_approver
            approval_request.save()

            mark_awaiting_payment(approval_request, next_stage, approved_by=approver)

            if next_approver:
                notify_stage_advanced(approval_request, next_approver, next_stage['stage_name'])
        else:
            # No more stages, request is fully approved
            approval_request.status = 'approved'
            approval_request.final_approval_date = timezone.now()
            approval_request.current_approver = None
            approval_request.save()

            update_content_object_status(approval_request, approved_step=approval_step, action='approve')

            # Objects can react to completing their workflow (e.g. procurement creates its record)
            on_final_approval = getattr(approval_request.content_object, 'on_final_approval', None)
            if callable(on_final_approval):
                on_final_approval()

            notify_request_approved(approval_request, approver)

    return approval_request


CANCELLABLE_STATUSES = ('pending', 'in_progress', 'escalated')


def workflow_participants(approval_request: ApprovalRequest) -> list:
    """
    Everyone involved in a request's workflow: approvers named on any stage (past, current
    and upcoming, including the Pay stage), anyone with a step on the request, and the
    current approver (covers role/position-based stages without named approvers).
    """
    from hr_employee.models import Employee

    ids = set()
    for stage in (approval_request.workflow.stages if approval_request.workflow else []):
        ids.update(str(i) for i in stage.get('approver_employee_ids') or [])
    ids.update(str(i) for i in approval_request.approval_steps.values_list('approver_id', flat=True))
    if approval_request.current_approver_id:
        ids.add(str(approval_request.current_approver_id))
    return list(Employee.objects.filter(id__in=ids))


def cancel_request(approval_request: ApprovalRequest, user, reason: str) -> ApprovalRequest:
    """
    The requester (or an admin) withdraws a request before its final approval.
    Open steps are skipped, the underlying object is marked cancelled, and everyone in
    the workflow is notified.
    """
    from .utils import create_notification

    reason = (reason or '').strip()
    if not reason:
        raise ApprovalActionError('Cancellation reason is required')
    canceller = getattr(user, 'employee_profile', None)
    is_requester = canceller is not None and approval_request.requester_id == canceller.id
    if not (is_requester or user.is_staff or user.is_superuser):
        raise ApprovalActionError('Only the requester can cancel this request', status.HTTP_403_FORBIDDEN)
    if approval_request.status not in CANCELLABLE_STATUSES:
        raise ApprovalActionError(
            f'This request is already {approval_request.status} and can no longer be cancelled'
        )

    with transaction.atomic():
        participants = workflow_participants(approval_request)
        now = timezone.now()

        # .update(): ApprovalStep.save() would fire approval notifications/advancement
        approval_request.approval_steps.filter(status='pending').update(status='skipped', updated_at=now)

        approval_request.status = 'cancelled'
        approval_request.rejection_reason = reason
        approval_request.rejected_by = canceller
        approval_request.rejection_date = now
        approval_request.current_approver = None
        approval_request.metadata = {
            **(approval_request.metadata or {}),
            'cancelled_by': str(canceller.id) if canceller else None,
            'cancellation_reason': reason,
            'cancelled_at': now.isoformat(),
        }
        approval_request.save()

        update_content_object_status(approval_request, approved_step=None, action='cancel')

        canceller_name = canceller.get_full_name() if canceller else user.get_full_name() or user.email
        for employee in participants:
            if canceller is not None and employee.id == canceller.id:
                continue
            create_notification(
                recipient=employee,
                notification_type='cancelled',
                title=f'Request Cancelled: {approval_request.request_number}',
                message=(
                    f'{canceller_name} cancelled this request, so no further action is needed from you.\n\n'
                    f'Reason: {reason}\n\n{approval_request.request_summary}'
                ),
                approval_request=approval_request,
                priority='medium',
                action_url='/approvals',
                metadata={'request_number': approval_request.request_number, 'cancellation_reason': reason},
            )

    return approval_request


def reject_current_stage(approval_request: ApprovalRequest, approver, comments: str) -> ApprovalRequest:
    """
    Reject the request at its current stage.

    The approver's existing pending step is updated rather than a new step created:
    ApprovalStep is unique per (request, stage, approver), so creating one crashed
    whenever the approver already had a pending step for the stage.
    """
    if not comments:
        raise ApprovalActionError('Rejection reason (comments) is required')
    _check_can_act(approval_request, approver, 'reject')

    with transaction.atomic():
        rejection_step = None
        current_stage = get_stage_config(approval_request, approval_request.current_stage)
        if current_stage:
            now = timezone.now()
            rejection_step = ApprovalStep.objects.filter(
                approval_request=approval_request,
                stage_number=approval_request.current_stage,
                approver=approver,
            ).first()
            if rejection_step is None:
                rejection_step = ApprovalStep.objects.create(
                    approval_request=approval_request,
                    stage_number=approval_request.current_stage,
                    stage_name=current_stage['stage_name'],
                    approver=approver,
                    action_type=current_stage.get('action_type', 'approve'),
                    status='rejected',
                    decision_date=now,
                    comments=comments,
                )
            else:
                # .update() rather than save(): ApprovalStep.save() sends its own rejection
                # notification, which would duplicate notify_request_rejected below.
                ApprovalStep.objects.filter(pk=rejection_step.pk).update(
                    status='rejected', decision_date=now, comments=comments, updated_at=now,
                )
                rejection_step.status = 'rejected'
                rejection_step.decision_date = now
                rejection_step.comments = comments

        approval_request.status = 'rejected'
        approval_request.rejection_date = timezone.now()
        approval_request.rejection_reason = comments
        approval_request.rejected_by = approver
        approval_request.current_approver = None
        approval_request.save()

        update_content_object_status(approval_request, approved_step=rejection_step, action='reject')
        notify_request_rejected(approval_request, approver, comments)

    return approval_request
