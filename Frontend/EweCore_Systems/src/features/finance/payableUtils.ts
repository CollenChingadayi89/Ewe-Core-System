import dayjs from 'dayjs';
import {
  MEMBER_PAYABLE_CATEGORIES,
  PAYABLE_CURRENCIES,
  VENDOR_PAYABLE_CATEGORIES,
  type PayableListResponse,
  type PayablePayToDetails,
  type PayeeType,
} from '../../services/api/payables';

/** Must match BANK_TRANSFER / MOBILE_MONEY in finance_payable/serializers.py */
export const BANK_TRANSFER = 'Bank Transfer';
export const MOBILE_MONEY = 'Mobile Money';
export const PAYMENT_METHODS = [BANK_TRANSFER, MOBILE_MONEY, 'Cash', 'Cheque'];

export const PRIORITY_COLORS: Record<string, string> = { high: 'red', medium: 'orange', low: 'blue' };

export const categoriesFor = (payeeType: PayeeType) =>
  payeeType === 'member' ? MEMBER_PAYABLE_CATEGORIES : VENDOR_PAYABLE_CATEGORIES;

export const formatMoney = (currency: string, amount: number | string) =>
  `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** ISO date (YYYY-MM-DD or timestamp) to DD/MM/YYYY. */
export const formatDate = (value: string | null | undefined, withTime = false) =>
  value ? dayjs(value).format(withTime ? 'DD/MM/YYYY HH:mm' : 'DD/MM/YYYY') : '—';

/** Totals per currency, in PAYABLE_CURRENCIES order — amounts in different currencies are never summed. */
export const totalsByCurrency = (payables: PayableListResponse[]) => {
  const totals = payables.reduce<Record<string, number>>((acc, p) => {
    acc[p.currency] = (acc[p.currency] || 0) + Number(p.total_amount);
    return acc;
  }, {});
  return Object.entries(totals).sort(
    ([a], [b]) => PAYABLE_CURRENCIES.indexOf(a) - PAYABLE_CURRENCIES.indexOf(b)
  );
};

export const formatCurrencyTotals = (payables: PayableListResponse[], fallbackCurrency = 'ZWG') => {
  const totals = totalsByCurrency(payables);
  return totals.length > 0
    ? totals.map(([currency, amount]) => formatMoney(currency, amount)).join(' | ')
    : formatMoney(fallbackCurrency, 0);
};

/** Short description of where a payable is in its workflow, for tables. */
export const approvalProgress = (payable: PayableListResponse): string | null => {
  const approval = payable.approval;
  if (!approval || !approval.current_stage_name) return null;
  const who = approval.current_approver_name ? ` · ${approval.current_approver_name}` : '';
  return `Stage ${approval.current_stage}/${approval.total_stages}: ${approval.current_stage_name}${who}`;
};

/** The payable can be approved or rejected by the current user (not yet at the Pay stage). */
export const canApproveOrReject = (payable: PayableListResponse) =>
  Boolean(payable.approval?.can_act && payable.approval.current_action_type !== 'pay');

/** Human-readable "where the money goes", or null if no account details apply. */
export const describePayTo = (payable: PayablePayToDetails & { payment_method: string | null }): string | null => {
  if (payable.payment_method === BANK_TRANSFER && payable.pay_to_account_number) {
    const branch = payable.pay_to_bank_branch ? ` (${payable.pay_to_bank_branch})` : '';
    return `${payable.pay_to_bank_name}${branch} · Acc ${payable.pay_to_account_number} · ${payable.pay_to_account_name}`;
  }
  if (payable.payment_method === MOBILE_MONEY && payable.pay_to_mobile_number) {
    return `Mobile money ${payable.pay_to_mobile_number}`;
  }
  return null;
};
