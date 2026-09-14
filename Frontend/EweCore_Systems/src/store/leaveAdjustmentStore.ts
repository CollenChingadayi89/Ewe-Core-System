/**
 * Leave Adjustment Store
 *
 * Manages manual leave balance adjustments including:
 * - Credit adjustments (adding days)
 * - Debit adjustments (removing days)
 * - Carryforward processing
 * - Balance corrections
 * - Approval workflow for adjustments
 *
 * All adjustments are recorded as ledger transactions with full audit trail.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LeaveTransaction,
  LeaveTransactionType,
  LeaveBalance,
} from '../types/leave-ledger';
import type { ApprovalRequest } from '../types';
import { mockLeaveTransactions, calculateLeaveBalance } from '../mock/leave-ledger';

/**
 * Adjustment request form data
 */
export interface LeaveAdjustmentFormData {
  employeeId: string;
  leaveType: string;
  adjustmentType: 'credit' | 'debit';
  amount: number; // Always positive (sign determined by adjustmentType)
  effectiveDate: string;
  reason: string;
  notes?: string;
  attachments?: string[];
  requiresApproval?: boolean;
}

/**
 * Carryforward processing data
 */
export interface CarryforwardProcessData {
  year: number;
  employeeIds?: string[]; // If empty, process all employees
  leaveTypes?: string[]; // If empty, process all carryforward-eligible types
  maxCarryforwardDays?: number; // Override default 90-day cap
  includePartialYearEmployees?: boolean;
  dryRun?: boolean; // Preview only, don't commit
}

/**
 * Carryforward result per employee
 */
export interface CarryforwardResult {
  employeeId: string;
  employeeName: string;
  leaveType: string;
  balanceAsOf: string;
  totalAccrued: number;
  totalUsed: number;
  availableBalance: number;
  carryforwardAmount: number;
  cappedAt?: number;
  notes?: string;
  transactionId?: string; // Only if committed
}

/**
 * Adjustment request (extends ApprovalRequest)
 */
export interface LeaveAdjustmentRequest extends ApprovalRequest {
  data: {
    employeeId: string;
    employeeName: string;
    leaveType: string;
    adjustmentType: 'credit' | 'debit';
    amount: number;
    effectiveDate: string;
    reason: string;
    notes?: string;
    attachments?: string[];
    balanceBeforeAdjustment: number;
    balanceAfterAdjustment: number;
  };
}

/**
 * Validation result for adjustments
 */
export interface AdjustmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface LeaveAdjustmentState {
  // State - Adjustments
  allAdjustments: LeaveAdjustmentRequest[];
  pendingAdjustments: LeaveAdjustmentRequest[];
  approvedAdjustments: LeaveAdjustmentRequest[];
  rejectedAdjustments: LeaveAdjustmentRequest[];

  // State - Carryforward
  carryforwardHistory: CarryforwardResult[];
  lastCarryforwardRun?: {
    year: number;
    runDate: string;
    runBy: string;
    employeesProcessed: number;
    totalDaysCarriedForward: number;
  };

  // State - UI
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions - Adjustments
  fetchAllAdjustments: () => void;
  fetchPendingAdjustments: () => void;
  submitAdjustment: (userId: string, userName: string, data: LeaveAdjustmentFormData) => Promise<void>;
  approveAdjustment: (adjustmentId: string, approverId: string, comment?: string) => Promise<void>;
  rejectAdjustment: (adjustmentId: string, approverId: string, comment: string) => Promise<void>;

  // Actions - Carryforward
  processCarryforward: (userId: string, data: CarryforwardProcessData) => Promise<CarryforwardResult[]>;
  getCarryforwardHistory: (year?: number, employeeId?: string) => CarryforwardResult[];

  // Utilities
  validateAdjustment: (data: LeaveAdjustmentFormData) => AdjustmentValidationResult;
  previewAdjustment: (data: LeaveAdjustmentFormData) => {
    currentBalance: number;
    adjustmentAmount: number;
    newBalance: number;
  };
}

/**
 * Generate unique adjustment ID
 */
function generateAdjustmentId(): string {
  return `ADJ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Get employee name (mock lookup)
 */
function getEmployeeName(employeeId: string): string {
  // In real app, fetch from employee store
  const employeeNames: Record<string, string> = {
    'EMP-001': 'Collen Chingadayi',
    'EMP-002': 'Margaret Njeri',
    'EMP-003': 'David Kamau',
    'EMP-004': 'Peter Omondi',
    'EMP-005': 'Sarah Mwangi',
    'EMP-006': 'Michael Otieno',
    'EMP-007': 'Grace Achieng',
    'EMP-008': 'John Mutua',
    'EMP-009': 'Mary Wambui',
    'EMP-010': 'James Ouma',
  };
  return employeeNames[employeeId] || 'Unknown Employee';
}

/**
 * Get leave type display name (mock lookup)
 */
function getLeaveTypeName(leaveType: string): string {
  const names: Record<string, string> = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    special: 'Special Leave',
    study: 'Study Leave',
    unpaid: 'Unpaid Leave',
  };
  return names[leaveType] || leaveType;
}

/**
 * Leave Adjustment Store
 */
export const useLeaveAdjustmentStore = create<LeaveAdjustmentState>()(
  persist(
    (set, get) => ({
      // Initial State
      allAdjustments: [],
      pendingAdjustments: [],
      approvedAdjustments: [],
      rejectedAdjustments: [],
      carryforwardHistory: [],
      lastCarryforwardRun: undefined,
      loading: false,
      saving: false,
      error: null,

      // ==================== ACTIONS - ADJUSTMENTS ====================

      fetchAllAdjustments: () => {
        set({ loading: true, error: null });
        try {
          // In real app, fetch from API
          // For now, use persisted state
          set({ loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch adjustments',
          });
        }
      },

      fetchPendingAdjustments: () => {
        set({ loading: true, error: null });
        try {
          const pending = get().allAdjustments.filter((adj) => adj.status === 'pending');
          set({
            pendingAdjustments: pending,
            loading: false,
          });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch pending adjustments',
          });
        }
      },

      submitAdjustment: async (userId: string, userName: string, data: LeaveAdjustmentFormData) => {
        set({ saving: true, error: null });
        try {
          // 1. Validate adjustment
          const validation = get().validateAdjustment(data);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          // 2. Get current balance
          const currentBalance = calculateLeaveBalance(data.employeeId, data.leaveType);

          // 3. Calculate new balance
          const adjustmentAmount = data.adjustmentType === 'credit' ? data.amount : -data.amount;
          const newBalance = currentBalance.availableBalance + adjustmentAmount;

          // 4. Create adjustment request
          const newAdjustment: LeaveAdjustmentRequest = {
            id: generateAdjustmentId(),
            type: 'leave',
            requestorId: userId,
            requestorName: userName,
            status: data.requiresApproval !== false ? 'pending' : 'approved',
            currentApproverId: data.requiresApproval !== false ? 'EMP-001' : undefined, // HR Manager
            priority: 'medium',
            createdAt: new Date().toISOString(),
            submittedDate: new Date().toISOString(),
            approvalChain: data.requiresApproval !== false
              ? [
                  {
                    approverId: 'EMP-001', // HR Manager
                    approverName: 'Collen Chingadayi',
                    approverRole: 'HR Manager',
                    status: 'pending',
                    order: 1,
                  },
                ]
              : [],
            data: {
              employeeId: data.employeeId,
              employeeName: getEmployeeName(data.employeeId),
              leaveType: data.leaveType,
              adjustmentType: data.adjustmentType,
              amount: data.amount,
              effectiveDate: data.effectiveDate,
              reason: data.reason,
              notes: data.notes,
              attachments: data.attachments,
              balanceBeforeAdjustment: currentBalance.availableBalance,
              balanceAfterAdjustment: newBalance,
            },
          };

          // 5. If no approval required, create transaction immediately
          if (data.requiresApproval === false) {
            const transaction: LeaveTransaction = {
              id: generateTransactionId(),
              employeeId: data.employeeId,
              leaveType: data.leaveType as any,
              transactionType: 'adjustment',
              amount: adjustmentAmount,
              effectiveDate: data.effectiveDate,
              createdAt: new Date().toISOString(),
              createdBy: userId,
              reason: data.reason,
              relatedRequestId: newAdjustment.id,
              notes: data.notes,
            };

            // Add transaction to mock ledger
            mockLeaveTransactions.push(transaction);

            // Mark as approved
            newAdjustment.approvedDate = new Date().toISOString();
            newAdjustment.approvedBy = userId;
          }

          // 6. Add to store
          set((state) => ({
            allAdjustments: [newAdjustment, ...state.allAdjustments],
            pendingAdjustments:
              newAdjustment.status === 'pending'
                ? [newAdjustment, ...state.pendingAdjustments]
                : state.pendingAdjustments,
            approvedAdjustments:
              newAdjustment.status === 'approved'
                ? [newAdjustment, ...state.approvedAdjustments]
                : state.approvedAdjustments,
            saving: false,
          }));
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to submit adjustment',
          });
          throw error;
        }
      },

      approveAdjustment: async (adjustmentId: string, approverId: string, comment?: string) => {
        set({ saving: true, error: null });
        try {
          const adjustment = get().allAdjustments.find((adj) => adj.id === adjustmentId);
          if (!adjustment) {
            throw new Error('Adjustment not found');
          }

          if (adjustment.status !== 'pending') {
            throw new Error('Only pending adjustments can be approved');
          }

          // 1. Create ledger transaction
          const adjustmentAmount =
            adjustment.data.adjustmentType === 'credit'
              ? adjustment.data.amount
              : -adjustment.data.amount;

          const transaction: LeaveTransaction = {
            id: generateTransactionId(),
            employeeId: adjustment.data.employeeId,
            leaveType: adjustment.data.leaveType as any,
            transactionType: 'adjustment',
            amount: adjustmentAmount,
            effectiveDate: adjustment.data.effectiveDate,
            createdAt: new Date().toISOString(),
            createdBy: approverId,
            reason: adjustment.data.reason,
            relatedRequestId: adjustmentId,
            notes: comment || adjustment.data.notes,
          };

          // Add to mock ledger
          mockLeaveTransactions.push(transaction);

          // 2. Update adjustment status
          const updatedAdjustment: LeaveAdjustmentRequest = {
            ...adjustment,
            status: 'approved',
            approvedDate: new Date().toISOString(),
            approvedBy: approverId,
            approvalChain: adjustment.approvalChain.map((step) =>
              step.approverId === approverId
                ? {
                    ...step,
                    status: 'approved',
                    actionDate: new Date().toISOString(),
                    comment,
                  }
                : step
            ),
          };

          // 3. Update store
          set((state) => ({
            allAdjustments: state.allAdjustments.map((adj) =>
              adj.id === adjustmentId ? updatedAdjustment : adj
            ),
            pendingAdjustments: state.pendingAdjustments.filter((adj) => adj.id !== adjustmentId),
            approvedAdjustments: [updatedAdjustment, ...state.approvedAdjustments],
            saving: false,
          }));
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to approve adjustment',
          });
          throw error;
        }
      },

      rejectAdjustment: async (adjustmentId: string, approverId: string, comment: string) => {
        set({ saving: true, error: null });
        try {
          const adjustment = get().allAdjustments.find((adj) => adj.id === adjustmentId);
          if (!adjustment) {
            throw new Error('Adjustment not found');
          }

          if (adjustment.status !== 'pending') {
            throw new Error('Only pending adjustments can be rejected');
          }

          if (!comment || comment.trim() === '') {
            throw new Error('Rejection comment is required');
          }

          // Update adjustment status
          const updatedAdjustment: LeaveAdjustmentRequest = {
            ...adjustment,
            status: 'rejected',
            rejectedDate: new Date().toISOString(),
            rejectedBy: approverId,
            approvalChain: adjustment.approvalChain.map((step) =>
              step.approverId === approverId
                ? {
                    ...step,
                    status: 'rejected',
                    actionDate: new Date().toISOString(),
                    comment,
                  }
                : step
            ),
          };

          // Update store
          set((state) => ({
            allAdjustments: state.allAdjustments.map((adj) =>
              adj.id === adjustmentId ? updatedAdjustment : adj
            ),
            pendingAdjustments: state.pendingAdjustments.filter((adj) => adj.id !== adjustmentId),
            rejectedAdjustments: [updatedAdjustment, ...state.rejectedAdjustments],
            saving: false,
          }));
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to reject adjustment',
          });
          throw error;
        }
      },

      // ==================== ACTIONS - CARRYFORWARD ====================

      processCarryforward: async (userId: string, data: CarryforwardProcessData) => {
        set({ saving: true, error: null });
        try {
          const results: CarryforwardResult[] = [];

          // Determine which employees to process
          const employeeIds = data.employeeIds || [
            'EMP-001',
            'EMP-002',
            'EMP-003',
            'EMP-004',
            'EMP-005',
            'EMP-006',
            'EMP-007',
            'EMP-008',
          ]; // In real app, fetch all employees

          // Determine which leave types to process
          const leaveTypes = data.leaveTypes || ['annual']; // Only annual leave carries forward per policy

          // End of previous year
          const carryforwardDate = `${data.year - 1}-12-31`;

          // Process each employee
          for (const employeeId of employeeIds) {
            for (const leaveType of leaveTypes) {
              // Calculate balance as of end of previous year
              const balance = calculateLeaveBalance(employeeId, leaveType, carryforwardDate);

              // Determine carryforward amount
              const maxCarryforward = data.maxCarryforwardDays || 90; // s14A cap
              let carryforwardAmount = balance.availableBalance;
              let cappedAt: number | undefined = undefined;

              if (carryforwardAmount > maxCarryforward) {
                cappedAt = maxCarryforward;
                carryforwardAmount = maxCarryforward;
              }

              // Only carry forward if positive balance
              if (carryforwardAmount > 0) {
                const result: CarryforwardResult = {
                  employeeId,
                  employeeName: getEmployeeName(employeeId),
                  leaveType,
                  balanceAsOf: carryforwardDate,
                  totalAccrued: balance.totalAccrued,
                  totalUsed: balance.totalUsed,
                  availableBalance: balance.availableBalance,
                  carryforwardAmount,
                  cappedAt,
                  notes:
                    cappedAt !== undefined
                      ? `Capped at ${cappedAt} days per s14A Labour Act`
                      : undefined,
                };

                // If not dry run, create transaction
                if (!data.dryRun) {
                  const transaction: LeaveTransaction = {
                    id: generateTransactionId(),
                    employeeId,
                    leaveType: leaveType as any,
                    transactionType: 'carryforward',
                    amount: carryforwardAmount,
                    effectiveDate: `${data.year}-01-01`,
                    createdAt: new Date().toISOString(),
                    createdBy: userId,
                    reason: `Annual leave carryforward from ${data.year - 1}`,
                    notes:
                      cappedAt !== undefined
                        ? `Original balance: ${balance.availableBalance} days, capped at ${cappedAt} days`
                        : undefined,
                  };

                  // Add to mock ledger
                  mockLeaveTransactions.push(transaction);
                  result.transactionId = transaction.id;
                }

                results.push(result);
              }
            }
          }

          // Update carryforward history
          if (!data.dryRun) {
            const totalDays = results.reduce((sum, r) => sum + r.carryforwardAmount, 0);

            set((state) => ({
              carryforwardHistory: [...results, ...state.carryforwardHistory],
              lastCarryforwardRun: {
                year: data.year,
                runDate: new Date().toISOString(),
                runBy: userId,
                employeesProcessed: employeeIds.length,
                totalDaysCarriedForward: totalDays,
              },
              saving: false,
            }));
          } else {
            set({ saving: false });
          }

          return results;
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to process carryforward',
          });
          throw error;
        }
      },

      getCarryforwardHistory: (year?: number, employeeId?: string) => {
        let history = get().carryforwardHistory;

        if (year) {
          const yearStr = year.toString();
          history = history.filter((h) => h.balanceAsOf.startsWith(yearStr));
        }

        if (employeeId) {
          history = history.filter((h) => h.employeeId === employeeId);
        }

        return history.sort((a, b) => b.balanceAsOf.localeCompare(a.balanceAsOf));
      },

      // ==================== UTILITIES ====================

      validateAdjustment: (data: LeaveAdjustmentFormData): AdjustmentValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Required fields
        if (!data.employeeId) errors.push('Employee is required');
        if (!data.leaveType) errors.push('Leave type is required');
        if (!data.adjustmentType) errors.push('Adjustment type is required');
        if (!data.amount || data.amount <= 0) errors.push('Amount must be greater than 0');
        if (!data.effectiveDate) errors.push('Effective date is required');
        if (!data.reason || data.reason.trim() === '') errors.push('Reason is required');

        // Get current balance
        const currentBalance = calculateLeaveBalance(data.employeeId, data.leaveType);

        // Validate debit adjustments
        if (data.adjustmentType === 'debit') {
          if (data.amount > currentBalance.availableBalance) {
            errors.push(
              `Cannot debit ${data.amount} days. Current balance: ${currentBalance.availableBalance} days`
            );
          }

          // Warn if debit will result in negative balance
          if (data.amount === currentBalance.availableBalance) {
            warnings.push('This adjustment will reduce the balance to zero');
          }
        }

        // Validate credit adjustments
        if (data.adjustmentType === 'credit') {
          // Check if credit exceeds reasonable limits
          if (data.amount > 30) {
            warnings.push('Large credit adjustment (>30 days). Please verify the amount.');
          }

          // Annual leave cap check
          if (data.leaveType === 'annual') {
            const newBalance = currentBalance.availableBalance + data.amount;
            if (newBalance > 90) {
              warnings.push(
                `Credit will exceed 90-day cap. New balance: ${newBalance} days. Statutory cap per s14A: 90 days.`
              );
            }
          }
        }

        // Validate effective date
        const effectiveDate = new Date(data.effectiveDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (effectiveDate > today) {
          warnings.push('Effective date is in the future. Adjustment will be backdated.');
        }

        // Check if effective date is too far in the past
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (effectiveDate < oneYearAgo) {
          warnings.push(
            'Effective date is more than 1 year in the past. This may affect historical reports.'
          );
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      },

      previewAdjustment: (data: LeaveAdjustmentFormData) => {
        const currentBalance = calculateLeaveBalance(data.employeeId, data.leaveType);
        const adjustmentAmount = data.adjustmentType === 'credit' ? data.amount : -data.amount;
        const newBalance = currentBalance.availableBalance + adjustmentAmount;

        return {
          currentBalance: currentBalance.availableBalance,
          adjustmentAmount,
          newBalance,
        };
      },
    }),
    {
      name: 'leave-adjustment-storage',
      partialize: (state) => ({
        // Persist adjustments and carryforward history
        allAdjustments: state.allAdjustments,
        pendingAdjustments: state.pendingAdjustments,
        approvedAdjustments: state.approvedAdjustments,
        rejectedAdjustments: state.rejectedAdjustments,
        carryforwardHistory: state.carryforwardHistory,
        lastCarryforwardRun: state.lastCarryforwardRun,
      }),
    }
  )
);
