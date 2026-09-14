/**
 * Leave Requests and Helper Functions
 *
 * Enhanced with ledger-based balance tracking
 * Demonstrates all 7 leave types and approval workflows
 */

import type { LeaveRequest, LeaveType, ApprovalStatus } from '../types/index';
import { calculateLeaveBalance, getAllLeaveBalances } from './leave-ledger';
import { mockEmployees } from './employees';

// ============================================================================
// LEAVE REQUESTS
// ============================================================================

export const mockLeaveRequests: LeaveRequest[] = [
  // ========================================================================
  // PENDING LEAVE REQUESTS (For approval testing)
  // ========================================================================

  // Annual Leave - Standard request
  {
    id: 'LEAVE-REQ-001',
    type: 'leave',
    requestorId: 'EMP-001',
    requestorName: 'Collen Chingadayi',
    createdAt: '2026-09-10T08:30:00Z',
    updatedAt: '2026-09-10T12:00:00Z',
    status: 'approved',
    currentApproverId: undefined,
    priority: 'medium',
    approvalChain: [
      {
        id: 'APPR-STEP-001',
        approverId: 'EMP-002',
        approverName: 'Margaret Njeri',
        status: 'approved',
        comment: 'Approved - enjoy your holiday!',
        timestamp: '2026-09-10T12:00:00Z',
        order: 1,
      },
    ],
    data: {
      leaveType: 'annual',
      startDate: '2026-12-23',
      endDate: '2027-01-03',
      days: 10,
      workingDaysCount: 10,
      reason: 'Christmas and New Year holiday with family',
      attachments: [],
      balanceBeforeRequest: 35,
      balanceAfterRequest: 25,
    },
  },

  // Sick Leave - Pending approval
  {
    id: 'LEAVE-REQ-002',
    type: 'leave',
    requestorId: 'EMP-004',
    requestorName: 'Peter Omondi',
    createdAt: '2026-09-13T07:15:00Z',
    updatedAt: '2026-09-13T07:15:00Z',
    status: 'pending',
    currentApproverId: 'EMP-001',
    priority: 'high',
    approvalChain: [
      {
        id: 'APPR-STEP-002',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'pending',
        order: 1,
      },
    ],
    data: {
      leaveType: 'sick',
      startDate: '2026-09-13',
      endDate: '2026-09-14',
      days: 2,
      workingDaysCount: 2,
      reason: 'Flu symptoms - medical certificate to follow',
      attachments: [],
      isEmergencyLeave: true,
      documentationProvided: false,
      balanceBeforeRequest: 90,
      balanceAfterRequest: 88,
    },
  },

  // Special Leave - Bereavement (approved quickly)
  {
    id: 'LEAVE-REQ-096',
    type: 'leave',
    requestorId: 'EMP-004',
    requestorName: 'Peter Omondi',
    createdAt: '2026-05-20T06:00:00Z',
    updatedAt: '2026-05-20T10:00:00Z',
    status: 'approved',
    currentApproverId: undefined,
    priority: 'high',
    approvalChain: [
      {
        id: 'APPR-STEP-096-1',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'approved',
        comment: 'Deepest condolences. Take the time you need.',
        timestamp: '2026-05-20T08:30:00Z',
        order: 1,
      },
      {
        id: 'APPR-STEP-096-2',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'approved',
        comment: 'HR approval confirmed',
        timestamp: '2026-05-20T10:00:00Z',
        order: 2,
      },
    ],
    data: {
      leaveType: 'special',
      startDate: '2026-05-20',
      endDate: '2026-05-22',
      days: 3,
      workingDaysCount: 3,
      reason: 'Bereavement - death of parent',
      specialLeaveTrigger: 'bereavement',
      attachments: ['death-certificate-2026-05-19.pdf', 'proof-of-relationship.pdf'],
      isEmergencyLeave: true,
      documentationProvided: true,
      balanceBeforeRequest: 12,
      balanceAfterRequest: 9,
    },
  },

  // Annual Leave - Pending with long notice period
  {
    id: 'LEAVE-REQ-003',
    type: 'leave',
    requestorId: 'EMP-003',
    requestorName: 'David Kamau',
    createdAt: '2026-09-12T14:00:00Z',
    updatedAt: '2026-09-12T14:00:00Z',
    status: 'pending',
    currentApproverId: 'EMP-002',
    priority: 'medium',
    approvalChain: [
      {
        id: 'APPR-STEP-003',
        approverId: 'EMP-002',
        approverName: 'Margaret Njeri',
        status: 'pending',
        order: 1,
      },
    ],
    data: {
      leaveType: 'annual',
      startDate: '2026-11-18',
      endDate: '2026-11-29',
      days: 10,
      workingDaysCount: 10,
      reason: 'Annual leave - family vacation to Victoria Falls',
      attachments: [],
      balanceBeforeRequest: 33.5,
      balanceAfterRequest: 23.5,
    },
  },

  // Maternity Leave - Pending HR approval
  {
    id: 'LEAVE-REQ-004',
    type: 'leave',
    requestorId: 'EMP-010',
    requestorName: 'Grace Mukuka',
    createdAt: '2026-09-05T10:30:00Z',
    updatedAt: '2026-09-05T10:30:00Z',
    status: 'pending',
    currentApproverId: 'EMP-001',
    priority: 'high',
    approvalChain: [
      {
        id: 'APPR-STEP-004',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'pending',
        order: 1,
      },
    ],
    data: {
      leaveType: 'maternity',
      startDate: '2026-10-15',
      endDate: '2027-01-21',
      days: 98,
      workingDaysCount: 98,
      reason: 'Maternity leave - expected delivery date 2026-11-01',
      attachments: ['medical-certificate-maternity.pdf'],
      documentationProvided: true,
      balanceBeforeRequest: 98,
      balanceAfterRequest: 0,
    },
  },

  // Paternity Leave - Pending
  {
    id: 'LEAVE-REQ-005',
    type: 'leave',
    requestorId: 'EMP-005',
    requestorName: 'Michael Otieno',
    createdAt: '2026-09-11T16:00:00Z',
    updatedAt: '2026-09-11T16:00:00Z',
    status: 'pending',
    currentApproverId: 'EMP-002',
    priority: 'medium',
    approvalChain: [
      {
        id: 'APPR-STEP-005-1',
        approverId: 'EMP-002',
        approverName: 'Margaret Njeri',
        status: 'pending',
        order: 1,
      },
      {
        id: 'APPR-STEP-005-2',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'pending',
        order: 2,
      },
    ],
    data: {
      leaveType: 'paternity',
      startDate: '2026-09-30',
      endDate: '2026-10-04',
      days: 5,
      workingDaysCount: 5,
      reason: 'Paternity leave - birth of child',
      attachments: ['birth-notification.pdf'],
      documentationProvided: true,
      balanceBeforeRequest: 5,
      balanceAfterRequest: 0,
    },
  },

  // Unpaid Leave - Pending multi-level approval
  {
    id: 'LEAVE-REQ-006',
    type: 'leave',
    requestorId: 'EMP-007',
    requestorName: 'Sarah Mwangi',
    createdAt: '2026-09-08T11:00:00Z',
    updatedAt: '2026-09-08T11:00:00Z',
    status: 'pending',
    currentApproverId: 'EMP-003',
    priority: 'low',
    approvalChain: [
      {
        id: 'APPR-STEP-006-1',
        approverId: 'EMP-003',
        approverName: 'David Kamau',
        status: 'pending',
        order: 1,
      },
      {
        id: 'APPR-STEP-006-2',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'pending',
        order: 2,
      },
    ],
    data: {
      leaveType: 'unpaid',
      startDate: '2026-10-20',
      endDate: '2026-10-27',
      days: 6,
      workingDaysCount: 6,
      reason: 'Personal reasons - exhausted annual leave balance',
      attachments: [],
      balanceBeforeRequest: 0,
      balanceAfterRequest: 0,
    },
  },

  // ========================================================================
  // APPROVED LEAVE REQUESTS (Historical and upcoming)
  // ========================================================================

  // Annual Leave - Taken in the past
  {
    id: 'LEAVE-REQ-099',
    type: 'leave',
    requestorId: 'EMP-001',
    requestorName: 'Collen Chingadayi',
    createdAt: '2026-07-01T09:00:00Z',
    updatedAt: '2026-07-10T10:00:00Z',
    status: 'approved',
    currentApproverId: undefined,
    priority: 'medium',
    approvalChain: [
      {
        id: 'APPR-STEP-099',
        approverId: 'EMP-002',
        approverName: 'Margaret Njeri',
        status: 'approved',
        comment: 'Approved - mid-year break',
        timestamp: '2026-07-10T10:00:00Z',
        order: 1,
      },
    ],
    data: {
      leaveType: 'annual',
      startDate: '2026-07-15',
      endDate: '2026-07-19',
      days: 5,
      workingDaysCount: 5,
      reason: 'Mid-year break - rest and recovery',
      attachments: [],
      balanceBeforeRequest: 25,
      balanceAfterRequest: 20,
    },
  },

  // Annual Leave - Approved for David
  {
    id: 'LEAVE-REQ-098',
    type: 'leave',
    requestorId: 'EMP-003',
    requestorName: 'David Kamau',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-05T14:30:00Z',
    status: 'approved',
    currentApproverId: undefined,
    priority: 'medium',
    approvalChain: [
      {
        id: 'APPR-STEP-098',
        approverId: 'EMP-002',
        approverName: 'Margaret Njeri',
        status: 'approved',
        comment: 'Approved - enjoy your vacation',
        timestamp: '2026-06-05T14:30:00Z',
        order: 1,
      },
    ],
    data: {
      leaveType: 'annual',
      startDate: '2026-06-15',
      endDate: '2026-06-23',
      days: 7,
      workingDaysCount: 7,
      reason: 'Family vacation - beach holiday in Mombasa',
      attachments: [],
      balanceBeforeRequest: 27,
      balanceAfterRequest: 20,
    },
  },

  // Sick Leave - Approved
  {
    id: 'LEAVE-REQ-097',
    type: 'leave',
    requestorId: 'EMP-003',
    requestorName: 'David Kamau',
    createdAt: '2026-08-12T07:00:00Z',
    updatedAt: '2026-08-14T09:00:00Z',
    status: 'approved',
    currentApproverId: undefined,
    priority: 'high',
    approvalChain: [
      {
        id: 'APPR-STEP-097',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'approved',
        comment: 'Get well soon - medical certificate received',
        timestamp: '2026-08-14T09:00:00Z',
        order: 1,
      },
    ],
    data: {
      leaveType: 'sick',
      startDate: '2026-08-12',
      endDate: '2026-08-13',
      days: 2,
      workingDaysCount: 2,
      reason: 'Flu - unable to work',
      attachments: ['medical-certificate-2026-08-14.pdf'],
      isEmergencyLeave: true,
      documentationProvided: true,
      balanceBeforeRequest: 90,
      balanceAfterRequest: 88,
    },
  },

  // ========================================================================
  // CANCELLED/REJECTED LEAVE REQUESTS
  // ========================================================================

  // Cancelled Leave - Employee requested cancellation
  {
    id: 'LEAVE-REQ-095',
    type: 'leave',
    requestorId: 'EMP-003',
    requestorName: 'David Kamau',
    createdAt: '2026-09-05T11:00:00Z',
    updatedAt: '2026-09-08T09:30:00Z',
    status: 'cancelled',
    currentApproverId: undefined,
    priority: 'medium',
    approvalChain: [
      {
        id: 'APPR-STEP-095',
        approverId: 'EMP-002',
        approverName: 'Margaret Njeri',
        status: 'approved',
        comment: 'Originally approved',
        timestamp: '2026-09-05T15:00:00Z',
        order: 1,
      },
    ],
    data: {
      leaveType: 'annual',
      startDate: '2026-10-10',
      endDate: '2026-10-14',
      days: 5,
      workingDaysCount: 5,
      reason: 'CANCELLED - Urgent project deadline moved up',
      attachments: [],
      balanceBeforeRequest: 28.5,
      balanceAfterRequest: 28.5, // Restored after cancellation
    },
  },

  // Rejected Leave - Operational constraints
  {
    id: 'LEAVE-REQ-007',
    type: 'leave',
    requestorId: 'EMP-006',
    requestorName: 'James Mutua',
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-02T11:00:00Z',
    status: 'rejected',
    currentApproverId: undefined,
    priority: 'medium',
    approvalChain: [
      {
        id: 'APPR-STEP-007',
        approverId: 'EMP-003',
        approverName: 'David Kamau',
        status: 'rejected',
        comment: 'Unable to approve - we have year-end closing during this period. Please reschedule for after 31 December.',
        timestamp: '2026-09-02T11:00:00Z',
        order: 1,
      },
    ],
    data: {
      leaveType: 'annual',
      startDate: '2026-12-20',
      endDate: '2026-12-31',
      days: 10,
      workingDaysCount: 8,
      reason: 'Christmas holiday',
      attachments: [],
      balanceBeforeRequest: 18,
      balanceAfterRequest: 18, // Not deducted - rejected
    },
  },

  // ========================================================================
  // SPECIAL CASES & EDGE CASES
  // ========================================================================

  // Sick Leave converted from Annual Leave (mid-vacation)
  {
    id: 'LEAVE-REQ-093',
    type: 'leave',
    requestorId: 'EMP-001',
    requestorName: 'Collen Chingadayi',
    createdAt: '2026-05-05T09:00:00Z',
    updatedAt: '2026-05-05T09:00:00Z',
    status: 'approved',
    currentApproverId: undefined,
    priority: 'high',
    approvalChain: [
      {
        id: 'APPR-STEP-093',
        approverId: 'EMP-001',
        approverName: 'Self (HR Override)',
        status: 'approved',
        comment: 'Converted from annual leave per s14A(4) - fell ill during vacation',
        timestamp: '2026-05-05T09:00:00Z',
        order: 1,
      },
    ],
    data: {
      leaveType: 'sick',
      startDate: '2026-05-05',
      endDate: '2026-05-12',
      days: 7,
      workingDaysCount: 6,
      reason: 'Illness during annual leave - converted to sick leave',
      attachments: ['medical-certificate-2026-05-05.pdf'],
      isEmergencyLeave: true,
      documentationProvided: true,
      balanceBeforeRequest: 90,
      balanceAfterRequest: 84,
    },
  },

  // Special Leave - Court witness
  {
    id: 'LEAVE-REQ-008',
    type: 'leave',
    requestorId: 'EMP-008',
    requestorName: 'John Njoroge',
    createdAt: '2026-07-20T14:00:00Z',
    updatedAt: '2026-07-21T09:00:00Z',
    status: 'approved',
    currentApproverId: undefined,
    priority: 'high',
    approvalChain: [
      {
        id: 'APPR-STEP-008-1',
        approverId: 'EMP-003',
        approverName: 'David Kamau',
        status: 'approved',
        comment: 'Statutory entitlement - approved',
        timestamp: '2026-07-21T09:00:00Z',
        order: 1,
      },
      {
        id: 'APPR-STEP-008-2',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'approved',
        comment: 'HR confirmed - court subpoena verified',
        timestamp: '2026-07-21T09:00:00Z',
        order: 2,
      },
    ],
    data: {
      leaveType: 'special',
      startDate: '2026-08-05',
      endDate: '2026-08-05',
      days: 1,
      workingDaysCount: 1,
      reason: 'Court witness - subpoenaed to appear',
      specialLeaveTrigger: 'court-witness',
      attachments: ['court-subpoena-2026-07-20.pdf'],
      documentationProvided: true,
      balanceBeforeRequest: 12,
      balanceAfterRequest: 11,
    },
  },

  // Half-day Annual Leave
  {
    id: 'LEAVE-REQ-009',
    type: 'leave',
    requestorId: 'EMP-004',
    requestorName: 'Peter Omondi',
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-08-11T10:00:00Z',
    status: 'approved',
    currentApproverId: undefined,
    priority: 'low',
    approvalChain: [
      {
        id: 'APPR-STEP-009',
        approverId: 'EMP-001',
        approverName: 'Collen Chingadayi',
        status: 'approved',
        comment: 'Half-day approved',
        timestamp: '2026-08-11T10:00:00Z',
        order: 1,
      },
    ],
    data: {
      leaveType: 'annual',
      startDate: '2026-08-20',
      endDate: '2026-08-20',
      days: 0.5,
      workingDaysCount: 0.5,
      reason: 'Half-day leave - afternoon personal appointment',
      attachments: [],
      balanceBeforeRequest: 32.5,
      balanceAfterRequest: 32,
    },
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get leave balances for an employee (using ledger calculations)
 */
export const getLeaveBalanceByEmployee = (employeeId: string) => {
  return getAllLeaveBalances(employeeId);
};

/**
 * Get leave requests by employee
 */
export const getLeaveRequestsByEmployee = (employeeId: string): LeaveRequest[] => {
  return mockLeaveRequests.filter((request) => request.requestorId === employeeId);
};

/**
 * Get leave requests pending approval by a specific approver
 */
export const getLeaveRequestsByApprover = (approverId: string): LeaveRequest[] => {
  return mockLeaveRequests.filter((request) =>
    request.approvalChain.some(
      (step) => step.approverId === approverId && step.status === 'pending'
    )
  );
};

/**
 * Get leave requests by status
 */
export const getLeaveRequestsByStatus = (status: ApprovalStatus): LeaveRequest[] => {
  return mockLeaveRequests.filter((request) => request.status === status);
};

/**
 * Get upcoming approved leave (future dates)
 */
export const getUpcomingApprovedLeave = (employeeId?: string): LeaveRequest[] => {
  const today = new Date().toISOString().split('T')[0];
  let requests = mockLeaveRequests.filter(
    (request) => request.status === 'approved' && request.data.startDate >= today
  );

  if (employeeId) {
    requests = requests.filter((request) => request.requestorId === employeeId);
  }

  return requests;
};

/**
 * Get overdue leave requests (pending > 3 days)
 */
export const getOverdueLeaveRequests = (): LeaveRequest[] => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const cutoffDate = threeDaysAgo.toISOString();

  return mockLeaveRequests.filter(
    (request) => request.status === 'pending' && request.createdAt < cutoffDate
  );
};

// ============================================================================
// LEAVE TYPE DISPLAY CONFIGURATION
// ============================================================================

export const leaveTypeColors: Record<LeaveType, string> = {
  annual: '#1890ff',
  sick: '#ff4d4f',
  casual: '#52c41a',
  maternity: '#eb2f96',
  paternity: '#722ed1',
  compassionate: '#8c8c8c',
  special: '#fa8c16',
  study: '#13c2c2',
  unpaid: '#8c8c8c',
};

export const leaveTypeLabels: Record<LeaveType, string> = {
  annual: 'Annual Leave',
  sick: 'Sick Leave',
  casual: 'Casual Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  compassionate: 'Compassionate Leave',
  special: 'Special Leave',
  study: 'Study Leave',
  unpaid: 'Unpaid Leave',
};

export const leaveTypeIcons: Record<LeaveType, string> = {
  annual: 'calendar',
  sick: 'medicine-box',
  casual: 'coffee',
  maternity: 'heart',
  paternity: 'user',
  compassionate: 'heart',
  special: 'star',
  study: 'book',
  unpaid: 'close-circle',
};

// Special leave trigger labels
export const specialLeaveTriggerLabels: Record<string, string> = {
  'infectious-disease': 'Infectious Disease Quarantine',
  'court-witness': 'Court Witness / Subpoena',
  'union-duties': 'Trade Union Delegate Duties',
  'police-detention': 'Police Detention for Questioning',
  'bereavement': 'Bereavement / Death of Relative',
  'compassionate': 'Other Compassionate Grounds',
};
