/**
 * Leave Settings Store
 *
 * Centralized state management for all leave system configurations
 * - Leave types and policies
 * - Working hours and calendar
 * - Public holidays
 * - Notification preferences
 * - Workflow configurations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LeaveTypeConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon: string;
  isStatutory: boolean;
  statutoryReference?: string;
  isActive: boolean;
  isPaid: boolean;

  // Entitlement
  annualEntitlementDays: number;
  accrualMethod: 'monthly' | 'annual' | 'fixed' | 'none';
  monthlyAccrualRate?: number;
  maxAccumulationDays?: number;

  // Eligibility
  requiresMinimumService: boolean;
  minimumServiceDays?: number;
  restrictedToGender?: 'male' | 'female' | 'none';
  availableDuringProbation: boolean;

  // Carryforward
  allowCarryForward: boolean;
  carryForwardMaxDays?: number;
  carryForwardExpiryMonths?: number;
  payoutOnTermination: boolean;

  // Documentation
  requiresDocumentation: boolean;
  documentationType?: string[];
  documentationMandatory: boolean;

  // Notice
  minimumNoticeDays: number;
  minimumNoticeForShortLeave?: number;

  // Other
  countsWeekendsInLeave: boolean;
  countsPublicHolidaysInLeave: boolean;
  supportsHalfDays: boolean;
}

export interface WorkingHoursConfig {
  workdayStart: string;
  workdayEnd: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
  workingDays: number[]; // [1,2,3,4,5] = Mon-Fri
  hoursPerDay: number;
  hoursPerWeek: number;
}

export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD or MM-DD for recurring
  isRecurring: boolean;
  year?: number;
  affectsLeaveCalculation: boolean;
}

export interface NotificationSettings {
  notifyOnSubmission: boolean;
  notifyOnApproval: boolean;
  notifyOnRejection: boolean;
  notifyOnCancellation: boolean;
  notifyBeforeLeaveStarts: boolean;
  reminderDaysBeforeLeave: number;
  escalationReminderDays: number;
  notifyHROnAllRequests: boolean;
  notifyManagerOnTeamLeave: boolean;
  emailNotificationsEnabled: boolean;
  smsNotificationsEnabled: boolean;
}

export interface CalendarSettings {
  defaultView: 'month' | 'week' | 'day';
  weekStartsOn: number; // 0=Sunday, 1=Monday
  showWeekendsOnCalendar: boolean;
  highlightPublicHolidays: boolean;
  showOnlyApprovedLeaves: boolean;
  colorScheme: 'default' | 'colorblind' | 'high-contrast';
  showEmployeePhotos: boolean;
  enableDragAndDrop: boolean;
}

export interface LeaveYearSettings {
  leaveYearType: 'calendar' | 'financial' | 'anniversary';
  calendarYearStart: string;
  financialYearStart?: string;
  autoCarryForward: boolean;
  carryForwardProcessingMonth: string;
  allowNegativeBalance: boolean;
  maxNegativeBalanceDays: number;
  proRateNewJoiners: boolean;
  proRateLeavers: boolean;
}

export interface ApprovalSettings {
  requireManagerApproval: boolean;
  requireHRApproval: boolean;
  allowSelfApproval: boolean;
  allowDelegation: boolean;
  autoEscalateAfterDays: number;
  maxApprovalLevels: number;
  parallelApprovalAllowed: boolean;
}

export interface LeaveSettings {
  // Core configurations
  leaveTypes: LeaveTypeConfig[];
  workingHours: WorkingHoursConfig;
  publicHolidays: PublicHoliday[];
  notificationSettings: NotificationSettings;
  calendarSettings: CalendarSettings;
  leaveYearSettings: LeaveYearSettings;
  approvalSettings: ApprovalSettings;

  // Metadata
  lastUpdated: string;
  updatedBy: string;
}

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface LeaveSettingsStore {
  // State
  settings: LeaveSettings;
  loading: boolean;
  error: string | null;

  // Actions - Leave Types
  addLeaveType: (leaveType: LeaveTypeConfig) => void;
  updateLeaveType: (id: string, updates: Partial<LeaveTypeConfig>) => void;
  deleteLeaveType: (id: string) => void;
  toggleLeaveType: (id: string) => void;
  getLeaveType: (id: string) => LeaveTypeConfig | undefined;

  // Actions - Working Hours
  updateWorkingHours: (workingHours: WorkingHoursConfig) => void;

  // Actions - Public Holidays
  addPublicHoliday: (holiday: PublicHoliday) => void;
  updatePublicHoliday: (id: string, updates: Partial<PublicHoliday>) => void;
  deletePublicHoliday: (id: string) => void;
  importPublicHolidays: (holidays: PublicHoliday[]) => void;

  // Actions - Notifications
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;

  // Actions - Calendar
  updateCalendarSettings: (settings: Partial<CalendarSettings>) => void;

  // Actions - Leave Year
  updateLeaveYearSettings: (settings: Partial<LeaveYearSettings>) => void;

  // Actions - Approval
  updateApprovalSettings: (settings: Partial<ApprovalSettings>) => void;

  // Actions - General
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (json: string) => void;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultSettings: LeaveSettings = {
  leaveTypes: [
    {
      id: 'annual',
      name: 'annual',
      displayName: 'Annual / Vacation Leave',
      description: 'Paid leave for rest and recovery',
      color: '#00d084',
      icon: '🏖️',
      isStatutory: true,
      statutoryReference: 's14A - Labour Act [Chapter 28:01]',
      isActive: true,
      isPaid: true,
      annualEntitlementDays: 30,
      accrualMethod: 'monthly',
      monthlyAccrualRate: 2.5,
      maxAccumulationDays: 90,
      requiresMinimumService: true,
      minimumServiceDays: 365,
      restrictedToGender: 'none',
      availableDuringProbation: false,
      allowCarryForward: true,
      carryForwardMaxDays: 90,
      payoutOnTermination: true,
      requiresDocumentation: false,
      documentationMandatory: false,
      minimumNoticeDays: 14,
      minimumNoticeForShortLeave: 3,
      countsWeekendsInLeave: true,
      countsPublicHolidaysInLeave: true,
      supportsHalfDays: true,
    },
    {
      id: 'sick',
      name: 'sick',
      displayName: 'Sick Leave',
      description: '90 days full pay + 90 days half pay per year',
      color: '#ff6900',
      icon: '🤒',
      isStatutory: true,
      statutoryReference: 's14 - Labour Act [Chapter 28:01]',
      isActive: true,
      isPaid: true,
      annualEntitlementDays: 90,
      accrualMethod: 'none',
      maxAccumulationDays: 180,
      requiresMinimumService: false,
      availableDuringProbation: true,
      restrictedToGender: 'none',
      allowCarryForward: false,
      payoutOnTermination: false,
      requiresDocumentation: true,
      documentationType: ['medical-certificate'],
      documentationMandatory: true,
      minimumNoticeDays: 0,
      countsWeekendsInLeave: false,
      countsPublicHolidaysInLeave: false,
      supportsHalfDays: true,
    },
    {
      id: 'maternity',
      name: 'maternity',
      displayName: 'Maternity Leave',
      description: '98 days full pay (no minimum service required)',
      color: '#ec4899',
      icon: '🤱',
      isStatutory: true,
      statutoryReference: 's18 - Labour Act [Chapter 28:01], as amended 2023',
      isActive: true,
      isPaid: true,
      annualEntitlementDays: 98,
      accrualMethod: 'fixed',
      requiresMinimumService: false,
      restrictedToGender: 'female',
      availableDuringProbation: true,
      allowCarryForward: false,
      payoutOnTermination: false,
      requiresDocumentation: true,
      documentationType: ['medical-certificate'],
      documentationMandatory: true,
      minimumNoticeDays: 30,
      countsWeekendsInLeave: true,
      countsPublicHolidaysInLeave: true,
      supportsHalfDays: false,
    },
    {
      id: 'paternity',
      name: 'paternity',
      displayName: 'Paternity Leave',
      description: '5 working days paid leave (proposed)',
      color: '#3b82f6',
      icon: '👶',
      isStatutory: false,
      isActive: true,
      isPaid: true,
      annualEntitlementDays: 5,
      accrualMethod: 'fixed',
      requiresMinimumService: true,
      minimumServiceDays: 180,
      restrictedToGender: 'male',
      availableDuringProbation: false,
      allowCarryForward: false,
      payoutOnTermination: false,
      requiresDocumentation: true,
      documentationType: ['birth-certificate'],
      documentationMandatory: true,
      minimumNoticeDays: 7,
      countsWeekendsInLeave: false,
      countsPublicHolidaysInLeave: false,
      supportsHalfDays: false,
    },
    {
      id: 'special',
      name: 'special',
      displayName: 'Special / Compassionate Leave',
      description: 'Up to 12 days per year for statutory triggers',
      color: '#8b5cf6',
      icon: '⭐',
      isStatutory: true,
      statutoryReference: 's14B - Labour Act [Chapter 28:01]',
      isActive: true,
      isPaid: true,
      annualEntitlementDays: 12,
      accrualMethod: 'annual',
      requiresMinimumService: false,
      availableDuringProbation: true,
      restrictedToGender: 'none',
      allowCarryForward: false,
      payoutOnTermination: false,
      requiresDocumentation: true,
      documentationType: ['supporting-documents'],
      documentationMandatory: false,
      minimumNoticeDays: 0,
      countsWeekendsInLeave: false,
      countsPublicHolidaysInLeave: false,
      supportsHalfDays: true,
    },
    {
      id: 'study',
      name: 'study',
      displayName: 'Study / Educational Leave',
      description: 'Educational development leave (proposed)',
      color: '#0693e3',
      icon: '📚',
      isStatutory: false,
      isActive: true,
      isPaid: true,
      annualEntitlementDays: 10,
      accrualMethod: 'annual',
      requiresMinimumService: true,
      minimumServiceDays: 365,
      availableDuringProbation: false,
      restrictedToGender: 'none',
      allowCarryForward: false,
      payoutOnTermination: false,
      requiresDocumentation: true,
      documentationType: ['course-enrollment', 'exam-schedule'],
      documentationMandatory: true,
      minimumNoticeDays: 30,
      countsWeekendsInLeave: false,
      countsPublicHolidaysInLeave: false,
      supportsHalfDays: true,
    },
    {
      id: 'unpaid',
      name: 'unpaid',
      displayName: 'Unpaid Leave',
      description: 'Leave without pay',
      color: '#8c8c8c',
      icon: '💼',
      isStatutory: false,
      isActive: true,
      isPaid: false,
      annualEntitlementDays: 999,
      accrualMethod: 'none',
      requiresMinimumService: false,
      availableDuringProbation: true,
      restrictedToGender: 'none',
      allowCarryForward: false,
      payoutOnTermination: false,
      requiresDocumentation: false,
      documentationMandatory: false,
      minimumNoticeDays: 7,
      countsWeekendsInLeave: true,
      countsPublicHolidaysInLeave: true,
      supportsHalfDays: false,
    },
  ],

  workingHours: {
    workdayStart: '08:00',
    workdayEnd: '17:00',
    lunchBreakStart: '13:00',
    lunchBreakEnd: '14:00',
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    hoursPerDay: 8,
    hoursPerWeek: 40,
  },

  publicHolidays: [
    { id: '1', name: 'New Year\'s Day', date: '01-01', isRecurring: true, affectsLeaveCalculation: true },
    { id: '2', name: 'Independence Day', date: '04-18', isRecurring: true, affectsLeaveCalculation: true },
    { id: '3', name: 'Workers\' Day', date: '05-01', isRecurring: true, affectsLeaveCalculation: true },
    { id: '4', name: 'Africa Day', date: '05-25', isRecurring: true, affectsLeaveCalculation: true },
    { id: '5', name: 'Heroes\' Day', date: '08-11', isRecurring: true, affectsLeaveCalculation: true },
    { id: '6', name: 'Defence Forces Day', date: '08-12', isRecurring: true, affectsLeaveCalculation: true },
    { id: '7', name: 'Unity Day', date: '12-22', isRecurring: true, affectsLeaveCalculation: true },
    { id: '8', name: 'Christmas Day', date: '12-25', isRecurring: true, affectsLeaveCalculation: true },
    { id: '9', name: 'Boxing Day', date: '12-26', isRecurring: true, affectsLeaveCalculation: true },
  ],

  notificationSettings: {
    notifyOnSubmission: true,
    notifyOnApproval: true,
    notifyOnRejection: true,
    notifyOnCancellation: true,
    notifyBeforeLeaveStarts: true,
    reminderDaysBeforeLeave: 3,
    escalationReminderDays: 2,
    notifyHROnAllRequests: true,
    notifyManagerOnTeamLeave: true,
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
  },

  calendarSettings: {
    defaultView: 'month',
    weekStartsOn: 1, // Monday
    showWeekendsOnCalendar: true,
    highlightPublicHolidays: true,
    showOnlyApprovedLeaves: false,
    colorScheme: 'default',
    showEmployeePhotos: true,
    enableDragAndDrop: false,
  },

  leaveYearSettings: {
    leaveYearType: 'financial',
    calendarYearStart: '01-01',
    financialYearStart: '04-01', // Zimbabwe financial year
    autoCarryForward: true,
    carryForwardProcessingMonth: '04',
    allowNegativeBalance: false,
    maxNegativeBalanceDays: 0,
    proRateNewJoiners: true,
    proRateLeavers: true,
  },

  approvalSettings: {
    requireManagerApproval: true,
    requireHRApproval: false,
    allowSelfApproval: false,
    allowDelegation: true,
    autoEscalateAfterDays: 3,
    maxApprovalLevels: 3,
    parallelApprovalAllowed: false,
  },

  lastUpdated: new Date().toISOString(),
  updatedBy: 'SYSTEM',
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useLeaveSettingsStore = create<LeaveSettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      loading: false,
      error: null,

      // Leave Types
      addLeaveType: (leaveType) => {
        set((state) => ({
          settings: {
            ...state.settings,
            leaveTypes: [...state.settings.leaveTypes, leaveType],
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      updateLeaveType: (id, updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            leaveTypes: state.settings.leaveTypes.map((lt) =>
              lt.id === id ? { ...lt, ...updates } : lt
            ),
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      deleteLeaveType: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            leaveTypes: state.settings.leaveTypes.filter((lt) => lt.id !== id),
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      toggleLeaveType: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            leaveTypes: state.settings.leaveTypes.map((lt) =>
              lt.id === id ? { ...lt, isActive: !lt.isActive } : lt
            ),
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      getLeaveType: (id) => {
        return get().settings.leaveTypes.find((lt) => lt.id === id);
      },

      // Working Hours
      updateWorkingHours: (workingHours) => {
        set((state) => ({
          settings: {
            ...state.settings,
            workingHours,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      // Public Holidays
      addPublicHoliday: (holiday) => {
        set((state) => ({
          settings: {
            ...state.settings,
            publicHolidays: [...state.settings.publicHolidays, holiday],
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      updatePublicHoliday: (id, updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            publicHolidays: state.settings.publicHolidays.map((h) =>
              h.id === id ? { ...h, ...updates } : h
            ),
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      deletePublicHoliday: (id) => {
        set((state) => ({
          settings: {
            ...state.settings,
            publicHolidays: state.settings.publicHolidays.filter((h) => h.id !== id),
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      importPublicHolidays: (holidays) => {
        set((state) => ({
          settings: {
            ...state.settings,
            publicHolidays: holidays,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      // Notifications
      updateNotificationSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            notificationSettings: {
              ...state.settings.notificationSettings,
              ...settings,
            },
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      // Calendar
      updateCalendarSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            calendarSettings: {
              ...state.settings.calendarSettings,
              ...settings,
            },
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      // Leave Year
      updateLeaveYearSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            leaveYearSettings: {
              ...state.settings.leaveYearSettings,
              ...settings,
            },
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      // Approval
      updateApprovalSettings: (settings) => {
        set((state) => ({
          settings: {
            ...state.settings,
            approvalSettings: {
              ...state.settings.approvalSettings,
              ...settings,
            },
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      // General
      resetToDefaults: () => {
        set({ settings: defaultSettings });
      },

      exportSettings: () => {
        return JSON.stringify(get().settings, null, 2);
      },

      importSettings: (json) => {
        try {
          const imported = JSON.parse(json);
          set({ settings: imported });
        } catch (error) {
          set({ error: 'Failed to import settings. Invalid JSON format.' });
        }
      },
    }),
    {
      name: 'leave-settings-storage',
    }
  )
);
