/**
 * Leave Management System - Ledger-based Type Definitions
 *
 * Based on EWE SACCO Employee Leave Policy
 * Implements ledger-based balance tracking with immutable audit trail
 */

// ============================================================================
// LEAVE TRANSACTION LEDGER
// ============================================================================

/**
 * Transaction types in the leave ledger
 * - accrual: Monthly credit based on qualifying service
 * - usage: Debit when leave is actually taken
 * - approval_reservation: Debit on approval (reserves balance for future leave)
 * - cancellation_reversal: Credit to restore balance when approved leave is cancelled
 * - adjustment: Manual correction by HR (with reason and audit trail)
 * - carryforward: Opening balance from previous leave year
 */
export type LeaveTransactionType =
  | 'accrual'
  | 'usage'
  | 'approval_reservation'
  | 'cancellation_reversal'
  | 'adjustment'
  | 'carryforward';

/**
 * Individual transaction in the leave ledger
 * Immutable once posted - corrections via offsetting adjustments
 */
export interface LeaveTransaction {
  id: string;
  employeeId: string;
  leaveType: LeaveTypeName;
  transactionType: LeaveTransactionType;
  amount: number; // days (positive for credits, negative for debits - stored as signed value)
  effectiveDate: string; // Date this transaction takes effect (YYYY-MM-DD)
  createdAt: string; // Timestamp when transaction was posted
  createdBy: string; // User ID who posted (system or HR admin)
  reason?: string; // Required for adjustments, optional for others
  relatedRequestId?: string; // Link to LeaveRequest if applicable
  notes?: string;
}

// ============================================================================
// LEAVE BALANCE CALCULATION
// ============================================================================

/**
 * Calculated leave balance for an employee at a point in time
 * NOT STORED - derived from ledger transactions
 *
 * Formula: availableBalance = totalAccrued - totalUsed - totalApprovedFuture
 */
export interface LeaveBalance {
  employeeId: string;
  leaveType: LeaveTypeName;
  asOfDate: string; // Balance calculated as of this date

  // Ledger aggregations
  totalAccrued: number; // SUM(accrual + carryforward + adjustment[positive])
  totalUsed: number; // SUM(usage)
  totalApprovedFuture: number; // SUM(approval_reservation for future dates)
  totalPending: number; // Sum of pending requests (not yet in ledger)
  totalAdjustments: number; // SUM(adjustment) - can be positive or negative

  // Derived balance
  availableBalance: number; // totalAccrued - totalUsed - totalApprovedFuture

  // Leave type specific tracking
  sickLeaveFullPayDaysUsed?: number; // For sick leave only
  sickLeaveHalfPayDaysUsed?: number; // For sick leave only
  maternityOccurrences?: number; // Count of maternity leaves taken (no longer capped per 2023 law)
}

// ============================================================================
// LEAVE TYPES
// ============================================================================

export type LeaveTypeName =
  | 'annual'          // Annual/Vacation Leave (s14A)
  | 'sick'            // Sick Leave (s14)
  | 'maternity'       // Maternity Leave (s18)
  | 'paternity'       // Paternity Leave (not statutory - proposed)
  | 'special'         // Special/Compassionate Leave (s14B)
  | 'study'           // Study/Educational Leave (proposed)
  | 'unpaid';         // Unpaid Leave

/**
 * Special leave statutory triggers (s14B of Labour Act)
 */
export type SpecialLeaveTrigger =
  | 'infectious-disease'    // (a) Quarantine on medical instruction
  | 'court-witness'         // (b) Court subpoena
  | 'union-duties'          // (c) Trade union delegate meeting
  | 'police-detention'      // (d) Detained for questioning
  | 'bereavement'           // (e) Death of spouse, parent, child, legal dependant
  | 'compassionate';        // (f) Other justifiable compassionate ground

/**
 * Accrual method for leave types
 */
export type AccrualMethod =
  | 'monthly'   // Accrues monthly (e.g., annual leave: 2.5 days/month after year 1)
  | 'annual'    // Credited once per year
  | 'fixed'     // Fixed entitlement per occurrence (e.g., maternity: 98 days)
  | 'none';     // No accrual (e.g., unpaid leave)

/**
 * Pay status for leave
 */
export type LeavePayStatus = 'full-pay' | 'half-pay' | 'unpaid';

// ============================================================================
// LEAVE POLICY CONFIGURATION
// ============================================================================

/**
 * Complete policy configuration for a leave type
 * Configured by HR in LeaveConfigurationPage
 */
export interface LeavePolicy {
  id: string;
  leaveType: LeaveTypeName;
  displayName: string;
  description: string;

  // Statutory vs proposed
  isStatutory: boolean; // True if mandated by Labour Act
  statutoryReference?: string; // e.g., "s14A - Labour Act [Chapter 28:01]"

  // Entitlement
  isPaid: boolean;
  payStatus: LeavePayStatus;
  accrualMethod: AccrualMethod;
  annualEntitlementDays?: number; // e.g., 30 for annual leave
  maxAccumulationDays?: number; // e.g., 90 for annual leave cap

  // Eligibility
  requiresMinimumService: boolean;
  minimumServiceDays?: number; // e.g., 365 for annual leave
  restrictedToGender?: 'male' | 'female'; // e.g., maternity
  availableDuringProbation: boolean;
  restrictedToEmploymentTypes?: string[]; // e.g., ['permanent', 'fixed-term']

  // Documentation
  requiresDocumentation: boolean;
  documentationType?: string[]; // e.g., ['medical-certificate'], ['death-certificate', 'proof-of-relationship']
  documentationMandatory: boolean; // If true, cannot approve without attachment

  // Approval workflow
  requiresManagerApproval: boolean;
  requiresHRApproval: boolean;
  requiresCEOApproval: boolean;
  approvalLevels: number; // Number of approval stages
  autoEscalateAfterDays: number; // Default: 3 working days
  allowDelegation: boolean;
  allowSelfApproval: boolean; // Always false per policy

  // Working day calculation
  countsWeekendsInLeave: boolean; // True for annual leave (s14A(3))
  countsPublicHolidaysInLeave: boolean; // True for annual leave (s14A(3))

  // Carryforward and expiry
  allowCarryForward: boolean;
  carryForwardMaxDays?: number;
  expiresAtYearEnd: boolean;
  payoutOnTermination: boolean; // True for annual leave

  // Notice requirements
  minimumNoticeDays: number; // e.g., 14 for annual leave >5 days
  minimumNoticeForShortLeave: number; // e.g., 3 for annual leave <=5 days

  // Other rules
  supportsHalfDays: boolean;
  canBeConvertedFrom?: LeaveTypeName[]; // e.g., annual can convert to sick during leave

  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

// ============================================================================
// ELIGIBILITY RULES
// ============================================================================

/**
 * Eligibility rule types
 */
export type EligibilityRuleType =
  | 'minimum-service'
  | 'employment-type'
  | 'gender'
  | 'probation-status'
  | 'department'
  | 'role';

/**
 * Individual eligibility rule
 */
export interface EligibilityRule {
  id: string;
  leaveType: LeaveTypeName;
  ruleType: EligibilityRuleType;
  condition: string; // JSON string with rule logic
  errorMessage: string; // Message shown when rule fails
  isActive: boolean;
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Approval stage in workflow
 */
export interface ApprovalStage {
  id: string;
  order: number; // 1, 2, 3...
  approverRole: 'line_manager' | 'hr' | 'finance_manager' | 'ceo';
  approverUserId?: string; // Specific user if not role-based
  isMandatory: boolean;
  autoEscalateAfterDays: number;
  escalateTo?: 'line_manager_superior' | 'hr' | 'ceo';
  allowDelegation: boolean;
  delegateUserId?: string;
}

/**
 * Complete approval workflow for a leave type
 */
export interface ApprovalFlow {
  id: string;
  leaveType: LeaveTypeName;
  stages: ApprovalStage[];
  allowParallelApproval: boolean; // If true, all stages can approve simultaneously
  requireAllStages: boolean; // If true, all stages must approve; if false, any stage can approve
  hrOverrideAllowed: boolean; // HR can override manager rejection
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PUBLIC HOLIDAYS CALENDAR
// ============================================================================

/**
 * Public holiday entry
 * Loaded annually from Zimbabwe government gazette
 */
export interface PublicHoliday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // e.g., "Independence Day"
  year: number;
  isRecurring: boolean; // e.g., Christmas is recurring, Heroes Day date varies
  affectsLeaveCalculation: boolean; // True for most, false if special
  notes?: string;
}

// ============================================================================
// LEAVE YEAR CONFIGURATION
// ============================================================================

export type LeaveYearType = 'calendar' | 'anniversary';

/**
 * Leave year configuration
 * Determines when leave entitlements reset and carry forward
 */
export interface LeaveYearConfig {
  id: string;
  leaveYearType: LeaveYearType;

  // Calendar year settings
  calendarYearStart?: string; // e.g., "01-01" (MM-DD)
  calendarYearEnd?: string; // e.g., "12-31"

  // Anniversary settings (per employee start date)
  anniversaryBased?: boolean;

  // Carry forward rules
  autoCarryForward: boolean;
  carryForwardMaxDays: number; // e.g., 90 for annual leave
  carryForwardExpiryMonths?: number; // If set, carried forward days expire after X months

  // Shutdown periods
  allowShutdownPeriods: boolean;
  shutdownPeriods?: ShutdownPeriod[];

  createdAt: string;
  updatedAt: string;
}

/**
 * Organization-wide shutdown period (e.g., Christmas closure)
 * Employees required to use annual leave
 */
export interface ShutdownPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  requiredLeaveType: LeaveTypeName; // Usually 'annual'
  isActive: boolean;
}

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

/**
 * Leave management system settings
 */
export interface LeaveSystemSettings {
  id: string;

  // Notice periods
  defaultNoticeDays: number; // Default: 14 days
  shortLeaveNoticeDays: number; // For leave <= 5 days: 3 days
  shortLeaveThresholdDays: number; // 5 days

  // Working day configuration
  workingDaysPerWeek: number; // Default: 5
  weekendDays: number[]; // [0, 6] = Sunday, Saturday

  // Half-day leave
  allowHalfDayLeave: boolean;
  halfDayValue: number; // 0.5

  // Escalation
  autoEscalationEnabled: boolean;
  defaultEscalationDays: number; // 3 working days
  escalationReminderDays: number; // Send reminder before escalation

  // Balance warnings
  lowBalanceWarningThreshold: number; // Warn when balance < X days
  highBalanceWarningThreshold: number; // Warn when approaching cap (e.g., 80 days for 90-day cap)

  // Accrual
  accrualJobFrequency: 'monthly' | 'bi-weekly' | 'weekly';
  accrualDayOfMonth: number; // Day of month to run accrual (e.g., 1st)

  // Record retention
  recordRetentionYears: number; // 6 years minimum per Zimbabwe law

  // Notifications
  notifyEmployeeOnApproval: boolean;
  notifyEmployeeOnRejection: boolean;
  notifyApproverOnSubmission: boolean;
  notifyHROnAllRequests: boolean;

  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// LEAVE ADJUSTMENT (MANUAL CORRECTIONS)
// ============================================================================

/**
 * Manual leave balance adjustment
 * Posted by HR to correct errors or reflect special circumstances
 */
export interface LeaveAdjustment {
  id: string;
  employeeId: string;
  leaveType: LeaveTypeName;
  adjustmentDays: number; // Positive for credit, negative for debit
  reason: string; // Mandatory
  approvedBy: string; // HR user ID
  approvalDate: string;
  effectiveDate: string; // When adjustment takes effect
  relatedTransactionId?: string; // If correcting a specific transaction
  notes?: string;
  createdAt: string;
}

// ============================================================================
// WORKING DAY CALCULATION
// ============================================================================

/**
 * Employee work schedule for accurate working day calculation
 */
export interface EmployeeWorkSchedule {
  employeeId: string;
  scheduleType: 'standard' | 'shift' | 'compressed' | 'part-time';
  workingDays: number[]; // 0-6, where 0=Sunday (e.g., [1,2,3,4,5] for Mon-Fri)
  hoursPerDay: number; // For part-time calculations
  effectiveFrom: string;
  effectiveTo?: string; // null if current
}

// ============================================================================
// LEAVE REQUEST ENHANCEMENTS
// ============================================================================

/**
 * Supporting document for leave request
 */
export interface LeaveDocument {
  id: string;
  leaveRequestId: string;
  documentType: string; // 'medical-certificate', 'death-certificate', 'court-subpoena', etc.
  fileName: string;
  fileUrl: string; // Mock URL or base64 in frontend-only
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * State machine states for leave request
 */
export type LeaveRequestStatus =
  | 'draft'       // Created but not submitted
  | 'pending'     // Submitted, awaiting approval
  | 'approved'    // Approved, leave in future or ongoing
  | 'declined'    // Rejected by approver
  | 'taken'       // Leave dates have passed, marked as taken
  | 'cancelled';  // Cancelled by employee or manager

/**
 * Validation result for leave request
 */
export interface LeaveValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  calculatedWorkingDays: number;
  affectedPublicHolidays: PublicHoliday[];
  balanceAfterRequest: number;
}
