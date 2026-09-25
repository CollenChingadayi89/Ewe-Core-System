"""
Procurement records: what the SACCO owes a supplier after a procurement is approved,
the installment schedule, and the immutable payment ledger.

Lifecycle:
  - Final approval of a procurement request creates a record (awaiting_terms) linked to the
    winning vendor, and notifies the requester.
  - The requester (or Finance) sets payment terms, generating the installment schedule (active).
  - Payables reserve installments while open (pending/approved); when a payable is marked paid,
    apply_payable_payment() writes ProcurementPayment ledger rows and reduces the installments.
  - When every installment is paid the record is completed.
"""
import calendar
from datetime import date, timedelta
from decimal import ROUND_DOWN, Decimal

from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError

from accounts.permissions import is_finance_user
from approval.utils import create_notification

from .models import ProcurementInstallment, ProcurementPayment, ProcurementRecord, ProcurementRequest

# Payable statuses in which a payable still holds (reserves) the installments it covers
OPEN_PAYABLE_STATUSES = ('pending', 'approved')
CLOSED_PAYABLE_STATUSES = ('rejected', 'cancelled')
CENT = Decimal('0.01')


# ============================================================================
# Record creation
# ============================================================================

def _next_record_number() -> str:
    prefix = f"PRC-{timezone.now().year}-"
    last = (
        ProcurementRecord.objects.filter(record_number__startswith=prefix)
        .order_by('-record_number')
        .values_list('record_number', flat=True)
        .first()
    )
    next_number = int(last.rsplit('-', 1)[-1]) + 1 if last else 1
    return f"{prefix}{next_number:06d}"


def create_procurement_record(procurement: ProcurementRequest) -> ProcurementRecord:
    """Create the record for an approved procurement (idempotent) and notify the requester."""
    existing = ProcurementRecord.objects.filter(procurement=procurement).first()
    if existing:
        return existing
    if procurement.vendor_id is None:
        raise ValidationError({'vendor': 'The procurement has no awarded vendor.'})

    record = ProcurementRecord.objects.create(
        record_number=_next_record_number(),
        procurement=procurement,
        vendor_id=procurement.vendor_id,
        currency=procurement.currency,
        total_amount=procurement.total_amount,
    )
    create_notification(
        recipient=procurement.requested_by,
        notification_type='action_required',
        title=f'Set payment terms for {record.record_number}',
        message=(
            f'Your procurement request {procurement.request_number} was approved and awarded to '
            f'{record.vendor.company_name}. Open the procurement record and add the payment terms '
            f'so the installments can be tracked and paid.'
        ),
        priority='high',
        action_url=f'/finance/procurement?record={record.id}',
        metadata={'type': 'procurement_record', 'record_id': str(record.id)},
    )
    return record


# ============================================================================
# Award (final approver selects the winning quotation)
# ============================================================================

def get_approval_request(procurement: ProcurementRequest):
    prefetched = getattr(procurement, 'prefetched_approvals', None)
    if prefetched is not None:
        return prefetched[0] if prefetched else None
    return (
        procurement.approval_requests.select_related('workflow', 'current_approver')
        .order_by('-created_at')
        .first()
    )


def award_quotation(procurement: ProcurementRequest, employee, quotation_index: int, reason: str, comments: str = ''):
    """
    Final approver selects the winning quotation (with a reason) and gives final approval.
    Completing the workflow creates the procurement record (ProcurementRequest.on_final_approval).
    """
    from approval.services import ApprovalActionError, approve_current_stage, is_final_stage
    from finance_payable.models import Vendor

    approval_request = get_approval_request(procurement)
    if (
        approval_request is None
        or approval_request.status not in ('pending', 'in_progress')
        or approval_request.current_approver_id != employee.id
    ):
        raise PermissionDenied('It is not your turn to approve this procurement request.')
    if not is_final_stage(approval_request):
        raise ValidationError({'detail': 'The winning quotation is selected at the final approval stage.'})
    if not (reason or '').strip():
        raise ValidationError({'reason': 'Give the reason this quotation was selected.'})

    with transaction.atomic():
        procurement = ProcurementRequest.objects.select_for_update().get(pk=procurement.pk)
        quotations = list(procurement.quotations or [])
        if not 0 <= quotation_index < len(quotations):
            raise ValidationError({'quotation_index': 'Select one of the quotations.'})
        vendor = Vendor.objects.filter(id=quotations[quotation_index].get('vendor_id'), is_active=True).first()
        if vendor is None:
            raise ValidationError({'quotation_index': 'The selected quotation has no active vendor on record.'})

        procurement.quotations = [{**q, 'is_selected': i == quotation_index} for i, q in enumerate(quotations)]
        procurement.selected_quotation_index = quotation_index
        procurement.selection_reason = reason.strip()
        procurement.selected_by = employee
        procurement.selected_at = timezone.now()
        procurement.vendor = vendor
        procurement.save()

        note = f'Awarded to {vendor.company_name}: {reason.strip()}'
        try:
            approve_current_stage(approval_request, employee, f'{note}\n{comments}'.strip() if comments else note)
        except ApprovalActionError as exc:
            raise ValidationError({'detail': exc.message})

    procurement.refresh_from_db()
    return procurement


# ============================================================================
# Payment terms / schedule
# ============================================================================

def _add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year, month = start.year + month_index // 12, month_index % 12 + 1
    return date(year, month, min(start.day, calendar.monthrange(year, month)[1]))


def _shift(start: date, frequency: str, periods: int) -> date:
    if frequency == ProcurementRecord.Frequency.WEEKLY:
        return start + timedelta(weeks=periods)
    if frequency == ProcurementRecord.Frequency.QUARTERLY:
        return _add_months(start, 3 * periods)
    return _add_months(start, periods)  # monthly, and 'once' when a deposit comes first


def generate_schedule(total: Decimal, deposit: Decimal, count: int, frequency: str, first_due_date: date) -> list[dict]:
    """
    Deposit (if any) is due on first_due_date; installments follow one period apart.
    Installments are equal, with any rounding remainder on the last one.
    """
    total, deposit = Decimal(total), Decimal(deposit or 0)
    errors = {}
    if total <= 0:
        errors['total_amount'] = 'Total must be greater than zero.'
    if deposit < 0 or deposit >= total:
        errors['deposit_amount'] = 'Deposit must be at least zero and less than the total.'
    if count < 1:
        errors['installment_count'] = 'At least one installment is needed.'
    if frequency == ProcurementRecord.Frequency.ONCE and count != 1:
        errors['installment_count'] = 'A single payment has exactly one installment.'
    if frequency not in ProcurementRecord.Frequency.values:
        errors['frequency'] = 'Invalid frequency.'
    if errors:
        raise ValidationError(errors)

    rows = []
    if deposit > 0:
        rows.append({'sequence': 0, 'label': 'Deposit', 'due_date': first_due_date, 'amount': deposit})

    remaining = total - deposit
    base = (remaining / count).quantize(CENT, rounding=ROUND_DOWN)
    offset = 1 if deposit > 0 else 0
    for i in range(1, count + 1):
        amount = base if i < count else remaining - base * (count - 1)
        if count == 1:
            label = 'Balance' if deposit > 0 else 'Full payment'
        else:
            label = f'Installment {i} of {count}'
        rows.append({
            'sequence': i,
            'label': label,
            'due_date': _shift(first_due_date, frequency, i - 1 + offset),
            'amount': amount,
        })
    return rows


def can_edit_terms(record: ProcurementRecord, user) -> bool:
    employee = getattr(user, 'employee_profile', None)
    is_requester = employee is not None and record.procurement.requested_by_id == employee.id
    return record.status in (ProcurementRecord.Status.AWAITING_TERMS, ProcurementRecord.Status.ACTIVE) and (
        is_requester or is_finance_user(user)
    )


def terms_locked_reason(record: ProcurementRecord) -> str | None:
    if ProcurementPayment.objects.filter(installment__record=record).exists():
        return 'Payments have already been made against this record, so its terms can no longer change.'
    if ProcurementInstallment.objects.filter(
        record=record, payable_links__payable__status__in=OPEN_PAYABLE_STATUSES
    ).exists():
        return 'An open payable covers installments on this record. Wait for it to be paid or rejected.'
    return None


def _validate_rows(rows: list[dict], total: Decimal) -> None:
    if not rows:
        raise ValidationError({'installments': 'The schedule has no installments.'})
    if any(Decimal(row['amount']) <= 0 for row in rows):
        raise ValidationError({'installments': 'Every installment amount must be greater than zero.'})
    dates = [row['due_date'] for row in rows]
    if dates != sorted(dates):
        raise ValidationError({'installments': 'Due dates must be in order.'})
    scheduled = sum((Decimal(row['amount']) for row in rows), Decimal('0'))
    if scheduled != Decimal(total):
        raise ValidationError({
            'installments': f'Installments add up to {scheduled:,.2f} but the total is {Decimal(total):,.2f}.'
        })


def set_payment_terms(record: ProcurementRecord, user, data: dict) -> ProcurementRecord:
    """
    Replace the record's schedule. `data` holds the terms plus `installments`, the (possibly
    adjusted) rows [{due_date, amount, label?}] — generated from the terms when omitted.
    """
    if not can_edit_terms(record, user):
        raise PermissionDenied('Only the requester or Finance can set the payment terms for this record.')

    with transaction.atomic():
        record = ProcurementRecord.objects.select_for_update().get(pk=record.pk)
        locked = terms_locked_reason(record)
        if locked:
            raise ValidationError({'detail': locked})

        total = data['total_amount']
        deposit = Decimal(data.get('deposit_amount') or 0)
        generated = generate_schedule(
            total, deposit, data['installment_count'], data['frequency'], data['first_due_date']
        )
        # Sequence 0 is reserved for the deposit
        first_sequence = 0 if deposit > 0 else 1
        rows = []
        for position, row in enumerate(data.get('installments') or generated):
            default_label = generated[position]['label'] if position < len(generated) else f'Installment {position + 1}'
            rows.append({
                'sequence': first_sequence + position,
                'label': (row.get('label') or default_label)[:50],
                'due_date': row['due_date'],
                'amount': Decimal(row['amount']),
            })
        _validate_rows(rows, total)

        # Links from rejected/cancelled payables are dead reservations; clear them so the old
        # schedule can be replaced (open payables were refused above).
        from finance_payable.models import PayableInstallment
        PayableInstallment.objects.filter(
            installment__record=record, payable__status__in=CLOSED_PAYABLE_STATUSES
        ).delete()
        record.installments.all().delete()
        ProcurementInstallment.objects.bulk_create(
            ProcurementInstallment(record=record, **row) for row in rows
        )

        record.total_amount = total
        record.deposit_amount = data.get('deposit_amount') or 0
        record.installment_count = data['installment_count']
        record.frequency = data['frequency']
        record.first_due_date = data['first_due_date']
        record.terms_set_by = getattr(user, 'employee_profile', None)
        record.terms_set_at = timezone.now()
        record.status = ProcurementRecord.Status.ACTIVE
        record.modified_by = user
        record.save()
    return record


# ============================================================================
# Paying installments through payables
# ============================================================================

def outstanding_installments(vendor_id):
    """Installments on active records for a vendor that still owe money and aren't held by an open payable."""
    return (
        ProcurementInstallment.objects
        .filter(record__vendor_id=vendor_id, record__status=ProcurementRecord.Status.ACTIVE, amount_paid__lt=F('amount'))
        .exclude(payable_links__payable__status__in=OPEN_PAYABLE_STATUSES)
        .select_related('record__procurement')
        .order_by('due_date', 'record__record_number', 'sequence')
    )


def reserve_installments(payable, installment_ids: list) -> list:
    """
    Link installments to a new vendor payable (call inside the create transaction).
    Returns the locked installments; the payable's amount must equal their outstanding sum.
    """
    from finance_payable.models import PayableInstallment

    ids = list(dict.fromkeys(str(i) for i in installment_ids))
    installments = list(
        ProcurementInstallment.objects.select_for_update()
        .filter(id__in=ids)
        .select_related('record')
    )
    if len(installments) != len(ids):
        raise ValidationError({'procurement_installments': 'One or more installments were not found.'})

    errors = []
    for inst in installments:
        if inst.record.vendor_id != payable.vendor_id:
            errors.append(f'{inst} is owed to a different vendor.')
        elif inst.record.status != ProcurementRecord.Status.ACTIVE:
            errors.append(f'{inst.record.record_number} is not active.')
        elif inst.record.currency != payable.currency:
            errors.append(f'{inst} is in {inst.record.currency}; all selected installments must be in one currency.')
        elif inst.outstanding <= 0:
            errors.append(f'{inst} is already paid.')
        elif inst.payable_links.filter(payable__status__in=OPEN_PAYABLE_STATUSES).exclude(payable=payable).exists():
            errors.append(f'{inst} is already included in another open payable.')
    if errors:
        raise ValidationError({'procurement_installments': errors})

    PayableInstallment.objects.bulk_create(
        PayableInstallment(payable=payable, installment=inst, amount=inst.outstanding) for inst in installments
    )
    return installments


def apply_payable_payment(payable, employee) -> None:
    """
    Record a paid payable against the installments it covers (call inside the payment
    transaction). Writes immutable ProcurementPayment rows and completes fully paid records.
    """
    links = list(payable.installment_links.all())
    if not links:
        return

    installments = {
        inst.id: inst
        for inst in ProcurementInstallment.objects.select_for_update().filter(
            id__in=[link.installment_id for link in links]
        )
    }
    records = set()
    for link in links:
        inst = installments[link.installment_id]
        if link.amount > inst.outstanding:
            raise ValidationError({'detail': f'{inst} would be overpaid; only {inst.outstanding:,.2f} is outstanding.'})
        ProcurementPayment.objects.create(
            installment=inst,
            payable=payable,
            amount=link.amount,
            paid_date=payable.paid_date,
            recorded_by=employee,
        )
        inst.amount_paid += link.amount
        inst.save(update_fields=['amount_paid', 'updated_at'])
        records.add(inst.record_id)

    for record in ProcurementRecord.objects.select_for_update().filter(id__in=records):
        if not record.installments.filter(amount_paid__lt=F('amount')).exists():
            record.status = ProcurementRecord.Status.COMPLETED
            record.save(update_fields=['status', 'updated_at'])
