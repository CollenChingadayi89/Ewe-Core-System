/**
 * Leave Policy Configuration Mock Data
 *
 * Based on EWE SACCO Employee Leave Policy
 * Implements statutory requirements per Zimbabwe Labour Act [Chapter 28:01]
 */

import type {
  LeavePolicy,
  EligibilityRule,
  ApprovalFlow,
  LeaveYearConfig,
  LeaveSystemSettings,
  LeaveApprovalStage,
} from '../types/leave-ledger';

// ============================================================================
// LEAVE TYPE POLICIES
// ============================================================================

export const mockLeavePolicies: LeavePolicy[] = [
  // ------------------------------------------------------------------------
  // ANNUAL / VACATION LEAVE (s14A)
  // ------------------------------------------------------------------------
  {
    id: 'POLICY-ANNUAL-001',
    leaveType: 'annual',
    displayName: 'Annual / Vacation Leave',
    description: 'Paid leave for rest and recovery. Accrues at 1/12 of qualifying service per year after completing one year of service.',
    isStatutory: true,
    statutoryReference: 's14A - Labour Act [Chapter 28:01]',
    isPaid: true,
    payStatus: 'full-pay',
    accrualMethod: 'monthly',
    annualEntitlementDays: 30, // 2.5 days per month × 12 months
    maxAccumulationDays: 90, // Statutory cap (s14A(2))
    requiresMinimumService: true,
    minimumServiceDays: 365, // One year qualifying service
    availableDuringProbation: false, // No accrual in first year regardless of probation
    requiresDocumentation: false,
    documentationMandatory: false,
    requiresManagerApproval: true,
    requiresHRApproval: false, // HR notified only
    requiresCEOApproval: false,
    approvalLevels: 1,
    autoEscalateAfterDays: 3,
    allowDelegation: true,
    allowSelfApproval: false,
    countsWeekendsInLeave: true, // s14A(3)
    countsPublicHolidaysInLeave: true, // s14A(3)
    allowCarryForward: true,
    carryForwardMaxDays: 90,
    expiresAtYearEnd: false, // Does not expire below 90-day cap
    payoutOnTermination: true, // Accrued but untaken leave paid in cash
    minimumNoticeDays: 14, // For leave >= 5 days
    minimumNoticeForShortLeave: 3, // For leave < 5 days
    supportsHalfDays: true,
    canBeConvertedFrom: ['sick'], // Can convert sick leave during annual leave
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'SYSTEM',
  },

  // ------------------------------------------------------------------------
  // SICK LEAVE (s14)
  // ------------------------------------------------------------------------
  {
    id: 'POLICY-SICK-001',
    leaveType: 'sick',
    displayName: 'Sick Leave',
    description: 'Paid leave for illness, injury or medical treatment. 90 days full pay + 90 days half pay per one-year period.',
    isStatutory: true,
    statutoryReference: 's14 - Labour Act [Chapter 28:01]',
    isPaid: true,
    payStatus: 'full-pay', // Then half-pay after 90 days
    accrualMethod: 'none', // Not an accruing balance - maximum entitlement
    annualEntitlementDays: 90, // Full pay days
    maxAccumulationDays: 180, // 90 full + 90 half
    requiresMinimumService: false, // Available from day one
    availableDuringProbation: true,
    requiresDocumentation: true,
    documentationType: ['medical-certificate'],
    documentationMandatory: true, // Cannot approve without certificate
    requiresManagerApproval: false, // Validated by HR against certificate
    requiresHRApproval: true,
    requiresCEOApproval: false,
    approvalLevels: 1,
    autoEscalateAfterDays: 2, // Faster escalation for sick leave
    allowDelegation: true,
    allowSelfApproval: false,
    countsWeekendsInLeave: false, // Only working days debited
    countsPublicHolidaysInLeave: false,
    allowCarryForward: false,
    expiresAtYearEnd: true, // Resets each one-year period
    payoutOnTermination: false,
    minimumNoticeDays: 0, // Same-day notification allowed
    minimumNoticeForShortLeave: 0,
    supportsHalfDays: true,
    canBeConvertedFrom: ['annual'], // Annual can convert to sick during leave
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'SYSTEM',
  },

  // ------------------------------------------------------------------------
  // MATERNITY LEAVE (s18)
  // ------------------------------------------------------------------------
  {
    id: 'POLICY-MATERNITY-001',
    leaveType: 'maternity',
    displayName: 'Maternity Leave',
    description: '98 days maternity leave on full pay. No minimum service requirement (2023 amendment). No occurrence limit.',
    isStatutory: true,
    statutoryReference: 's18 - Labour Act [Chapter 28:01], as amended by Labour Amendment Act, 2023',
    isPaid: true,
    payStatus: 'full-pay',
    accrualMethod: 'fixed', // Fixed 98 days per occurrence
    annualEntitlementDays: 98,
    maxAccumulationDays: 98,
    requiresMinimumService: false, // 2023 amendment removed 1-year qualifier
    restrictedToGender: 'female',
    availableDuringProbation: true, // Cannot be withheld
    requiresDocumentation: true,
    documentationType: ['medical-certificate'],
    documentationMandatory: true,
    requiresManagerApproval: false, // Statutory entitlement, not discretionary
    requiresHRApproval: true,
    requiresCEOApproval: false,
    approvalLevels: 1,
    autoEscalateAfterDays: 2,
    allowDelegation: false,
    allowSelfApproval: false,
    countsWeekendsInLeave: true, // Calendar days, not working days
    countsPublicHolidaysInLeave: true,
    allowCarryForward: false,
    expiresAtYearEnd: false,
    payoutOnTermination: false, // Benefits continue during leave
    minimumNoticeDays: 30, // As early as practicable
    minimumNoticeForShortLeave: 30,
    supportsHalfDays: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'SYSTEM',
  },

  // ------------------------------------------------------------------------
  // PATERNITY LEAVE (Proposed - Not Statutory)
  // ------------------------------------------------------------------------
  {
    id: 'POLICY-PATERNITY-001',
    leaveType: 'paternity',
    displayName: 'Paternity / Parental Leave',
    description: 'PROPOSED: 5 working days paid leave for fathers around birth of child. Not statutory - EWE SACCO policy.',
    isStatutory: false,
    statutoryReference: undefined,
    isPaid: true,
    payStatus: 'full-pay',
    accrualMethod: 'fixed',
    annualEntitlementDays: 5, // PROPOSED - Management to confirm
    maxAccumulationDays: 5,
    requiresMinimumService: true,
    minimumServiceDays: 180, // PROPOSED - 6 months service
    restrictedToGender: 'male', // Or other parent if applicable
    availableDuringProbation: false,
    requiresDocumentation: true,
    documentationType: ['birth-certificate'],
    documentationMandatory: true,
    requiresManagerApproval: true,
    requiresHRApproval: true,
    requiresCEOApproval: false,
    approvalLevels: 2,
    autoEscalateAfterDays: 3,
    allowDelegation: true,
    allowSelfApproval: false,
    countsWeekendsInLeave: false, // Working days only
    countsPublicHolidaysInLeave: false,
    allowCarryForward: false,
    expiresAtYearEnd: false,
    payoutOnTermination: false,
    minimumNoticeDays: 7,
    minimumNoticeForShortLeave: 7,
    supportsHalfDays: false,
    isActive: true, // Set to false if not approved by management
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'SYSTEM',
  },

  // ------------------------------------------------------------------------
  // SPECIAL / COMPASSIONATE LEAVE (s14B)
  // ------------------------------------------------------------------------
  {
    id: 'POLICY-SPECIAL-001',
    leaveType: 'special',
    displayName: 'Special / Compassionate Leave',
    description: 'Up to 12 days per calendar year for statutory triggers: bereavement, court witness, union duties, police detention, infectious disease quarantine, other compassionate grounds.',
    isStatutory: true,
    statutoryReference: 's14B - Labour Act [Chapter 28:01]',
    isPaid: true,
    payStatus: 'full-pay',
    accrualMethod: 'annual', // Annual cap, not accrued monthly
    annualEntitlementDays: 12,
    maxAccumulationDays: 12,
    requiresMinimumService: false, // Available from day one
    availableDuringProbation: true,
    requiresDocumentation: true,
    documentationType: [
      'death-certificate',
      'proof-of-relationship',
      'court-subpoena',
      'union-meeting-notice',
      'police-detention-confirmation',
      'medical-quarantine-letter',
    ],
    documentationMandatory: true,
    requiresManagerApproval: true,
    requiresHRApproval: true, // Documentation check
    requiresCEOApproval: false,
    approvalLevels: 2,
    autoEscalateAfterDays: 1, // Fast escalation for emergencies
    allowDelegation: true,
    allowSelfApproval: false,
    countsWeekendsInLeave: false, // Working days only
    countsPublicHolidaysInLeave: false,
    allowCarryForward: false,
    expiresAtYearEnd: true, // Resets each calendar year
    payoutOnTermination: false,
    minimumNoticeDays: 0, // Often unplanned
    minimumNoticeForShortLeave: 0,
    supportsHalfDays: true,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'SYSTEM',
  },

  // ------------------------------------------------------------------------
  // STUDY / EDUCATIONAL LEAVE (Proposed)
  // ------------------------------------------------------------------------
  {
    id: 'POLICY-STUDY-001',
    leaveType: 'study',
    displayName: 'Study / Educational Leave',
    description: 'PROPOSED: Paid examination leave for employees pursuing relevant qualifications. Not statutory.',
    isStatutory: false,
    statutoryReference: undefined,
    isPaid: true,
    payStatus: 'full-pay',
    accrualMethod: 'annual',
    annualEntitlementDays: 10, // PROPOSED - Management to confirm
    maxAccumulationDays: 10,
    requiresMinimumService: true,
    minimumServiceDays: 365, // PROPOSED - Confirmed employees only
    restrictedToEmploymentTypes: ['permanent', 'fixed-term'], // Not for interns
    availableDuringProbation: false,
    requiresDocumentation: true,
    documentationType: ['proof-of-enrollment', 'exam-timetable'],
    documentationMandatory: true,
    requiresManagerApproval: true,
    requiresHRApproval: true,
    requiresCEOApproval: false,
    approvalLevels: 2,
    autoEscalateAfterDays: 3,
    allowDelegation: true,
    allowSelfApproval: false,
    countsWeekendsInLeave: false,
    countsPublicHolidaysInLeave: false,
    allowCarryForward: false,
    expiresAtYearEnd: true,
    payoutOnTermination: false,
    minimumNoticeDays: 14,
    minimumNoticeForShortLeave: 7,
    supportsHalfDays: true,
    isActive: false, // Set to true if management approves
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'SYSTEM',
  },

  // ------------------------------------------------------------------------
  // UNPAID LEAVE
  // ------------------------------------------------------------------------
  {
    id: 'POLICY-UNPAID-001',
    leaveType: 'unpaid',
    displayName: 'Unpaid Leave',
    description: 'Leave without pay for personal reasons where paid leave is exhausted or not applicable.',
    isStatutory: false,
    statutoryReference: undefined,
    isPaid: false,
    payStatus: 'unpaid',
    accrualMethod: 'none',
    requiresMinimumService: false,
    availableDuringProbation: true, // At discretion
    requiresDocumentation: false,
    documentationMandatory: false,
    requiresManagerApproval: true,
    requiresHRApproval: true, // Mandatory countersign
    requiresCEOApproval: false,
    approvalLevels: 2,
    autoEscalateAfterDays: 3,
    allowDelegation: true,
    allowSelfApproval: false,
    countsWeekendsInLeave: false,
    countsPublicHolidaysInLeave: false,
    allowCarryForward: false,
    expiresAtYearEnd: false,
    payoutOnTermination: false,
    minimumNoticeDays: 14,
    minimumNoticeForShortLeave: 7,
    supportsHalfDays: false,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    updatedBy: 'SYSTEM',
  },
];

// ============================================================================
// ELIGIBILITY RULES
// ============================================================================

export const mockEligibilityRules: EligibilityRule[] = [
  // Annual Leave Rules
  {
    id: 'ELIG-ANNUAL-001',
    leaveType: 'annual',
    ruleType: 'minimum-service',
    condition: JSON.stringify({ minimumDays: 365 }),
    errorMessage: 'Annual leave only accrues after completing one year of service (s14A)',
    isActive: true,
  },
  {
    id: 'ELIG-ANNUAL-002',
    leaveType: 'annual',
    ruleType: 'probation-status',
    condition: JSON.stringify({ allowDuringProbation: false }),
    errorMessage: 'Annual leave does not accrue during the first year of service',
    isActive: true,
  },

  // Maternity Leave Rules
  {
    id: 'ELIG-MATERNITY-001',
    leaveType: 'maternity',
    ruleType: 'gender',
    condition: JSON.stringify({ requiredGender: 'female' }),
    errorMessage: 'Maternity leave is only available to female employees',
    isActive: true,
  },

  // Study Leave Rules
  {
    id: 'ELIG-STUDY-001',
    leaveType: 'study',
    ruleType: 'minimum-service',
    condition: JSON.stringify({ minimumDays: 365 }),
    errorMessage: 'Study leave requires at least one year of service',
    isActive: true,
  },
  {
    id: 'ELIG-STUDY-002',
    leaveType: 'study',
    ruleType: 'employment-type',
    condition: JSON.stringify({ allowedTypes: ['permanent', 'fixed-term'] }),
    errorMessage: 'Study leave is only available to permanent and fixed-term employees',
    isActive: true,
  },

  // Paternity Leave Rules
  {
    id: 'ELIG-PATERNITY-001',
    leaveType: 'paternity',
    ruleType: 'minimum-service',
    condition: JSON.stringify({ minimumDays: 180 }),
    errorMessage: 'Paternity leave requires at least 6 months of service',
    isActive: true,
  },
];

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

export const mockApprovalFlows: ApprovalFlow[] = [
  // Annual Leave Workflow
  {
    id: 'FLOW-ANNUAL-001',
    leaveType: 'annual',
    stages: [
      {
        id: 'STAGE-ANNUAL-001',
        order: 1,
        approverRole: 'line_manager',
        isMandatory: true,
        autoEscalateAfterDays: 3,
        escalateTo: 'hr',
        allowDelegation: true,
      },
    ],
    allowParallelApproval: false,
    requireAllStages: true,
    hrOverrideAllowed: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Sick Leave Workflow
  {
    id: 'FLOW-SICK-001',
    leaveType: 'sick',
    stages: [
      {
        id: 'STAGE-SICK-001',
        order: 1,
        approverRole: 'hr',
        isMandatory: true,
        autoEscalateAfterDays: 2,
        allowDelegation: true,
      },
    ],
    allowParallelApproval: false,
    requireAllStages: true,
    hrOverrideAllowed: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Maternity Leave Workflow
  {
    id: 'FLOW-MATERNITY-001',
    leaveType: 'maternity',
    stages: [
      {
        id: 'STAGE-MATERNITY-001',
        order: 1,
        approverRole: 'hr',
        isMandatory: true,
        autoEscalateAfterDays: 2,
        allowDelegation: false,
      },
    ],
    allowParallelApproval: false,
    requireAllStages: true,
    hrOverrideAllowed: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Special Leave Workflow
  {
    id: 'FLOW-SPECIAL-001',
    leaveType: 'special',
    stages: [
      {
        id: 'STAGE-SPECIAL-001',
        order: 1,
        approverRole: 'line_manager',
        isMandatory: true,
        autoEscalateAfterDays: 1,
        escalateTo: 'hr',
        allowDelegation: true,
      },
      {
        id: 'STAGE-SPECIAL-002',
        order: 2,
        approverRole: 'hr',
        isMandatory: true,
        autoEscalateAfterDays: 1,
        allowDelegation: true,
      },
    ],
    allowParallelApproval: false,
    requireAllStages: true,
    hrOverrideAllowed: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Unpaid Leave Workflow
  {
    id: 'FLOW-UNPAID-001',
    leaveType: 'unpaid',
    stages: [
      {
        id: 'STAGE-UNPAID-001',
        order: 1,
        approverRole: 'line_manager',
        isMandatory: true,
        autoEscalateAfterDays: 3,
        escalateTo: 'hr',
        allowDelegation: true,
      },
      {
        id: 'STAGE-UNPAID-002',
        order: 2,
        approverRole: 'hr',
        isMandatory: true,
        autoEscalateAfterDays: 3,
        allowDelegation: true,
      },
    ],
    allowParallelApproval: false,
    requireAllStages: true,
    hrOverrideAllowed: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Paternity Leave Workflow
  {
    id: 'FLOW-PATERNITY-001',
    leaveType: 'paternity',
    stages: [
      {
        id: 'STAGE-PATERNITY-001',
        order: 1,
        approverRole: 'line_manager',
        isMandatory: true,
        autoEscalateAfterDays: 3,
        escalateTo: 'hr',
        allowDelegation: true,
      },
      {
        id: 'STAGE-PATERNITY-002',
        order: 2,
        approverRole: 'hr',
        isMandatory: true,
        autoEscalateAfterDays: 2,
        allowDelegation: true,
      },
    ],
    allowParallelApproval: false,
    requireAllStages: true,
    hrOverrideAllowed: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // Study Leave Workflow
  {
    id: 'FLOW-STUDY-001',
    leaveType: 'study',
    stages: [
      {
        id: 'STAGE-STUDY-001',
        order: 1,
        approverRole: 'line_manager',
        isMandatory: true,
        autoEscalateAfterDays: 3,
        escalateTo: 'hr',
        allowDelegation: true,
      },
      {
        id: 'STAGE-STUDY-002',
        order: 2,
        approverRole: 'hr',
        isMandatory: true,
        autoEscalateAfterDays: 3,
        allowDelegation: true,
      },
    ],
    allowParallelApproval: false,
    requireAllStages: true,
    hrOverrideAllowed: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

// ============================================================================
// LEAVE YEAR CONFIGURATION
// ============================================================================

export const mockLeaveYearConfig: LeaveYearConfig = {
  id: 'LEAVEYEAR-001',
  leaveYearType: 'calendar', // Calendar year (1 Jan - 31 Dec)
  calendarYearStart: '01-01',
  calendarYearEnd: '12-31',
  autoCarryForward: true,
  carryForwardMaxDays: 90,
  carryForwardExpiryMonths: undefined, // No expiry below cap
  allowShutdownPeriods: false,
  shutdownPeriods: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

export const mockLeaveSystemSettings: LeaveSystemSettings = {
  id: 'SETTINGS-001',
  defaultNoticeDays: 14,
  shortLeaveNoticeDays: 3,
  shortLeaveThresholdDays: 5,
  workingDaysPerWeek: 5,
  weekendDays: [0, 6], // Sunday, Saturday
  allowHalfDayLeave: true,
  halfDayValue: 0.5,
  autoEscalationEnabled: true,
  defaultEscalationDays: 3,
  escalationReminderDays: 2,
  lowBalanceWarningThreshold: 5,
  highBalanceWarningThreshold: 80,
  accrualJobFrequency: 'monthly',
  accrualDayOfMonth: 1,
  recordRetentionYears: 6,
  notifyEmployeeOnApproval: true,
  notifyEmployeeOnRejection: true,
  notifyApproverOnSubmission: true,
  notifyHROnAllRequests: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getLeavePolicy(leaveType: string): LeavePolicy | undefined {
  return mockLeavePolicies.find((policy) => policy.leaveType === leaveType);
}

export function getActiveLeavePolicies(): LeavePolicy[] {
  return mockLeavePolicies.filter((policy) => policy.isActive);
}

export function getApprovalFlow(leaveType: string): ApprovalFlow | undefined {
  return mockApprovalFlows.find((flow) => flow.leaveType === leaveType);
}

export function getEligibilityRules(leaveType: string): EligibilityRule[] {
  return mockEligibilityRules.filter(
    (rule) => rule.leaveType === leaveType && rule.isActive
  );
}
