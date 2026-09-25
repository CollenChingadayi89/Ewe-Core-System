/**
 * Approval System API Service
 * Handles approval workflows, requests, and steps
 */

import { get, post, put, patch, del } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPE DEFINITIONS - APPROVAL WORKFLOW
// ============================================================================

export interface ApprovalWorkflowResponse {
  id: string;
  workflow_name: string;
  description: string | null;
  workflow_type: string;
  stages: Array<{
    stage_number: number;
    stage_name: string;
    approver_type: 'position' | 'specific' | 'department_head' | 'role';
    approver_position: string | null;
    approver_employee_ids: string[];
    approval_logic: 'any' | 'all';
    is_required: boolean;
    auto_approve_conditions: Record<string, any> | null;
    /** verify | certify | recommend | approve | pay | review (defaults to approve) */
    action_type?: string;
    target_status?: string;
  }>;
  conditions: Record<string, any>;
  is_active: boolean;
  allow_parallel_approval: boolean;
  require_sequential: boolean;
  escalation_enabled: boolean;
  escalation_hours: number | null;
  escalation_action: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPE DEFINITIONS - APPROVAL REQUEST
// ============================================================================

export interface ApprovalRequestListResponse {
  id: string;
  request_number: string;
  workflow: string | null;
  content_type: number;
  object_id: string;
  requester: string;
  current_stage: number;
  current_approver: string | null;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submitted_date: string;
  due_date: string | null;
  final_approval_date: string | null;
  rejection_date: string | null;
  request_summary: string;
  amount: string | null;
  rejection_reason: string | null;
  rejected_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequestDetailResponse extends ApprovalRequestListResponse {
  workflow_details: ApprovalWorkflowResponse | null;
  requester_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    department: string;
    designation: string;
    email: string;
  };
  current_approver_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    department: string;
    designation: string;
    email: string;
  } | null;
  rejected_by_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
  approval_steps: ApprovalStepResponse[];
  content_object_details?: {
    type?: string;
    amount?: number;
    currency?: string;
    date?: string;
    [key: string]: any;
  };
}

export interface ApprovalRequestCreateRequest {
  workflow?: string;
  content_type: number;
  object_id: string;
  requester: string;
  request_summary: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  amount?: number;
  metadata?: Record<string, any>;
}

// ============================================================================
// TYPE DEFINITIONS - APPROVAL STEP
// ============================================================================

export interface ApprovalStepResponse {
  id: number;
  approval_request: string;
  stage_number: number;
  stage_name: string;
  approver: string;
  approver_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  decision_date: string | null;
  comments: string | null;
  is_escalated: boolean;
  escalated_at: string | null;
  escalated_to: string | null;
  escalated_to_name: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPE DEFINITIONS - CUSTOM ACTIONS
// ============================================================================

export interface ApproveRequest {
  comments?: string;
}

export interface RejectRequest {
  comments: string;
}

export interface CancelRequest {
  reason: string;
}

export interface EscalateRequest {
  escalate_to: string;
  reason?: string;
}

// ============================================================================
// API FUNCTIONS - APPROVAL WORKFLOWS
// ============================================================================

export const approvalWorkflowApi = {
  /**
   * List all approval workflows
   */
  list: async (params?: {
    page?: number;
    search?: string;
    workflow_type?: string;
    is_active?: boolean;
    ordering?: string;
  }): Promise<PaginatedResponse<ApprovalWorkflowResponse>> => {
    const response = await get<PaginatedResponse<ApprovalWorkflowResponse>>('/approval-workflows/', { params });
    return response.data;
  },

  /**
   * Get workflow details
   */
  retrieve: async (id: string): Promise<ApprovalWorkflowResponse> => {
    const response = await get<ApprovalWorkflowResponse>(`/approval-workflows/${id}/`);
    return response.data;
  },

  /**
   * Create new workflow (Admin only)
   */
  create: async (data: Partial<ApprovalWorkflowResponse>): Promise<ApprovalWorkflowResponse> => {
    const response = await post<ApprovalWorkflowResponse>('/approval-workflows/', data);
    return response.data;
  },

  /**
   * Update workflow (Admin only)
   */
  update: async (id: string, data: Partial<ApprovalWorkflowResponse>): Promise<ApprovalWorkflowResponse> => {
    const response = await put<ApprovalWorkflowResponse>(`/approval-workflows/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update workflow (Admin only)
   */
  partialUpdate: async (id: string, data: Partial<ApprovalWorkflowResponse>): Promise<ApprovalWorkflowResponse> => {
    const response = await patch<ApprovalWorkflowResponse>(`/approval-workflows/${id}/`, data);
    return response.data;
  },

  /**
   * Delete workflow (Admin only)
   */
  delete: async (id: string): Promise<void> => {
    await del(`/approval-workflows/${id}/`);
  },
};

// ============================================================================
// API FUNCTIONS - APPROVAL REQUESTS
// ============================================================================

export const approvalRequestApi = {
  /**
   * List approval requests
   */
  list: async (params?: {
    page?: number;
    search?: string;
    requester?: string;
    current_approver?: string;
    status?: string;
    priority?: string;
    workflow?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<ApprovalRequestListResponse>> => {
    const response = await get<PaginatedResponse<ApprovalRequestListResponse>>('/approval-requests/', { params });
    return response.data;
  },

  /**
   * Get detailed approval request
   */
  retrieve: async (id: string): Promise<ApprovalRequestDetailResponse> => {
    const response = await get<ApprovalRequestDetailResponse>(`/approval-requests/${id}/`);
    return response.data;
  },

  /**
   * Create new approval request
   */
  create: async (data: ApprovalRequestCreateRequest): Promise<ApprovalRequestDetailResponse> => {
    const response = await post<ApprovalRequestDetailResponse>('/approval-requests/', data);
    return response.data;
  },

  /**
   * Update approval request
   */
  update: async (id: string, data: ApprovalRequestCreateRequest): Promise<ApprovalRequestDetailResponse> => {
    const response = await put<ApprovalRequestDetailResponse>(`/approval-requests/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update approval request
   */
  partialUpdate: async (id: string, data: Partial<ApprovalRequestCreateRequest>): Promise<ApprovalRequestDetailResponse> => {
    const response = await patch<ApprovalRequestDetailResponse>(`/approval-requests/${id}/`, data);
    return response.data;
  },

  /**
   * Delete approval request
   */
  delete: async (id: string): Promise<void> => {
    await del(`/approval-requests/${id}/`);
  },

  // ============================================================================
  // CUSTOM ACTIONS
  // ============================================================================

  /**
   * Approve an approval request
   * Moves to next stage or marks as approved if final stage
   */
  approve: async (id: string, data?: ApproveRequest): Promise<ApprovalRequestDetailResponse> => {
    const response = await post<ApprovalRequestDetailResponse>(`/approval-requests/${id}/approve/`, data || {});
    return response.data;
  },

  /**
   * Reject an approval request
   */
  reject: async (id: string, data: RejectRequest): Promise<ApprovalRequestDetailResponse> => {
    const response = await post<ApprovalRequestDetailResponse>(`/approval-requests/${id}/reject/`, data);
    return response.data;
  },

  /**
   * Cancel an approval request
   */
  cancel: async (id: string, data: CancelRequest): Promise<ApprovalRequestDetailResponse> => {
    const response = await post<ApprovalRequestDetailResponse>(`/approval-requests/${id}/cancel/`, data);
    return response.data;
  },

  /**
   * Escalate an approval request
   */
  escalate: async (id: string, data: EscalateRequest): Promise<ApprovalRequestDetailResponse> => {
    const response = await post<ApprovalRequestDetailResponse>(`/approval-requests/${id}/escalate/`, data);
    return response.data;
  },
};

// ============================================================================
// API FUNCTIONS - APPROVAL STEPS
// ============================================================================

export const approvalStepApi = {
  /**
   * List approval steps
   */
  list: async (params?: {
    page?: number;
    approval_request?: string;
    approver?: string;
    status?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<ApprovalStepResponse>> => {
    const response = await get<PaginatedResponse<ApprovalStepResponse>>('/approval-steps/', { params });
    return response.data;
  },

  /**
   * Get step details
   */
  retrieve: async (id: number): Promise<ApprovalStepResponse> => {
    const response = await get<ApprovalStepResponse>(`/approval-steps/${id}/`);
    return response.data;
  },
};

// ============================================================================
// TYPE DEFINITIONS - NOTIFICATIONS
// ============================================================================

export interface NotificationResponse {
  id: string;
  recipient: string;
  notification_type: 'approval_required' | 'approved' | 'rejected' | 'cancelled' | 'escalated' | 'stage_advanced' | 'request_created' | 'reminder';
  title: string;
  message: string;
  approval_request: string | null;
  is_read: boolean;
  read_at: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action_url: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API FUNCTIONS - NOTIFICATIONS
// ============================================================================

export const notificationApi = {
  /**
   * List notifications for current user
   */
  list: async (params?: {
    page?: number;
    notification_type?: string;
    is_read?: boolean;
    priority?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<NotificationResponse>> => {
    const response = await get<PaginatedResponse<NotificationResponse>>('/approval-notifications/', { params });
    return response.data;
  },

  /**
   * Get notification details
   */
  retrieve: async (id: string): Promise<NotificationResponse> => {
    const response = await get<NotificationResponse>(`/approval-notifications/${id}/`);
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markAsRead: async (id: string): Promise<NotificationResponse> => {
    const response = await post<NotificationResponse>(`/approval-notifications/${id}/mark-read/`, {});
    return response.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    const response = await post<{ message: string; count: number }>('/approval-notifications/mark-all-read/', {});
    return response.data;
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await get<{ unread_count: number }>('/approval-notifications/unread-count/');
    return response.data;
  },

  /**
   * Delete notification
   */
  delete: async (id: string): Promise<void> => {
    await del(`/approval-notifications/${id}/`);
  },
};
