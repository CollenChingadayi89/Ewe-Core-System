/**
 * Leave Ledger Transaction Mock Data
 *
 * Implements ledger-based balance tracking with immutable transaction history
 * Each employee's balance is derived from summing these transactions
 */

import type { LeaveTransaction, LeaveBalance } from '../types/leave-ledger';
import { mockEmployees } from './employees';

// ============================================================================
// LEAVE TRANSACTIONS LEDGER
// ============================================================================

/**
 * Complete transaction history for all employees
 * This is the source of truth for leave balances
 */
export const mockLeaveTransactions: LeaveTransaction[] = [
  // ========================================================================
  // COLLEN CHINGADAYI (EMP-001) - HR Manager
  // ========================================================================
  // Join Date: 2023-03-01 (3+ years service)

  // Annual Leave - Carryforward from 2025
  {
    id: 'TXN-001',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'carryforward',
    amount: 15, // Days carried from 2025
    effectiveDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Annual leave carryforward from 2025',
  },

  // Annual Leave - Monthly accruals for 2026 (Jan-Sep)
  {
    id: 'TXN-002',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-02-01',
    createdAt: '2026-02-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - February 2026',
  },
  {
    id: 'TXN-003',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-03-01',
    createdAt: '2026-03-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - March 2026',
  },
  {
    id: 'TXN-004',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-04-01',
    createdAt: '2026-04-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - April 2026',
  },
  {
    id: 'TXN-005',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-05-01',
    createdAt: '2026-05-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - May 2026',
  },
  {
    id: 'TXN-006',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-06-01',
    createdAt: '2026-06-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - June 2026',
  },
  {
    id: 'TXN-007',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-07-01',
    createdAt: '2026-07-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - July 2026',
  },
  {
    id: 'TXN-008',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-08-01',
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - August 2026',
  },
  {
    id: 'TXN-009',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-09-01',
    createdAt: '2026-09-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - September 2026',
  },

  // Annual Leave - Approval reservation for upcoming leave
  {
    id: 'TXN-010',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'approval_reservation',
    amount: -10, // Negative = debit
    effectiveDate: '2026-09-10',
    createdAt: '2026-09-10T12:00:00Z',
    createdBy: 'EMP-002', // Approved by Margaret Njeri (CEO)
    reason: 'Approved annual leave 2026-12-23 to 2027-01-03',
    relatedRequestId: 'LEAVE-REQ-001',
    notes: '10 working days for Christmas holiday',
  },

  // Annual Leave - Past usage
  {
    id: 'TXN-011',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'usage',
    amount: -5,
    effectiveDate: '2026-07-15',
    createdAt: '2026-07-20T09:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Annual leave taken 2026-07-15 to 2026-07-19',
    relatedRequestId: 'LEAVE-REQ-099',
    notes: '5 working days - mid-year break',
  },

  // ========================================================================
  // MARGARET NJERI (EMP-002) - CEO
  // ========================================================================
  // Join Date: 2020-01-15 (6+ years service)

  // Annual Leave - Carryforward (high balance near cap)
  {
    id: 'TXN-050',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'carryforward',
    amount: 65, // High carryforward - approaching 90-day cap
    effectiveDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Annual leave carryforward from 2025',
    notes: 'WARNING: Employee approaching 90-day statutory cap',
  },

  // Annual Leave - Monthly accruals stopped due to cap
  {
    id: 'TXN-051',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-02-01',
    createdAt: '2026-02-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - February 2026',
  },
  {
    id: 'TXN-052',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-03-01',
    createdAt: '2026-03-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - March 2026',
  },
  {
    id: 'TXN-053',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-04-01',
    createdAt: '2026-04-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - April 2026',
  },
  {
    id: 'TXN-054',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-05-01',
    createdAt: '2026-05-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - May 2026',
  },
  {
    id: 'TXN-055',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-06-01',
    createdAt: '2026-06-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - June 2026',
  },
  {
    id: 'TXN-056',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-07-01',
    createdAt: '2026-07-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - July 2026',
  },
  {
    id: 'TXN-057',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-08-01',
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - August 2026',
  },
  {
    id: 'TXN-058',
    employeeId: 'EMP-002',
    leaveType: 'annual',
    transactionType: 'accrual',
    amount: 2.5,
    effectiveDate: '2026-09-01',
    createdAt: '2026-09-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Monthly annual leave accrual - September 2026',
    notes: 'Balance now at 85 days - approaching 90-day cap',
  },
  // Note: Accrual will pause at 90 days

  // ========================================================================
  // DAVID KAMAU (EMP-003) - Finance Manager
  // ========================================================================
  // Join Date: 2021-06-01

  // Annual Leave
  {
    id: 'TXN-100',
    employeeId: 'EMP-003',
    leaveType: 'annual',
    transactionType: 'carryforward',
    amount: 20,
    effectiveDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Annual leave carryforward from 2025',
  },

  // Monthly accruals (Feb-Sep)
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `TXN-${101 + i}`,
    employeeId: 'EMP-003',
    leaveType: 'annual' as const,
    transactionType: 'accrual' as const,
    amount: 2.5,
    effectiveDate: `2026-${String(i + 2).padStart(2, '0')}-01`,
    createdAt: `2026-${String(i + 2).padStart(2, '0')}-01T00:00:00Z`,
    createdBy: 'SYSTEM',
    reason: `Monthly annual leave accrual - ${['February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'][i]} 2026`,
  })),

  // Usage in June
  {
    id: 'TXN-109',
    employeeId: 'EMP-003',
    leaveType: 'annual',
    transactionType: 'usage',
    amount: -7,
    effectiveDate: '2026-06-15',
    createdAt: '2026-06-22T09:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Annual leave taken 2026-06-15 to 2026-06-23',
    relatedRequestId: 'LEAVE-REQ-098',
    notes: '7 working days - family vacation',
  },

  // Sick Leave - Short absence
  {
    id: 'TXN-110',
    employeeId: 'EMP-003',
    leaveType: 'sick',
    transactionType: 'usage',
    amount: -2,
    effectiveDate: '2026-08-12',
    createdAt: '2026-08-14T09:00:00Z',
    createdBy: 'EMP-001', // Approved by HR Manager
    reason: 'Sick leave 2026-08-12 to 2026-08-13',
    relatedRequestId: 'LEAVE-REQ-097',
    notes: 'Flu - medical certificate provided',
  },

  // ========================================================================
  // PETER OMONDI (EMP-004) - HR Employee
  // ========================================================================
  // Join Date: 2022-09-01

  // Annual Leave
  {
    id: 'TXN-150',
    employeeId: 'EMP-004',
    leaveType: 'annual',
    transactionType: 'carryforward',
    amount: 12,
    effectiveDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Annual leave carryforward from 2025',
  },

  // Monthly accruals
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `TXN-${151 + i}`,
    employeeId: 'EMP-004',
    leaveType: 'annual' as const,
    transactionType: 'accrual' as const,
    amount: 2.5,
    effectiveDate: `2026-${String(i + 2).padStart(2, '0')}-01`,
    createdAt: `2026-${String(i + 2).padStart(2, '0')}-01T00:00:00Z`,
    createdBy: 'SYSTEM',
    reason: `Monthly annual leave accrual - ${['February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'][i]} 2026`,
  })),

  // Special Leave - Bereavement
  {
    id: 'TXN-159',
    employeeId: 'EMP-004',
    leaveType: 'special',
    transactionType: 'usage',
    amount: -3,
    effectiveDate: '2026-05-20',
    createdAt: '2026-05-22T10:00:00Z',
    createdBy: 'EMP-001',
    reason: 'Special leave - bereavement (death of parent)',
    relatedRequestId: 'LEAVE-REQ-096',
    notes: 'Death certificate and proof of relationship provided',
  },

  // ========================================================================
  // MICHAEL OTIENO (EMP-005) - IT Manager
  // ========================================================================
  // Join Date: 2023-11-15

  // Annual Leave (started accruing Nov 2024)
  {
    id: 'TXN-200',
    employeeId: 'EMP-005',
    leaveType: 'annual',
    transactionType: 'carryforward',
    amount: 2.5, // Only 1 month from 2025 (December 2025)
    effectiveDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'SYSTEM',
    reason: 'Annual leave carryforward from 2025',
    notes: 'Employee completed 1 year service in Nov 2024, limited carryforward',
  },

  // Monthly accruals
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `TXN-${201 + i}`,
    employeeId: 'EMP-005',
    leaveType: 'annual' as const,
    transactionType: 'accrual' as const,
    amount: 2.5,
    effectiveDate: `2026-${String(i + 2).padStart(2, '0')}-01`,
    createdAt: `2026-${String(i + 2).padStart(2, '0')}-01T00:00:00Z`,
    createdBy: 'SYSTEM',
    reason: `Monthly annual leave accrual - ${['February', 'March', 'April', 'May', 'June', 'July', 'August', 'September'][i]} 2026`,
  })),

  // Manual Adjustment - Opening balance correction
  {
    id: 'TXN-209',
    employeeId: 'EMP-005',
    leaveType: 'annual',
    transactionType: 'adjustment',
    amount: 2.5,
    effectiveDate: '2026-03-01',
    createdAt: '2026-03-15T14:30:00Z',
    createdBy: 'EMP-001',
    reason: 'Correction: missed December 2025 accrual during data migration',
    notes: 'HR adjustment - verified against payroll records',
  },

  // ========================================================================
  // NEW EMPLOYEE (joined in 2026) - Example
  // ========================================================================
  // GRACE MUKUKA (EMP-010) - Finance Employee
  // Join Date: 2026-03-01 (no annual leave accrual yet - first year)

  // No annual leave transactions yet - will start accruing March 2027

  // ========================================================================
  // EXAMPLE: Cancelled Leave with Reversal
  // ========================================================================
  // DAVID KAMAU (EMP-003)

  // Approval reservation
  {
    id: 'TXN-300',
    employeeId: 'EMP-003',
    leaveType: 'annual',
    transactionType: 'approval_reservation',
    amount: -5,
    effectiveDate: '2026-09-05',
    createdAt: '2026-09-05T11:00:00Z',
    createdBy: 'EMP-002',
    reason: 'Approved annual leave 2026-10-10 to 2026-10-14',
    relatedRequestId: 'LEAVE-REQ-095',
    notes: '5 working days',
  },

  // Cancellation reversal
  {
    id: 'TXN-301',
    employeeId: 'EMP-003',
    leaveType: 'annual',
    transactionType: 'cancellation_reversal',
    amount: 5, // Positive = credit back
    effectiveDate: '2026-09-08',
    createdAt: '2026-09-08T09:30:00Z',
    createdBy: 'EMP-003',
    reason: 'Cancelled approved leave - urgent project deadline',
    relatedRequestId: 'LEAVE-REQ-095',
    notes: 'Employee-requested cancellation approved by manager',
  },

  // ========================================================================
  // EXAMPLE: Sick Leave Conversion during Annual Leave
  // ========================================================================
  // COLLEN CHINGADAYI (EMP-001)

  // Original annual leave approval
  {
    id: 'TXN-400',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'approval_reservation',
    amount: -10,
    effectiveDate: '2026-04-15',
    createdAt: '2026-04-15T10:00:00Z',
    createdBy: 'EMP-002',
    reason: 'Approved annual leave 2026-05-01 to 2026-05-12',
    relatedRequestId: 'LEAVE-REQ-094',
    notes: '10 working days - planned vacation',
  },

  // Partial reversal (became sick on day 3)
  {
    id: 'TXN-401',
    employeeId: 'EMP-001',
    leaveType: 'annual',
    transactionType: 'cancellation_reversal',
    amount: 7, // 7 days restored
    effectiveDate: '2026-05-03',
    createdAt: '2026-05-05T09:00:00Z',
    createdBy: 'EMP-001',
    reason: 'Partial cancellation - converted to sick leave from day 3',
    relatedRequestId: 'LEAVE-REQ-094',
    notes: 'Fell ill during vacation, remaining 7 days converted to sick leave per s14A(4)',
  },

  // Sick leave usage (converted portion)
  {
    id: 'TXN-402',
    employeeId: 'EMP-001',
    leaveType: 'sick',
    transactionType: 'usage',
    amount: -7,
    effectiveDate: '2026-05-05',
    createdAt: '2026-05-05T09:00:00Z',
    createdBy: 'EMP-001',
    reason: 'Sick leave 2026-05-05 to 2026-05-12',
    relatedRequestId: 'LEAVE-REQ-093',
    notes: 'Converted from annual leave - medical certificate provided',
  },
];

// ============================================================================
// HELPER FUNCTIONS TO CALCULATE BALANCES FROM LEDGER
// ============================================================================

/**
 * Calculate leave balance for an employee at a specific date
 * This is the ONLY way to get accurate balance - derived from ledger
 */
export function calculateLeaveBalance(
  employeeId: string,
  leaveType: string,
  asOfDate: string = new Date().toISOString().split('T')[0]
): LeaveBalance {
  // Get all transactions for this employee and leave type up to the date
  const transactions = mockLeaveTransactions.filter(
    (txn) =>
      txn.employeeId === employeeId &&
      txn.leaveType === leaveType &&
      txn.effectiveDate <= asOfDate
  );

  // Calculate totals by transaction type
  const totalAccrued = transactions
    .filter(
      (txn) =>
        txn.transactionType === 'accrual' ||
        txn.transactionType === 'carryforward' ||
        (txn.transactionType === 'adjustment' && txn.amount > 0)
    )
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalUsed = Math.abs(
    transactions
      .filter((txn) => txn.transactionType === 'usage')
      .reduce((sum, txn) => sum + txn.amount, 0)
  );

  const totalApprovedFuture = Math.abs(
    transactions
      .filter((txn) => txn.transactionType === 'approval_reservation')
      .reduce((sum, txn) => sum + txn.amount, 0)
  );

  // Cancellation reversals add back to balance
  const totalReversals = transactions
    .filter((txn) => txn.transactionType === 'cancellation_reversal')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalAdjustments = transactions
    .filter(
      (txn) => txn.transactionType === 'adjustment' && txn.amount < 0
    )
    .reduce((sum, txn) => sum + txn.amount, 0);

  const availableBalance =
    totalAccrued + totalReversals - totalUsed - totalApprovedFuture + totalAdjustments;

  // For sick leave, track full-pay and half-pay separately
  let sickLeaveFullPayDaysUsed: number | undefined;
  let sickLeaveHalfPayDaysUsed: number | undefined;

  if (leaveType === 'sick') {
    // In a real system, would track full vs half pay separately
    // For now, assume all usage is full-pay unless noted
    sickLeaveFullPayDaysUsed = totalUsed;
    sickLeaveHalfPayDaysUsed = 0;
  }

  return {
    employeeId,
    leaveType,
    asOfDate,
    totalAccrued: Math.round(totalAccrued * 10) / 10, // Round to 1 decimal
    totalUsed: Math.round(totalUsed * 10) / 10,
    totalApprovedFuture: Math.round(totalApprovedFuture * 10) / 10,
    totalPending: 0, // Would come from pending requests not yet in ledger
    totalAdjustments: Math.round(totalAdjustments * 10) / 10,
    availableBalance: Math.round(availableBalance * 10) / 10,
    sickLeaveFullPayDaysUsed,
    sickLeaveHalfPayDaysUsed,
  };
}

/**
 * Get all balances for an employee across all leave types
 */
export function getAllLeaveBalances(
  employeeId: string,
  asOfDate?: string
): LeaveBalance[] {
  const leaveTypes = ['annual', 'sick', 'special'];
  return leaveTypes.map((type) =>
    calculateLeaveBalance(employeeId, type, asOfDate)
  );
}

/**
 * Get transaction history for an employee
 */
export function getLeaveTransactionHistory(
  employeeId: string,
  leaveType?: string,
  startDate?: string,
  endDate?: string
): LeaveTransaction[] {
  return mockLeaveTransactions.filter((txn) => {
    if (txn.employeeId !== employeeId) return false;
    if (leaveType && txn.leaveType !== leaveType) return false;
    if (startDate && txn.effectiveDate < startDate) return false;
    if (endDate && txn.effectiveDate > endDate) return false;
    return true;
  });
}

/**
 * Get transactions related to a specific leave request
 */
export function getTransactionsByRequest(
  requestId: string
): LeaveTransaction[] {
  return mockLeaveTransactions.filter(
    (txn) => txn.relatedRequestId === requestId
  );
}
