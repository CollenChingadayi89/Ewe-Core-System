/**
 * Leave Management API Service
 * Handles leave policies, requests, transactions, holidays, and working hours
 */

import { get, post, put, patch, del } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPE DEFINITIONS - LEAVE POLICY
// ============================================================================

export interface LeavePolicyResponse {
  id: string;
  code: string;
  leave_type: string;
  display_name: string;
  description: string | null;
  // Statutory
  is_statutory: boolean;
  statutory_reference: string | null;
  // Payment
  is_paid: boolean;
  pay_status: string;
  // Accrual
  accrual_method: string;
  annual_entitlement_days: string;
  days_per_year: string;
  max_accumulation_days: string | null;
  // Eligibility
  requires_minimum_service: boolean;
  minimum_service_days: number;
  available_during_probation: boolean;
  // Documentation
  requires_documentation: boolean;
  documentation_types: string[];
  documentation_mandatory: boolean;
  // Approval
  requires_manager_approval: boolean;
  requires_hr_approval: boolean;
  requires_ceo_approval: boolean;
  approval_levels: number;
  auto_escalate_after_days: number;
  allow_delegation: boolean;
  allow_self_approval: boolean;
  // Calculation
  counts_weekends_in_leave: boolean;
  counts_public_holidays_in_leave: boolean;
  // Carryforward
  allow_carry_forward: boolean;
  carry_forward_max_days: string | null;
  expires_at_year_end: boolean;
  payout_on_termination: boolean;
  // Notice
  minimum_notice_days: number;
  minimum_notice_for_short_leave: number;
  // Additional
  supports_half_days: boolean;
  can_be_converted_from: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPE DEFINITIONS - LEAVE TRANSACTION (READ-ONLY)
// ============================================================================

export interface LeaveTransactionResponse {
  id: number;
  transaction_number: string;
  employee: string;
  employee_name: string;
  employee_number: string;
  leave_policy: string;
  leave_type_name: string;
  transaction_type: string;
  transaction_date: string;
  days: string;
  balance_after: string;
  leave_request: string | null;
  reference_number: string | null;
  notes: string | null;
  processed_by: string;
  processed_by_name: string;
  created_at: string;
}

// ============================================================================
// TYPE DEFINITIONS - LEAVE REQUEST
// ============================================================================

export interface LeaveRequestListResponse {
  id: string;
  request_number: string;
  employee: string;
  employee_name: string;
  employee_number: string;
  leave_policy: string;
  leave_type: string;
  leave_type_name: string;
  start_date: string;
  end_date: string;
  total_days: string;
  working_days_count: string;
  is_half_day: boolean;
  status: string;
  priority: string;
  current_approver: string | null;
  current_approver_name: string | null;
  is_emergency_leave: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequestDetailResponse extends LeaveRequestListResponse {
  employee_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    department: string;
    designation: string;
    email: string;
  };
  leave_policy_details: {
    id: string;
    code: string;
    leave_type: string;
    display_name: string;
    is_paid: boolean;
    pay_status: string;
    requires_documentation: boolean;
  };
  reason: string;
  special_leave_trigger: string | null;
  attachments: string[];
  handover_notes: string | null;
  documentation_provided: boolean;
  balance_before_request: string | null;
  balance_after_approval: string | null;
  approval_chain: any[];
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  cancellation_details: {
    cancelled_at: string;
    cancelled_by: string;
    cancellation_reason: string;
  } | null;
  created_by: string;
  modified_by: string | null;
  transactions: LeaveTransactionResponse[];
}

export interface LeaveRequestCreateRequest {
  employee: string;
  leave_policy: string;
  start_date: string;
  end_date: string;
  is_half_day?: boolean;
  reason: string;
  special_leave_trigger?: string;
  attachments?: string[];
  handover_notes?: string;
  is_emergency_leave?: boolean;
  documentation_provided?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

// ============================================================================
// TYPE DEFINITIONS - PUBLIC HOLIDAY
// ============================================================================

export interface PublicHolidayResponse {
  id: number;
  name: string;
  date: string;
  is_recurring: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPE DEFINITIONS - WORKING HOURS
// ============================================================================

export interface WorkingHoursResponse {
  id: number;
  name: string;
  monday_working: boolean;
  tuesday_working: boolean;
  wednesday_working: boolean;
  thursday_working: boolean;
  friday_working: boolean;
  saturday_working: boolean;
  sunday_working: boolean;
  work_start_time: string;
  work_end_time: string;
  lunch_break_duration: number;
  total_work_hours_per_day: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPE DEFINITIONS - CUSTOM ACTION RESPONSES
// ============================================================================

export interface CalculateWorkingDaysRequest {
  start_date: string;
  end_date: string;
  leave_policy_id: string;
  is_half_day?: boolean;
}

export interface CalculateWorkingDaysResponse {
  start_date: string;
  end_date: string;
  total_days: number;
  working_days: number;
  weekends_excluded: number;
  public_holidays_excluded: number;
  policy_counts_weekends: boolean;
  policy_counts_holidays: boolean;
}

export interface ApproveRejectRequest {
  notes?: string;
}

export interface CancelRequest {
  reason: string;
}

// ============================================================================
// API FUNCTIONS - LEAVE POLICIES
// ============================================================================

export const leavePolicyApi = {
  /**
   * List all leave policies
   */
  list: async (params?: {
    page?: number;
    search?: string;
    is_active?: boolean;
    leave_type?: string;
    is_statutory?: boolean;
    is_paid?: boolean;
    ordering?: string;
  }): Promise<PaginatedResponse<LeavePolicyResponse>> => {
    const response = await get<PaginatedResponse<LeavePolicyResponse>>('/leave-policies/', { params });
    return response.data;
  },

  /**
   * Get leave policy details
   */
  retrieve: async (id: string): Promise<LeavePolicyResponse> => {
    const response = await get<LeavePolicyResponse>(`/hr/leave-policies/${id}/`);
    return response.data;
  },

  /**
   * Create new leave policy (HR only)
   */
  create: async (data: Partial<LeavePolicyResponse>): Promise<LeavePolicyResponse> => {
    const response = await post<LeavePolicyResponse>('/leave-policies/', data);
    return response.data;
  },

  /**
   * Update leave policy (HR only)
   */
  update: async (id: string, data: Partial<LeavePolicyResponse>): Promise<LeavePolicyResponse> => {
    const response = await put<LeavePolicyResponse>(`/hr/leave-policies/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update leave policy (HR only)
   */
  partialUpdate: async (id: string, data: Partial<LeavePolicyResponse>): Promise<LeavePolicyResponse> => {
    const response = await patch<LeavePolicyResponse>(`/hr/leave-policies/${id}/`, data);
    return response.data;
  },

  /**
   * Delete leave policy (HR only)
   */
  delete: async (id: string): Promise<void> => {
    await del(`/hr/leave-policies/${id}/`);
  },
};

// ============================================================================
// API FUNCTIONS - LEAVE TRANSACTIONS (READ-ONLY)
// ============================================================================

export const leaveTransactionApi = {
  /**
   * List leave transactions (immutable ledger)
   */
  list: async (params?: {
    page?: number;
    search?: string;
    employee?: string;
    leave_policy?: string;
    transaction_type?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<LeaveTransactionResponse>> => {
    const response = await get<PaginatedResponse<LeaveTransactionResponse>>('/leave-transactions/', { params });
    return response.data;
  },

  /**
   * Get transaction details
   */
  retrieve: async (id: number): Promise<LeaveTransactionResponse> => {
    const response = await get<LeaveTransactionResponse>(`/hr/leave-transactions/${id}/`);
    return response.data;
  },
};

// ============================================================================
// API FUNCTIONS - LEAVE REQUESTS
// ============================================================================

export const leaveRequestApi = {
  /**
   * List leave requests
   */
  list: async (params?: {
    page?: number;
    search?: string;
    employee?: string;
    leave_policy?: string;
    status?: string;
    priority?: string;
    is_emergency_leave?: boolean;
    is_half_day?: boolean;
    current_approver?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<LeaveRequestListResponse>> => {
    const response = await get<PaginatedResponse<LeaveRequestListResponse>>('/leave-requests/', { params });
    return response.data;
  },

  /**
   * Get detailed leave request
   */
  retrieve: async (id: string): Promise<LeaveRequestDetailResponse> => {
    const response = await get<LeaveRequestDetailResponse>(`/hr/leave-requests/${id}/`);
    return response.data;
  },

  /**
   * Create new leave request
   */
  create: async (data: LeaveRequestCreateRequest): Promise<LeaveRequestDetailResponse> => {
    const response = await post<LeaveRequestDetailResponse>('/leave-requests/', data);
    return response.data;
  },

  /**
   * Update leave request (draft only)
   */
  update: async (id: string, data: LeaveRequestCreateRequest): Promise<LeaveRequestDetailResponse> => {
    const response = await put<LeaveRequestDetailResponse>(`/hr/leave-requests/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update leave request
   */
  partialUpdate: async (id: string, data: Partial<LeaveRequestCreateRequest>): Promise<LeaveRequestDetailResponse> => {
    const response = await patch<LeaveRequestDetailResponse>(`/hr/leave-requests/${id}/`, data);
    return response.data;
  },

  /**
   * Delete leave request (draft only)
   */
  delete: async (id: string): Promise<void> => {
    await del(`/hr/leave-requests/${id}/`);
  },

  // ============================================================================
  // CUSTOM ACTIONS
  // ============================================================================

  /**
   * Approve a leave request
   * Creates immutable ledger transaction to deduct leave balance
   */
  approve: async (id: string, data?: ApproveRejectRequest): Promise<LeaveRequestDetailResponse> => {
    const response = await post<LeaveRequestDetailResponse>(`/hr/leave-requests/${id}/approve/`, data || {});
    return response.data;
  },

  /**
   * Reject a leave request
   */
  reject: async (id: string, data?: ApproveRejectRequest): Promise<LeaveRequestDetailResponse> => {
    const response = await post<LeaveRequestDetailResponse>(`/hr/leave-requests/${id}/reject/`, data || {});
    return response.data;
  },

  /**
   * Cancel a leave request
   * If already approved, creates reversal transaction to restore balance
   */
  cancel: async (id: string, data: CancelRequest): Promise<LeaveRequestDetailResponse> => {
    const response = await post<LeaveRequestDetailResponse>(`/hr/leave-requests/${id}/cancel/`, data);
    return response.data;
  },

  /**
   * Calculate working days for a date range
   * Utility endpoint for frontend form validation
   */
  calculateWorkingDays: async (data: CalculateWorkingDaysRequest): Promise<CalculateWorkingDaysResponse> => {
    const response = await post<CalculateWorkingDaysResponse>('/hr/leave-requests/calculate-working-days/', data);
    return response.data;
  },
};

// ============================================================================
// API FUNCTIONS - PUBLIC HOLIDAYS
// ============================================================================

export const publicHolidayApi = {
  /**
   * List public holidays
   */
  list: async (params?: {
    page?: number;
    search?: string;
    is_active?: boolean;
    is_recurring?: boolean;
    ordering?: string;
  }): Promise<PaginatedResponse<PublicHolidayResponse>> => {
    const response = await get<PaginatedResponse<PublicHolidayResponse>>('/public-holidays/', { params });
    return response.data;
  },

  /**
   * Get holiday details
   */
  retrieve: async (id: number): Promise<PublicHolidayResponse> => {
    const response = await get<PublicHolidayResponse>(`/hr/public-holidays/${id}/`);
    return response.data;
  },

  /**
   * Create public holiday (HR only)
   */
  create: async (data: Partial<PublicHolidayResponse>): Promise<PublicHolidayResponse> => {
    const response = await post<PublicHolidayResponse>('/public-holidays/', data);
    return response.data;
  },

  /**
   * Update public holiday (HR only)
   */
  update: async (id: number, data: Partial<PublicHolidayResponse>): Promise<PublicHolidayResponse> => {
    const response = await put<PublicHolidayResponse>(`/hr/public-holidays/${id}/`, data);
    return response.data;
  },

  /**
   * Delete public holiday (HR only)
   */
  delete: async (id: number): Promise<void> => {
    await del(`/hr/public-holidays/${id}/`);
  },
};

// ============================================================================
// API FUNCTIONS - WORKING HOURS
// ============================================================================

export const workingHoursApi = {
  /**
   * List working hours configurations
   */
  list: async (params?: {
    page?: number;
    search?: string;
    is_active?: boolean;
    is_default?: boolean;
    ordering?: string;
  }): Promise<PaginatedResponse<WorkingHoursResponse>> => {
    const response = await get<PaginatedResponse<WorkingHoursResponse>>('/working-hours/', { params });
    return response.data;
  },

  /**
   * Get working hours details
   */
  retrieve: async (id: number): Promise<WorkingHoursResponse> => {
    const response = await get<WorkingHoursResponse>(`/hr/working-hours/${id}/`);
    return response.data;
  },

  /**
   * Create working hours configuration (HR only)
   */
  create: async (data: Partial<WorkingHoursResponse>): Promise<WorkingHoursResponse> => {
    const response = await post<WorkingHoursResponse>('/working-hours/', data);
    return response.data;
  },

  /**
   * Update working hours configuration (HR only)
   */
  update: async (id: number, data: Partial<WorkingHoursResponse>): Promise<WorkingHoursResponse> => {
    const response = await put<WorkingHoursResponse>(`/hr/working-hours/${id}/`, data);
    return response.data;
  },

  /**
   * Delete working hours configuration (HR only)
   */
  delete: async (id: number): Promise<void> => {
    await del(`/hr/working-hours/${id}/`);
  },
};
