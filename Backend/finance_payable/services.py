"""
Payable business logic.

A payable's lifecycle is driven by its approval workflow (workflow_type='payable'):
approval stages (verify / recommend / approve ...) followed by a Pay stage.
  - pending   while approval stages are open
  - approved  once the request reaches the Pay stage (awaiting payment)
  - paid      when the Pay-stage assignee records the payment (record_payment)
  - rejected  if any approver rejects
"""
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError

from approval.models import ApprovalRequest
from approval.services import (
    PAY_ACTION,
    ApprovalActionError,
    approve_current_stage,
    get_stage_config,
    mark_awaiting_payment,
)
from approval.utils import (
    auto_create_approval_request,
    generate_request_summary,
    get_appropriate_workflow,
)

from .models import Payable

WORKFLOW_TYPE = 'payable'
OPEN_APPROVAL_STATUSES = ('pending', 'in_progress')


def generate_payable_number() -> str:
    """Next PAY-YYYY-###### number."""
    last_payable = Payable.objects.order_by('-created_at').first()
    next_number = 1
    if last_payable and last_payable.payable_number:
        try:
            next_number = int(last_payable.payable_number.split('-')[-1]) + 1
        except (ValueError, IndexError):
            next_number = 1
    return f"PAY-{timezone.now().year}-{next_number:06d}"


def get_approval_request(payable: Payable) -> ApprovalRequest | None:
    """Latest approval request for a payable (uses the view's prefetch when available)."""
    prefetched = getattr(payable, 'prefetched_approvals', None)
    if prefetched is not None:
        return prefetched[0] if prefetched else None
    return (
        payable.approval_requests.select_related('workflow', 'current_approver')
        .order_by('-created_at')
        .first()
    )


def current_action_type(approval_request: ApprovalRequest | None) -> str | None:
    """Action type ('approve', 'pay', ...) of the request's current stage."""
    if approval_request is None:
        return None
    stage = get_stage_config(approval_request, approval_request.current_stage)
    return stage.get('action_type', 'approve') if stage else None


def _approval_metadata(payable: Payable) -> dict:
    return {'type': WORKFLOW_TYPE, 'currency': payable.currency, 'payee_type': payable.payee_type}


def submit_for_approval(payable: Payable, requester) -> ApprovalRequest:
    """
    Start the payable approval workflow. Must be called inside the creating transaction:
    raises ValidationError (rolling the payable back) if no usable workflow is configured.
    """
    amount = payable.total_amount
    workflow = get_appropriate_workflow(WORKFLOW_TYPE, requester, payable.priority, amount)
    if workflow is None:
        raise ValidationError({
            'approval': 'No active payable approval workflow is configured. '
                        'Ask Finance to set one up in Finance Settings.'
        })
    if not any(stage.get('action_type') == PAY_ACTION for stage in workflow.stages or []):
        raise ValidationError({
            'approval': f'The payable workflow "{workflow.workflow_name}" has no Pay stage, so nobody '
                        'could record the payment. Add a final Pay stage in Finance Settings.'
        })

    approval_request = auto_create_approval_request(
        content_object=payable,
        requester=requester,
        workflow_type=WORKFLOW_TYPE,
        priority=payable.priority,
        amount=amount,
    )
    if approval_request is None or approval_request.current_approver_id is None:
        raise ValidationError({
            'approval': 'Could not determine who should approve this payable. '
                        'Check the approvers in the payable workflow.'
        })

    approval_request.metadata = {**(approval_request.metadata or {}), **_approval_metadata(payable)}
    approval_request.save(update_fields=['metadata'])

    # A workflow may go straight to payment (single Pay stage)
    mark_awaiting_payment(approval_request, get_stage_config(approval_request, approval_request.current_stage))
    payable.refresh_from_db(fields=['status'])
    return approval_request


def payable_is_editable(payable: Payable) -> bool:
    """A payable can be edited or deleted until an approver has acted on it."""
    if payable.status != 'pending':
        return False
    approval_request = get_approval_request(payable)
    return approval_request is None or approval_request.status == 'pending'


def sync_approval_request(payable: Payable) -> None:
    """Keep the approval request's amount and summary in line with an edited payable."""
    approval_request = get_approval_request(payable)
    if approval_request is None:
        return
    approval_request.amount = payable.total_amount
    approval_request.request_summary = generate_request_summary(payable, WORKFLOW_TYPE)
    approval_request.metadata = {**(approval_request.metadata or {}), **_approval_metadata(payable)}
    approval_request.save(update_fields=['amount', 'request_summary', 'metadata'])


def _as_api_error(exc: ApprovalActionError) -> Exception:
    if exc.status_code == status.HTTP_403_FORBIDDEN:
        return PermissionDenied(exc.message)
    if exc.status_code == status.HTTP_404_NOT_FOUND:
        return NotFound(exc.message)
    return ValidationError({'detail': exc.message})


def record_payment(payable_id, employee, data: dict) -> Payable:
    """
    Record payment of an approved payable and complete the workflow's Pay stage.

    Only the employee whose turn it is at the Pay stage may do this, regardless of role.
    Member balances are intentionally not changed; this only records the payment.
    """
    with transaction.atomic():
        payable = Payable.objects.select_for_update().get(pk=payable_id)
        approval_request = get_approval_request(payable)

        if (
            approval_request is None
            or approval_request.status not in OPEN_APPROVAL_STATUSES
            or approval_request.current_approver_id != employee.id
            or current_action_type(approval_request) != PAY_ACTION
        ):
            raise PermissionDenied('Only the person assigned to the Pay stage of the workflow can mark this payable as paid.')

        if payable.status != 'approved':
            raise ValidationError({'detail': f'Only approved payables can be marked as paid (status: {payable.status}).'})

        payable.paid_date = data['paid_date']
        payable.payment_method = data['payment_method']
        payable.payment_reference = data.get('payment_reference') or None
        payable.paid_by = employee
        if data.get('notes'):
            payable.notes = f"{payable.notes or ''}\n[Paid] {data['notes']}".strip()
        payable.save()

        comment = f"Paid via {payable.payment_method}"
        if payable.payment_reference:
            comment += f" (ref {payable.payment_reference})"
        try:
            approve_current_stage(approval_request, employee, comment)
        except ApprovalActionError as exc:
            raise _as_api_error(exc)

        # The Pay stage is normally the last one, which sets 'paid' via the workflow;
        # make sure the payment is reflected even if later stages exist.
        payable.refresh_from_db()
        if payable.status != 'paid':
            payable.status = 'paid'
            payable.save(update_fields=['status', 'updated_at'])

    return payable
