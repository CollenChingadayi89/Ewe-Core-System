/**
 * Leave Management Store - Ledger-based with full approval workflow
 *
 * This store manages leave requests and balances using a ledger-based approach
 * for accurate, auditable balance tracking.
 */

import { create } from 'zustand';
import type {
  LeaveRequest,
  LeaveBalance,
  LeaveType,
  ApprovalStatus,
} from '../types/index';
import type {
  LeaveTransaction,
  LeaveValidationResult,
  LeavePolicy,
  SpecialLeaveTrigger,
} from '../types/leave-ledger';
import {
  mockLeaveRequests,
  getLeaveBalanceByEmployee,
  getLeaveRequestsByEmployee,
  getLeaveRequestsByApprover,
  getLeaveRequestsByStatus,
  getUpcomingApprovedLeave,
  getOverdueLeaveRequests,
} from '../mock/leaves';
import {
  calculateLeaveBalance,
  getAllLeaveBalances,
  mockLeaveTransactions,
} from '../mock/leave-ledger';
import { mockLeavePolicies, getLeavePolicy, getApprovalFlow } from '../mock/leave-config';
import { calculateWorkingDays } from '../mock/public-holidays';
import { mockEmployees } from '../mock/employees';

// ============================================================================
// INTERFACES
// ============================================================================

interface LeaveRequestFormData {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  specialLeaveTrigger?: SpecialLeaveTrigger;
  attachments?: string[];
  handoverNotes?: string;
}

interface LeaveApprovalData {
  requestId: string;
  approverId: string;
  comment?: string;
  action: 'approve' | 'reject';
}

interface LeaveState {
  // State
  allRequests: LeaveRequest[];
  myRequests: LeaveRequest[];
  pendingMyApproval: LeaveRequest[];
  myBalances: LeaveBalance[];
  transactions: LeaveTransaction[];
  policies: LeavePolicy[];
  loading: boolean;
  error: string | null;

  // Actions - Data fetching
  fetchAllRequests: () => void;
  fetchMyLeaves: (employeeId: string) => void;
  fetchPendingApprovals: (approverId: string) => void;
  fetchLeaveBalance: (employeeId: string, leaveType: string) => LeaveBalance | null;
  fetchTransactionHistory: (employeeId: string, leaveType?: string) => LeaveTransaction[];

  // Actions - Leave requests
  submitRequest: (
    employeeId: string,
    employeeName: string,
    data: LeaveRequestFormData
  ) => Promise<void>;
  cancelRequest: (requestId: string, userId: string, reason?: string) => Promise<void>;

  // Actions - Approvals
  approveRequest: (data: LeaveApprovalData) => Promise<void>;
  rejectRequest: (data: LeaveApprovalData) => Promise<void>;

  // Utilities
  validateLeaveRequest: (
    employeeId: string,
    leaveType: string,
    startDate: string,
    endDate: string
  ) => LeaveValidationResult;
  getLeavePolicy: (leaveType: string) => LeavePolicy | undefined;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for leave requests
 */
function generateLeaveRequestId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `LEAVE-REQ-${timestamp}-${random}`;
}

/**
 * Calculate working days for a leave request based on leave type
 */
function calculateLeaveDays(
  leaveType: string,
  startDate: string,
  endDate: string
): number {
  const policy = mockLeavePolicies.find((p) => p.leaveType === leaveType);

  if (!policy) {
    return calculateWorkingDays(startDate, endDate, false, false);
  }

  return calculateWorkingDays(
    startDate,
    endDate,
    policy.countsWeekendsInLeave,
    policy.countsPublicHolidaysInLeave
  );
}

/**
 * Get employee details
 */
function getEmployeeById(employeeId: string) {
  return mockEmployees.find((emp) => emp.id === employeeId);
}

/**
 * Determine approver based on workflow
 */
function getFirstApprover(employeeId: string, leaveType: string) {
  const employee = getEmployeeById(employeeId);
  const flow = getApprovalFlow(leaveType);

  if (!employee || !flow || flow.stages.length === 0) {
    return { id: 'EMP-001', name: 'HR Manager' };
  }

  const firstStage = flow.stages[0];

  // For HR approval, use HR manager
  if (firstStage.approverRole === 'hr') {
    return { id: 'EMP-001', name: 'Collen Chingadayi' };
  }

  // For line manager approval, use employee's reportsTo
  if (firstStage.approverRole === 'line_manager' && employee.reportsTo) {
    const manager = getEmployeeById(employee.reportsTo);
    return manager
      ? { id: manager.id, name: manager.name }
      : { id: 'EMP-001', name: 'HR Manager' };
  }

  // For CEO approval
  if (firstStage.approverRole === 'ceo') {
    return { id: 'EMP-002', name: 'Margaret Njeri' };
  }

  // Default to HR
  return { id: 'EMP-001', name: 'Collen Chingadayi' };
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useLeaveStore = create<LeaveState>((set, get) => ({
  // ============================================================================
  // STATE
  // ============================================================================
  allRequests: [...mockLeaveRequests],
  myRequests: [],
  pendingMyApproval: [],
  myBalances: [],
  transactions: [...mockLeaveTransactions],
  policies: [...mockLeavePolicies],
  loading: false,
  error: null,

  // ============================================================================
  // FETCH ACTIONS
  // ============================================================================

  /**
   * Fetch all leave requests (for managers/HR)
   */
  fetchAllRequests: () => {
    set({ loading: true });

    setTimeout(() => {
      set({
        allRequests: [...mockLeaveRequests],
        loading: false,
      });
    }, 300);
  },

  /**
   * Fetch leave requests and balances for a specific employee
   */
  fetchMyLeaves: (employeeId: string) => {
    set({ loading: true });

    setTimeout(() => {
      const requests = getLeaveRequestsByEmployee(employeeId);
      const balances = getAllLeaveBalances(employeeId);

      set({
        myRequests: requests,
        myBalances: balances,
        loading: false,
      });
    }, 300);
  },

  /**
   * Fetch leave requests pending approval by a specific approver
   */
  fetchPendingApprovals: (approverId: string) => {
    set({ loading: true });

    setTimeout(() => {
      const pending = getLeaveRequestsByApprover(approverId);

      set({
        pendingMyApproval: pending,
        loading: false,
      });
    }, 300);
  },

  /**
   * Get leave balance for specific employee and leave type
   */
  fetchLeaveBalance: (employeeId: string, leaveType: string) => {
    const balance = calculateLeaveBalance(employeeId, leaveType);
    return balance;
  },

  /**
   * Get transaction history for an employee
   */
  fetchTransactionHistory: (employeeId: string, leaveType?: string) => {
    const transactions = mockLeaveTransactions.filter((txn) => {
      if (txn.employeeId !== employeeId) return false;
      if (leaveType && txn.leaveType !== leaveType) return false;
      return true;
    });

    return transactions.sort(
      (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()
    );
  },

  // ============================================================================
  // LEAVE REQUEST ACTIONS
  // ============================================================================

  /**
   * Submit a new leave request
   */
  submitRequest: async (
    employeeId: string,
    employeeName: string,
    data: LeaveRequestFormData
  ) => {
    set({ loading: true, error: null });

    try {
      // Validate request
      const validation = get().validateLeaveRequest(
        employeeId,
        data.leaveType,
        data.startDate,
        data.endDate
      );

      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Calculate working days
      const workingDaysCount = calculateLeaveDays(
        data.leaveType,
        data.startDate,
        data.endDate
      );

      // Get current balance
      const currentBalance = calculateLeaveBalance(employeeId, data.leaveType);

      // Determine approver
      const approver = getFirstApprover(employeeId, data.leaveType);

      // Get approval flow
      const flow = getApprovalFlow(data.leaveType);
      const approvalChain = flow
        ? flow.stages.map((stage) => ({
            id: `APPR-STEP-${Date.now()}-${stage.order}`,
            approverId: stage.order === 1 ? approver.id : 'EMP-001',
            approverName: stage.order === 1 ? approver.name : 'HR Manager',
            status: 'pending' as ApprovalStatus,
            order: stage.order,
          }))
        : [
            {
              id: `APPR-STEP-${Date.now()}-1`,
              approverId: approver.id,
              approverName: approver.name,
              status: 'pending' as ApprovalStatus,
              order: 1,
            },
          ];

      // Create new request
      const newRequest: LeaveRequest = {
        id: generateLeaveRequestId(),
        type: 'leave',
        requestorId: employeeId,
        requestorName: employeeName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pending',
        currentApproverId: approver.id,
        priority: data.leaveType === 'sick' || data.leaveType === 'special' ? 'high' : 'medium',
        approvalChain,
        data: {
          ...data,
          workingDaysCount,
          balanceBeforeRequest: currentBalance.availableBalance,
          balanceAfterRequest: currentBalance.availableBalance - workingDaysCount,
          isEmergencyLeave: data.leaveType === 'sick' || data.leaveType === 'special',
          documentationProvided: (data.attachments?.length ?? 0) > 0,
        },
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Add to store
      set((state) => ({
        allRequests: [newRequest, ...state.allRequests],
        myRequests: [newRequest, ...state.myRequests],
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to submit leave request',
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Cancel a leave request
   */
  cancelRequest: async (requestId: string, userId: string, reason?: string) => {
    set({ loading: true, error: null });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update request status
      set((state) => ({
        allRequests: state.allRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: 'cancelled' as ApprovalStatus,
                updatedAt: new Date().toISOString(),
                data: {
                  ...request.data,
                  reason: reason
                    ? `CANCELLED: ${reason}`
                    : `CANCELLED: ${request.data.reason}`,
                },
              }
            : request
        ),
        myRequests: state.myRequests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: 'cancelled' as ApprovalStatus,
                updatedAt: new Date().toISOString(),
                data: {
                  ...request.data,
                  reason: reason
                    ? `CANCELLED: ${reason}`
                    : `CANCELLED: ${request.data.reason}`,
                },
              }
            : request
        ),
        loading: false,
      }));

      // In a real system, would post cancellation_reversal transaction to ledger
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to cancel request',
        loading: false,
      });
      throw error;
    }
  },

  // ============================================================================
  // APPROVAL ACTIONS
  // ============================================================================

  /**
   * Approve a leave request
   */
  approveRequest: async (data: LeaveApprovalData) => {
    set({ loading: true, error: null });

    try {
      const { requestId, approverId, comment } = data;

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updateRequest = (request: LeaveRequest): LeaveRequest => {
        if (request.id !== requestId) return request;

        // Find current approval step
        const currentStepIndex = request.approvalChain.findIndex(
          (step) => step.approverId === approverId && step.status === 'pending'
        );

        if (currentStepIndex === -1) return request;

        // Update approval chain
        const updatedChain = request.approvalChain.map((step, index) =>
          index === currentStepIndex
            ? {
                ...step,
                status: 'approved' as ApprovalStatus,
                comment,
                timestamp: new Date().toISOString(),
              }
            : step
        );

        // Check if all approvals are complete
        const allApproved = updatedChain.every((step) => step.status === 'approved');

        // Determine next approver
        const nextPendingStep = updatedChain.find((step) => step.status === 'pending');

        return {
          ...request,
          status: allApproved ? 'approved' : 'pending',
          currentApproverId: nextPendingStep?.approverId,
          approvalChain: updatedChain,
          updatedAt: new Date().toISOString(),
        };
      };

      set((state) => ({
        allRequests: state.allRequests.map(updateRequest),
        myRequests: state.myRequests.map(updateRequest),
        pendingMyApproval: state.pendingMyApproval
          .map(updateRequest)
          .filter((req) => req.currentApproverId === approverId),
        loading: false,
      }));

      // In a real system, would post approval_reservation transaction to ledger
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to approve request',
        loading: false,
      });
      throw error;
    }
  },

  /**
   * Reject a leave request
   */
  rejectRequest: async (data: LeaveApprovalData) => {
    set({ loading: true, error: null });

    try {
      const { requestId, approverId, comment } = data;

      if (!comment) {
        throw new Error('Rejection reason is required');
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updateRequest = (request: LeaveRequest): LeaveRequest => {
        if (request.id !== requestId) return request;

        // Find current approval step
        const currentStepIndex = request.approvalChain.findIndex(
          (step) => step.approverId === approverId && step.status === 'pending'
        );

        if (currentStepIndex === -1) return request;

        // Update approval chain
        const updatedChain = request.approvalChain.map((step, index) =>
          index === currentStepIndex
            ? {
                ...step,
                status: 'rejected' as ApprovalStatus,
                comment,
                timestamp: new Date().toISOString(),
              }
            : step
        );

        return {
          ...request,
          status: 'rejected',
          currentApproverId: undefined,
          approvalChain: updatedChain,
          updatedAt: new Date().toISOString(),
        };
      };

      set((state) => ({
        allRequests: state.allRequests.map(updateRequest),
        myRequests: state.myRequests.map(updateRequest),
        pendingMyApproval: state.pendingMyApproval.filter((req) => req.id !== requestId),
        loading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reject request',
        loading: false,
      });
      throw error;
    }
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Validate a leave request before submission
   */
  validateLeaveRequest: (
    employeeId: string,
    leaveType: string,
    startDate: string,
    endDate: string
  ): LeaveValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get policy
    const policy = mockLeavePolicies.find((p) => p.leaveType === leaveType);
    if (!policy) {
      errors.push(`Leave type ${leaveType} is not recognized`);
      return { isValid: false, errors, warnings, calculatedWorkingDays: 0, affectedPublicHolidays: [] };
    }

    if (!policy.isActive) {
      errors.push(`${policy.displayName} is not currently available`);
    }

    // Calculate working days
    const workingDays = calculateLeaveDays(leaveType, startDate, endDate);

    // Get current balance
    const balance = calculateLeaveBalance(employeeId, leaveType);

    // Check sufficient balance (for accruing leave types)
    if (policy.accrualMethod !== 'none' && policy.accrualMethod !== 'fixed') {
      if (balance.availableBalance < workingDays) {
        errors.push(
          `Insufficient ${policy.displayName} balance. Available: ${balance.availableBalance} days, Requested: ${workingDays} days`
        );
      }
    }

    // Check maximum accumulation
    if (policy.maxAccumulationDays && balance.availableBalance > policy.maxAccumulationDays) {
      warnings.push(
        `Your ${policy.displayName} balance (${balance.availableBalance} days) is at or near the ${policy.maxAccumulationDays}-day statutory cap`
      );
    }

    // Check minimum service requirement
    if (policy.requiresMinimumService && policy.minimumServiceDays) {
      const employee = getEmployeeById(employeeId);
      if (employee) {
        const joinDate = new Date(employee.joinDate);
        const today = new Date();
        const daysOfService = Math.floor(
          (today.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysOfService < policy.minimumServiceDays) {
          errors.push(
            `${policy.displayName} requires at least ${Math.floor(policy.minimumServiceDays / 365)} year(s) of service. You have ${Math.floor(daysOfService / 365)} year(s)`
          );
        }
      }
    }

    // Check documentation requirements
    if (policy.requiresDocumentation && policy.documentationMandatory) {
      warnings.push(
        `${policy.displayName} requires supporting documentation: ${policy.documentationType?.join(', ')}`
      );
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      errors.push('Start date cannot be after end date');
    }

    // Check notice period
    const today = new Date().toISOString().split('T')[0];
    const daysNotice = Math.floor(
      (new Date(startDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (
      leaveType === 'annual' &&
      daysNotice < policy.minimumNoticeDays &&
      daysNotice >= 0
    ) {
      warnings.push(
        `${policy.displayName} typically requires ${policy.minimumNoticeDays} days notice. You are providing ${daysNotice} days notice.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      calculatedWorkingDays: workingDays,
      affectedPublicHolidays: [],
    };
  },

  /**
   * Get leave policy for a specific leave type
   */
  getLeavePolicy: (leaveType: string) => {
    return mockLeavePolicies.find((p) => p.leaveType === leaveType);
  },
}));
