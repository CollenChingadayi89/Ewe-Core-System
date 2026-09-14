/**
 * Leave Configuration Store
 *
 * Manages leave system configuration including:
 * - Leave type policies and rules
 * - Approval workflows and chains
 * - Public holiday calendars
 * - Eligibility rules and service requirements
 * - System-wide leave settings
 *
 * This store is used by HR/Admin to configure the entire leave management system.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  LeavePolicy,
  ApprovalFlow,
  PublicHoliday,
  EligibilityRule,
} from '../types/leave-ledger';
import {
  mockLeavePolicies,
  mockApprovalFlows,
  mockEligibilityRules,
} from '../mock/leave-config';
import {
  mockPublicHolidays,
  mockPublicHolidays2025,
  mockPublicHolidays2026,
} from '../mock/public-holidays';

/**
 * Form data for creating/updating leave policies
 */
export interface LeavePolicyFormData {
  leaveType: string;
  displayName: string;
  description: string;
  isStatutory: boolean;
  statutoryReference?: string;
  isPaid: boolean;
  payStatus: 'full-pay' | 'half-pay' | 'unpaid' | 'graduated';
  accrualMethod: 'monthly' | 'annual' | 'daily' | 'fixed' | 'none';
  annualEntitlementDays?: number;
  maxAccumulationDays?: number;
  requiresMinimumService: boolean;
  minimumServiceDays?: number;
  requiresDocumentation: boolean;
  documentationMandatory: boolean;
  requiresManagerApproval: boolean;
  requiresHRApproval: boolean;
  countsWeekendsInLeave: boolean;
  countsPublicHolidaysInLeave: boolean;
  allowCarryForward: boolean;
  carryForwardMaxDays?: number;
  payoutOnTermination: boolean;
  minimumNoticeDays?: number;
  isActive: boolean;
}

/**
 * Form data for creating/updating approval workflows
 */
export interface ApprovalFlowFormData {
  leaveType: string;
  displayName: string;
  description: string;
  stages: Array<{
    stageName: string;
    approverRole: string;
    isRequired: boolean;
    allowDelegation: boolean;
    autoEscalationHours?: number;
    escalateToRole?: string;
  }>;
  isActive: boolean;
}

/**
 * Form data for creating/updating public holidays
 */
export interface PublicHolidayFormData {
  date: string;
  name: string;
  year: number;
  isRecurring: boolean;
  affectsLeaveCalculation: boolean;
  notes?: string;
}

/**
 * Form data for creating/updating eligibility rules
 */
export interface EligibilityRuleFormData {
  leaveType: string;
  ruleName: string;
  description: string;
  minimumServiceDays?: number;
  maximumServiceDays?: number;
  restrictedToGender?: 'male' | 'female';
  restrictedToJobGrades?: string[];
  restrictedToDepartments?: string[];
  restrictedToEmploymentTypes?: string[];
  maximumOccurrences?: number;
  occurrencePeriod?: 'lifetime' | 'year' | 'month';
  requiresSpecificConditions?: string[];
  isActive: boolean;
}

/**
 * Validation result for configuration changes
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration change audit log
 */
export interface ConfigChangeLog {
  id: string;
  changeType: 'policy' | 'workflow' | 'holiday' | 'eligibility' | 'setting';
  entityId: string;
  entityName: string;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  changedBy: string;
  changedAt: string;
  changesSummary: string;
  previousValue?: any;
  newValue?: any;
}

interface LeaveConfigState {
  // State - Policies
  policies: LeavePolicy[];
  selectedPolicy: LeavePolicy | null;

  // State - Workflows
  approvalFlows: ApprovalFlow[];
  selectedFlow: ApprovalFlow | null;

  // State - Public Holidays
  publicHolidays: PublicHoliday[];
  publicHolidays2025: PublicHoliday[];
  publicHolidays2026: PublicHoliday[];

  // State - Eligibility Rules
  eligibilityRules: EligibilityRule[];

  // State - System Settings
  systemSettings: {
    fiscalYearStartMonth: number; // 1-12 (Jan=1)
    defaultWorkweekDays: number[]; // [1,2,3,4,5] = Mon-Fri
    enableLeaveCarryForward: boolean;
    carryForwardDeadlineMonth: number; // Month by which carryforward must be used
    enableLeaveEncashment: boolean;
    enableLeaveAdvanceBooking: boolean;
    advanceBookingMaxMonths: number;
    enableAutomaticAccrual: boolean;
    accrualRunDayOfMonth: number; // Day of month to run accrual
    enableEmailNotifications: boolean;
    enableSMSNotifications: boolean;
    requireAttachmentsForSickLeave: boolean;
    sickLeaveAttachmentThresholdDays: number;
  };

  // State - UI
  loading: boolean;
  saving: boolean;
  error: string | null;
  changeLog: ConfigChangeLog[];

  // Actions - Policies
  fetchPolicies: () => void;
  getPolicyById: (id: string) => LeavePolicy | undefined;
  getPolicyByType: (leaveType: string) => LeavePolicy | undefined;
  createPolicy: (userId: string, data: LeavePolicyFormData) => Promise<void>;
  updatePolicy: (userId: string, policyId: string, data: Partial<LeavePolicyFormData>) => Promise<void>;
  deletePolicy: (userId: string, policyId: string) => Promise<void>;
  activatePolicy: (userId: string, policyId: string) => Promise<void>;
  deactivatePolicy: (userId: string, policyId: string) => Promise<void>;
  selectPolicy: (policy: LeavePolicy | null) => void;

  // Actions - Workflows
  fetchApprovalFlows: () => void;
  getApprovalFlowByType: (leaveType: string) => ApprovalFlow | undefined;
  createApprovalFlow: (userId: string, data: ApprovalFlowFormData) => Promise<void>;
  updateApprovalFlow: (userId: string, flowId: string, data: Partial<ApprovalFlowFormData>) => Promise<void>;
  deleteApprovalFlow: (userId: string, flowId: string) => Promise<void>;
  selectFlow: (flow: ApprovalFlow | null) => void;

  // Actions - Public Holidays
  fetchPublicHolidays: (year?: number) => void;
  createPublicHoliday: (userId: string, data: PublicHolidayFormData) => Promise<void>;
  updatePublicHoliday: (userId: string, holidayId: string, data: Partial<PublicHolidayFormData>) => Promise<void>;
  deletePublicHoliday: (userId: string, holidayId: string) => Promise<void>;
  importPublicHolidays: (userId: string, year: number, holidays: PublicHolidayFormData[]) => Promise<void>;

  // Actions - Eligibility Rules
  fetchEligibilityRules: () => void;
  getRulesByLeaveType: (leaveType: string) => EligibilityRule[];
  createEligibilityRule: (userId: string, data: EligibilityRuleFormData) => Promise<void>;
  updateEligibilityRule: (userId: string, ruleId: string, data: Partial<EligibilityRuleFormData>) => Promise<void>;
  deleteEligibilityRule: (userId: string, ruleId: string) => Promise<void>;

  // Actions - System Settings
  updateSystemSettings: (userId: string, settings: Partial<LeaveConfigState['systemSettings']>) => Promise<void>;

  // Actions - Validation
  validatePolicyChange: (data: LeavePolicyFormData) => ConfigValidationResult;
  validateWorkflowChange: (data: ApprovalFlowFormData) => ConfigValidationResult;

  // Actions - Audit Log
  fetchChangeLog: (filters?: { changeType?: string; startDate?: string; endDate?: string }) => ConfigChangeLog[];
  addChangeLog: (log: Omit<ConfigChangeLog, 'id' | 'changedAt'>) => void;

  // Utilities
  resetToDefaults: (userId: string) => Promise<void>;
  exportConfiguration: () => string; // Export as JSON
  importConfiguration: (userId: string, jsonData: string) => Promise<void>;
}

/**
 * Generate unique policy ID
 */
function generatePolicyId(): string {
  return `POLICY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Generate unique flow ID
 */
function generateFlowId(): string {
  return `FLOW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Generate unique holiday ID
 */
function generateHolidayId(year: number): string {
  const count = mockPublicHolidays.filter(h => h.year === year).length + 1;
  return `PH-${year}-${String(count).padStart(3, '0')}`;
}

/**
 * Generate unique rule ID
 */
function generateRuleId(): string {
  return `RULE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Generate unique change log ID
 */
function generateChangeLogId(): string {
  return `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

/**
 * Leave Configuration Store
 */
export const useLeaveConfigStore = create<LeaveConfigState>()(
  persist(
    (set, get) => ({
      // Initial State - Policies
      policies: mockLeavePolicies,
      selectedPolicy: null,

      // Initial State - Workflows
      approvalFlows: mockApprovalFlows,
      selectedFlow: null,

      // Initial State - Public Holidays
      publicHolidays: mockPublicHolidays,
      publicHolidays2025: mockPublicHolidays2025,
      publicHolidays2026: mockPublicHolidays2026,

      // Initial State - Eligibility Rules
      eligibilityRules: mockEligibilityRules,

      // Initial State - System Settings
      systemSettings: {
        fiscalYearStartMonth: 1, // January
        defaultWorkweekDays: [1, 2, 3, 4, 5], // Monday to Friday
        enableLeaveCarryForward: true,
        carryForwardDeadlineMonth: 3, // March (Q1 end)
        enableLeaveEncashment: false, // Zimbabwe Labour Act doesn't mandate encashment
        enableLeaveAdvanceBooking: true,
        advanceBookingMaxMonths: 12,
        enableAutomaticAccrual: true,
        accrualRunDayOfMonth: 1, // First day of month
        enableEmailNotifications: true,
        enableSMSNotifications: false,
        requireAttachmentsForSickLeave: true,
        sickLeaveAttachmentThresholdDays: 3, // Medical cert required after 3 days per s14(4)
      },

      // Initial State - UI
      loading: false,
      saving: false,
      error: null,
      changeLog: [],

      // ==================== ACTIONS - POLICIES ====================

      fetchPolicies: () => {
        set({ loading: true, error: null });
        try {
          // In real app, this would fetch from API
          // For now, policies are already loaded from mock
          set({ loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch policies',
          });
        }
      },

      getPolicyById: (id: string) => {
        return get().policies.find((p) => p.id === id);
      },

      getPolicyByType: (leaveType: string) => {
        return get().policies.find((p) => p.leaveType === leaveType);
      },

      createPolicy: async (userId: string, data: LeavePolicyFormData) => {
        set({ saving: true, error: null });
        try {
          // Validate
          const validation = get().validatePolicyChange(data);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          // Check for duplicate leave type
          const existing = get().getPolicyByType(data.leaveType);
          if (existing) {
            throw new Error(`Policy for leave type "${data.leaveType}" already exists`);
          }

          const newPolicy: LeavePolicy = {
            id: generatePolicyId(),
            leaveType: data.leaveType as any,
            displayName: data.displayName,
            description: data.description,
            isStatutory: data.isStatutory,
            statutoryReference: data.statutoryReference,
            isPaid: data.isPaid,
            payStatus: data.payStatus,
            accrualMethod: data.accrualMethod,
            annualEntitlementDays: data.annualEntitlementDays,
            maxAccumulationDays: data.maxAccumulationDays,
            requiresMinimumService: data.requiresMinimumService,
            minimumServiceDays: data.minimumServiceDays,
            requiresDocumentation: data.requiresDocumentation,
            documentationMandatory: data.documentationMandatory,
            requiresManagerApproval: data.requiresManagerApproval,
            requiresHRApproval: data.requiresHRApproval,
            countsWeekendsInLeave: data.countsWeekendsInLeave,
            countsPublicHolidaysInLeave: data.countsPublicHolidaysInLeave,
            allowCarryForward: data.allowCarryForward,
            carryForwardMaxDays: data.carryForwardMaxDays,
            payoutOnTermination: data.payoutOnTermination,
            minimumNoticeDays: data.minimumNoticeDays,
            isActive: data.isActive,
            createdAt: new Date().toISOString(),
            createdBy: userId,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
          };

          set((state) => ({
            policies: [...state.policies, newPolicy],
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'policy',
            entityId: newPolicy.id,
            entityName: newPolicy.displayName,
            action: 'create',
            changedBy: userId,
            changesSummary: `Created new leave policy: ${newPolicy.displayName}`,
            newValue: newPolicy,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to create policy',
          });
          throw error;
        }
      },

      updatePolicy: async (userId: string, policyId: string, data: Partial<LeavePolicyFormData>) => {
        set({ saving: true, error: null });
        try {
          const policy = get().getPolicyById(policyId);
          if (!policy) {
            throw new Error('Policy not found');
          }

          const updatedPolicy: LeavePolicy = {
            ...policy,
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
          };

          set((state) => ({
            policies: state.policies.map((p) => (p.id === policyId ? updatedPolicy : p)),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'policy',
            entityId: policyId,
            entityName: updatedPolicy.displayName,
            action: 'update',
            changedBy: userId,
            changesSummary: `Updated leave policy: ${updatedPolicy.displayName}`,
            previousValue: policy,
            newValue: updatedPolicy,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to update policy',
          });
          throw error;
        }
      },

      deletePolicy: async (userId: string, policyId: string) => {
        set({ saving: true, error: null });
        try {
          const policy = get().getPolicyById(policyId);
          if (!policy) {
            throw new Error('Policy not found');
          }

          // Check if policy is statutory - cannot delete statutory policies
          if (policy.isStatutory) {
            throw new Error('Cannot delete statutory leave policies. Deactivate instead.');
          }

          set((state) => ({
            policies: state.policies.filter((p) => p.id !== policyId),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'policy',
            entityId: policyId,
            entityName: policy.displayName,
            action: 'delete',
            changedBy: userId,
            changesSummary: `Deleted leave policy: ${policy.displayName}`,
            previousValue: policy,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to delete policy',
          });
          throw error;
        }
      },

      activatePolicy: async (userId: string, policyId: string) => {
        set({ saving: true, error: null });
        try {
          const policy = get().getPolicyById(policyId);
          if (!policy) {
            throw new Error('Policy not found');
          }

          set((state) => ({
            policies: state.policies.map((p) =>
              p.id === policyId
                ? { ...p, isActive: true, updatedAt: new Date().toISOString(), updatedBy: userId }
                : p
            ),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'policy',
            entityId: policyId,
            entityName: policy.displayName,
            action: 'activate',
            changedBy: userId,
            changesSummary: `Activated leave policy: ${policy.displayName}`,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to activate policy',
          });
          throw error;
        }
      },

      deactivatePolicy: async (userId: string, policyId: string) => {
        set({ saving: true, error: null });
        try {
          const policy = get().getPolicyById(policyId);
          if (!policy) {
            throw new Error('Policy not found');
          }

          set((state) => ({
            policies: state.policies.map((p) =>
              p.id === policyId
                ? { ...p, isActive: false, updatedAt: new Date().toISOString(), updatedBy: userId }
                : p
            ),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'policy',
            entityId: policyId,
            entityName: policy.displayName,
            action: 'deactivate',
            changedBy: userId,
            changesSummary: `Deactivated leave policy: ${policy.displayName}`,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to deactivate policy',
          });
          throw error;
        }
      },

      selectPolicy: (policy: LeavePolicy | null) => {
        set({ selectedPolicy: policy });
      },

      // ==================== ACTIONS - WORKFLOWS ====================

      fetchApprovalFlows: () => {
        set({ loading: true, error: null });
        try {
          // In real app, this would fetch from API
          set({ loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch approval flows',
          });
        }
      },

      getApprovalFlowByType: (leaveType: string) => {
        return get().approvalFlows.find((f) => f.leaveType === leaveType);
      },

      createApprovalFlow: async (userId: string, data: ApprovalFlowFormData) => {
        set({ saving: true, error: null });
        try {
          // Validate
          const validation = get().validateWorkflowChange(data);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          // Check for duplicate
          const existing = get().getApprovalFlowByType(data.leaveType);
          if (existing) {
            throw new Error(`Approval flow for leave type "${data.leaveType}" already exists`);
          }

          const newFlow: ApprovalFlow = {
            id: generateFlowId(),
            leaveType: data.leaveType as any,
            displayName: data.displayName,
            description: data.description,
            stages: data.stages.map((stage, index) => ({
              stageOrder: index + 1,
              stageName: stage.stageName,
              approverRole: stage.approverRole,
              isRequired: stage.isRequired,
              allowDelegation: stage.allowDelegation,
              autoEscalationHours: stage.autoEscalationHours,
              escalateToRole: stage.escalateToRole,
            })),
            isActive: data.isActive,
            createdAt: new Date().toISOString(),
            createdBy: userId,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
          };

          set((state) => ({
            approvalFlows: [...state.approvalFlows, newFlow],
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'workflow',
            entityId: newFlow.id,
            entityName: newFlow.displayName,
            action: 'create',
            changedBy: userId,
            changesSummary: `Created new approval workflow: ${newFlow.displayName}`,
            newValue: newFlow,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to create approval flow',
          });
          throw error;
        }
      },

      updateApprovalFlow: async (userId: string, flowId: string, data: Partial<ApprovalFlowFormData>) => {
        set({ saving: true, error: null });
        try {
          const flow = get().approvalFlows.find((f) => f.id === flowId);
          if (!flow) {
            throw new Error('Approval flow not found');
          }

          const updatedFlow: ApprovalFlow = {
            ...flow,
            ...data,
            updatedAt: new Date().toISOString(),
            updatedBy: userId,
          };

          set((state) => ({
            approvalFlows: state.approvalFlows.map((f) => (f.id === flowId ? updatedFlow : f)),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'workflow',
            entityId: flowId,
            entityName: updatedFlow.displayName,
            action: 'update',
            changedBy: userId,
            changesSummary: `Updated approval workflow: ${updatedFlow.displayName}`,
            previousValue: flow,
            newValue: updatedFlow,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to update approval flow',
          });
          throw error;
        }
      },

      deleteApprovalFlow: async (userId: string, flowId: string) => {
        set({ saving: true, error: null });
        try {
          const flow = get().approvalFlows.find((f) => f.id === flowId);
          if (!flow) {
            throw new Error('Approval flow not found');
          }

          set((state) => ({
            approvalFlows: state.approvalFlows.filter((f) => f.id !== flowId),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'workflow',
            entityId: flowId,
            entityName: flow.displayName,
            action: 'delete',
            changedBy: userId,
            changesSummary: `Deleted approval workflow: ${flow.displayName}`,
            previousValue: flow,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to delete approval flow',
          });
          throw error;
        }
      },

      selectFlow: (flow: ApprovalFlow | null) => {
        set({ selectedFlow: flow });
      },

      // ==================== ACTIONS - PUBLIC HOLIDAYS ====================

      fetchPublicHolidays: (year?: number) => {
        set({ loading: true, error: null });
        try {
          if (year) {
            // Filter by year if specified
            const filtered = get().publicHolidays.filter((h) => h.year === year);
            set({ loading: false });
          } else {
            // Already loaded from mock
            set({ loading: false });
          }
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch public holidays',
          });
        }
      },

      createPublicHoliday: async (userId: string, data: PublicHolidayFormData) => {
        set({ saving: true, error: null });
        try {
          // Check for duplicate date
          const existing = get().publicHolidays.find((h) => h.date === data.date);
          if (existing) {
            throw new Error(`A public holiday already exists for ${data.date}`);
          }

          const newHoliday: PublicHoliday = {
            id: generateHolidayId(data.year),
            date: data.date,
            name: data.name,
            year: data.year,
            isRecurring: data.isRecurring,
            affectsLeaveCalculation: data.affectsLeaveCalculation,
            notes: data.notes,
          };

          set((state) => ({
            publicHolidays: [...state.publicHolidays, newHoliday].sort((a, b) => a.date.localeCompare(b.date)),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'holiday',
            entityId: newHoliday.id,
            entityName: newHoliday.name,
            action: 'create',
            changedBy: userId,
            changesSummary: `Added public holiday: ${newHoliday.name} on ${newHoliday.date}`,
            newValue: newHoliday,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to create public holiday',
          });
          throw error;
        }
      },

      updatePublicHoliday: async (userId: string, holidayId: string, data: Partial<PublicHolidayFormData>) => {
        set({ saving: true, error: null });
        try {
          const holiday = get().publicHolidays.find((h) => h.id === holidayId);
          if (!holiday) {
            throw new Error('Public holiday not found');
          }

          const updatedHoliday: PublicHoliday = {
            ...holiday,
            ...data,
          };

          set((state) => ({
            publicHolidays: state.publicHolidays
              .map((h) => (h.id === holidayId ? updatedHoliday : h))
              .sort((a, b) => a.date.localeCompare(b.date)),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'holiday',
            entityId: holidayId,
            entityName: updatedHoliday.name,
            action: 'update',
            changedBy: userId,
            changesSummary: `Updated public holiday: ${updatedHoliday.name}`,
            previousValue: holiday,
            newValue: updatedHoliday,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to update public holiday',
          });
          throw error;
        }
      },

      deletePublicHoliday: async (userId: string, holidayId: string) => {
        set({ saving: true, error: null });
        try {
          const holiday = get().publicHolidays.find((h) => h.id === holidayId);
          if (!holiday) {
            throw new Error('Public holiday not found');
          }

          set((state) => ({
            publicHolidays: state.publicHolidays.filter((h) => h.id !== holidayId),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'holiday',
            entityId: holidayId,
            entityName: holiday.name,
            action: 'delete',
            changedBy: userId,
            changesSummary: `Deleted public holiday: ${holiday.name} on ${holiday.date}`,
            previousValue: holiday,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to delete public holiday',
          });
          throw error;
        }
      },

      importPublicHolidays: async (userId: string, year: number, holidays: PublicHolidayFormData[]) => {
        set({ saving: true, error: null });
        try {
          const newHolidays: PublicHoliday[] = holidays.map((data, index) => ({
            id: `PH-${year}-${String(index + 1).padStart(3, '0')}`,
            date: data.date,
            name: data.name,
            year: data.year,
            isRecurring: data.isRecurring,
            affectsLeaveCalculation: data.affectsLeaveCalculation,
            notes: data.notes,
          }));

          // Remove existing holidays for this year
          set((state) => ({
            publicHolidays: [
              ...state.publicHolidays.filter((h) => h.year !== year),
              ...newHolidays,
            ].sort((a, b) => a.date.localeCompare(b.date)),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'holiday',
            entityId: `IMPORT-${year}`,
            entityName: `${year} Public Holidays`,
            action: 'create',
            changedBy: userId,
            changesSummary: `Imported ${newHolidays.length} public holidays for ${year}`,
            newValue: newHolidays,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to import public holidays',
          });
          throw error;
        }
      },

      // ==================== ACTIONS - ELIGIBILITY RULES ====================

      fetchEligibilityRules: () => {
        set({ loading: true, error: null });
        try {
          // Already loaded from mock
          set({ loading: false });
        } catch (error) {
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch eligibility rules',
          });
        }
      },

      getRulesByLeaveType: (leaveType: string) => {
        return get().eligibilityRules.filter((r) => r.leaveType === leaveType && r.isActive);
      },

      createEligibilityRule: async (userId: string, data: EligibilityRuleFormData) => {
        set({ saving: true, error: null });
        try {
          const newRule: EligibilityRule = {
            id: generateRuleId(),
            leaveType: data.leaveType as any,
            ruleName: data.ruleName,
            description: data.description,
            minimumServiceDays: data.minimumServiceDays,
            maximumServiceDays: data.maximumServiceDays,
            restrictedToGender: data.restrictedToGender,
            restrictedToJobGrades: data.restrictedToJobGrades,
            restrictedToDepartments: data.restrictedToDepartments,
            restrictedToEmploymentTypes: data.restrictedToEmploymentTypes,
            maximumOccurrences: data.maximumOccurrences,
            occurrencePeriod: data.occurrencePeriod,
            requiresSpecificConditions: data.requiresSpecificConditions,
            isActive: data.isActive,
            createdAt: new Date().toISOString(),
            createdBy: userId,
          };

          set((state) => ({
            eligibilityRules: [...state.eligibilityRules, newRule],
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'eligibility',
            entityId: newRule.id,
            entityName: newRule.ruleName,
            action: 'create',
            changedBy: userId,
            changesSummary: `Created eligibility rule: ${newRule.ruleName}`,
            newValue: newRule,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to create eligibility rule',
          });
          throw error;
        }
      },

      updateEligibilityRule: async (userId: string, ruleId: string, data: Partial<EligibilityRuleFormData>) => {
        set({ saving: true, error: null });
        try {
          const rule = get().eligibilityRules.find((r) => r.id === ruleId);
          if (!rule) {
            throw new Error('Eligibility rule not found');
          }

          const updatedRule: EligibilityRule = {
            ...rule,
            ...data,
          };

          set((state) => ({
            eligibilityRules: state.eligibilityRules.map((r) => (r.id === ruleId ? updatedRule : r)),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'eligibility',
            entityId: ruleId,
            entityName: updatedRule.ruleName,
            action: 'update',
            changedBy: userId,
            changesSummary: `Updated eligibility rule: ${updatedRule.ruleName}`,
            previousValue: rule,
            newValue: updatedRule,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to update eligibility rule',
          });
          throw error;
        }
      },

      deleteEligibilityRule: async (userId: string, ruleId: string) => {
        set({ saving: true, error: null });
        try {
          const rule = get().eligibilityRules.find((r) => r.id === ruleId);
          if (!rule) {
            throw new Error('Eligibility rule not found');
          }

          set((state) => ({
            eligibilityRules: state.eligibilityRules.filter((r) => r.id !== ruleId),
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'eligibility',
            entityId: ruleId,
            entityName: rule.ruleName,
            action: 'delete',
            changedBy: userId,
            changesSummary: `Deleted eligibility rule: ${rule.ruleName}`,
            previousValue: rule,
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to delete eligibility rule',
          });
          throw error;
        }
      },

      // ==================== ACTIONS - SYSTEM SETTINGS ====================

      updateSystemSettings: async (userId: string, settings: Partial<LeaveConfigState['systemSettings']>) => {
        set({ saving: true, error: null });
        try {
          const previousSettings = get().systemSettings;

          set((state) => ({
            systemSettings: {
              ...state.systemSettings,
              ...settings,
            },
            saving: false,
          }));

          // Log change
          get().addChangeLog({
            changeType: 'setting',
            entityId: 'SYSTEM-SETTINGS',
            entityName: 'System Settings',
            action: 'update',
            changedBy: userId,
            changesSummary: 'Updated system-wide leave settings',
            previousValue: previousSettings,
            newValue: { ...previousSettings, ...settings },
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to update system settings',
          });
          throw error;
        }
      },

      // ==================== ACTIONS - VALIDATION ====================

      validatePolicyChange: (data: LeavePolicyFormData): ConfigValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Required fields
        if (!data.leaveType) errors.push('Leave type is required');
        if (!data.displayName) errors.push('Display name is required');
        if (!data.accrualMethod) errors.push('Accrual method is required');

        // Accrual validation
        if (data.accrualMethod !== 'none' && !data.annualEntitlementDays) {
          errors.push('Annual entitlement days is required when accrual method is not "none"');
        }

        // Service requirement validation
        if (data.requiresMinimumService && !data.minimumServiceDays) {
          errors.push('Minimum service days is required when minimum service is required');
        }

        // Carryforward validation
        if (data.allowCarryForward && !data.carryForwardMaxDays) {
          warnings.push('No carryforward limit set - unlimited carryforward may not be compliant');
        }

        // Statutory compliance warnings
        if (data.isStatutory && !data.statutoryReference) {
          warnings.push('Statutory reference should be provided for statutory leave types');
        }

        // Annual leave specific (s14A compliance)
        if (data.leaveType === 'annual') {
          if (data.annualEntitlementDays && data.annualEntitlementDays < 30) {
            errors.push('Annual leave must be at least 30 days per s14A Labour Act');
          }
          if (!data.countsWeekendsInLeave || !data.countsPublicHolidaysInLeave) {
            errors.push('Annual leave must include weekends and public holidays per s14A(3)');
          }
          if (data.maxAccumulationDays && data.maxAccumulationDays > 90) {
            warnings.push('Maximum accumulation exceeds 90 days - verify compliance with s14A');
          }
        }

        // Sick leave specific (s14 compliance)
        if (data.leaveType === 'sick') {
          if (data.annualEntitlementDays && data.annualEntitlementDays < 90) {
            errors.push('Sick leave must be at least 90 days per s14 Labour Act');
          }
        }

        // Maternity leave specific (s18 + 2023 amendment)
        if (data.leaveType === 'maternity') {
          if (data.annualEntitlementDays !== 98) {
            errors.push('Maternity leave must be 98 days per s18 Labour Act (2023 amendment)');
          }
          if (data.requiresMinimumService) {
            errors.push('Maternity leave cannot have minimum service requirement (2023 amendment removed qualifier)');
          }
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      },

      validateWorkflowChange: (data: ApprovalFlowFormData): ConfigValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Required fields
        if (!data.leaveType) errors.push('Leave type is required');
        if (!data.displayName) errors.push('Display name is required');
        if (!data.stages || data.stages.length === 0) {
          errors.push('At least one approval stage is required');
        }

        // Validate stages
        if (data.stages) {
          data.stages.forEach((stage, index) => {
            if (!stage.stageName) errors.push(`Stage ${index + 1}: Stage name is required`);
            if (!stage.approverRole) errors.push(`Stage ${index + 1}: Approver role is required`);

            if (stage.autoEscalationHours && stage.autoEscalationHours < 1) {
              errors.push(`Stage ${index + 1}: Auto-escalation hours must be at least 1 hour`);
            }

            if (stage.autoEscalationHours && !stage.escalateToRole) {
              errors.push(`Stage ${index + 1}: Escalation role is required when auto-escalation is enabled`);
            }
          });

          // Warn if too many stages
          if (data.stages.length > 4) {
            warnings.push('More than 4 approval stages may cause delays. Consider streamlining the workflow.');
          }
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings,
        };
      },

      // ==================== ACTIONS - AUDIT LOG ====================

      fetchChangeLog: (filters?: { changeType?: string; startDate?: string; endDate?: string }) => {
        let logs = get().changeLog;

        if (filters) {
          if (filters.changeType) {
            logs = logs.filter((log) => log.changeType === filters.changeType);
          }
          if (filters.startDate) {
            logs = logs.filter((log) => log.changedAt >= filters.startDate!);
          }
          if (filters.endDate) {
            logs = logs.filter((log) => log.changedAt <= filters.endDate!);
          }
        }

        return logs.sort((a, b) => b.changedAt.localeCompare(a.changedAt));
      },

      addChangeLog: (log: Omit<ConfigChangeLog, 'id' | 'changedAt'>) => {
        const newLog: ConfigChangeLog = {
          ...log,
          id: generateChangeLogId(),
          changedAt: new Date().toISOString(),
        };

        set((state) => ({
          changeLog: [newLog, ...state.changeLog],
        }));
      },

      // ==================== UTILITIES ====================

      resetToDefaults: async (userId: string) => {
        set({ saving: true, error: null });
        try {
          set({
            policies: mockLeavePolicies,
            approvalFlows: mockApprovalFlows,
            publicHolidays: mockPublicHolidays,
            eligibilityRules: mockEligibilityRules,
            saving: false,
          });

          // Log change
          get().addChangeLog({
            changeType: 'setting',
            entityId: 'RESET',
            entityName: 'System Reset',
            action: 'update',
            changedBy: userId,
            changesSummary: 'Reset all configuration to default values',
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to reset to defaults',
          });
          throw error;
        }
      },

      exportConfiguration: () => {
        const config = {
          policies: get().policies,
          approvalFlows: get().approvalFlows,
          publicHolidays: get().publicHolidays,
          eligibilityRules: get().eligibilityRules,
          systemSettings: get().systemSettings,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        };

        return JSON.stringify(config, null, 2);
      },

      importConfiguration: async (userId: string, jsonData: string) => {
        set({ saving: true, error: null });
        try {
          const config = JSON.parse(jsonData);

          // Validate structure
          if (!config.policies || !config.approvalFlows || !config.systemSettings) {
            throw new Error('Invalid configuration format');
          }

          set({
            policies: config.policies,
            approvalFlows: config.approvalFlows,
            publicHolidays: config.publicHolidays || get().publicHolidays,
            eligibilityRules: config.eligibilityRules || get().eligibilityRules,
            systemSettings: config.systemSettings,
            saving: false,
          });

          // Log change
          get().addChangeLog({
            changeType: 'setting',
            entityId: 'IMPORT',
            entityName: 'Configuration Import',
            action: 'update',
            changedBy: userId,
            changesSummary: 'Imported configuration from JSON file',
          });
        } catch (error) {
          set({
            saving: false,
            error: error instanceof Error ? error.message : 'Failed to import configuration',
          });
          throw error;
        }
      },
    }),
    {
      name: 'leave-config-storage',
      partialize: (state) => ({
        // Persist configuration changes
        policies: state.policies,
        approvalFlows: state.approvalFlows,
        publicHolidays: state.publicHolidays,
        eligibilityRules: state.eligibilityRules,
        systemSettings: state.systemSettings,
        changeLog: state.changeLog,
      }),
    }
  )
);
