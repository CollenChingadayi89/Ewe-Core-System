/**
 * Finance Settings API Service
 * Handles approval groups and workflows for Finance module
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES - Approval Groups
// ============================================================================

export interface ApprovalGroupMember {
  id: string;
  approval_group: string;
  employee: string;
  employee_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
    department: string;
    department_name: string | null;
    role: string;
    is_active: boolean;
  };
  role: 'member' | 'lead' | 'admin';
  is_active: boolean;
  joined_at: string;
}

export interface ApprovalGroupList {
  id: string;
  code: string;
  name: string;
  description: string;
  group_type: string;
  group_type_display: string;
  category: string;
  category_display: string;
  department: string | null;
  department_name: string | null;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface ApprovalGroupDetail extends ApprovalGroupList {
  members_detail: ApprovalGroupMember[];
  created_by: string | null;
  modified_by: string | null;
}

export interface ApprovalGroupCreateRequest {
  code?: string;  // Optional - will be auto-generated if not provided
  name: string;
  description?: string;
  group_type?: 'department' | 'role' | 'custom' | 'project';  // Optional - defaults to 'custom'
  category?: 'finance';  // Always finance for this API
  department?: string;
  is_active?: boolean;
}

export interface AddMemberRequest {
  employee_id: string;
  role?: 'member' | 'lead' | 'admin';
}

export interface UpdateMemberRoleRequest {
  employee_id: string;
  role: 'member' | 'lead' | 'admin';
}

// ============================================================================
// TYPES - Workflows
// ============================================================================

export interface WorkflowStage {
  stage_number: number;
  stage_name: string;
  approver_type: 'position' | 'specific' | 'department_head' | 'role' | 'group';
  approver_position?: string;
  approver_employee_ids?: string[];
  approver_group_id?: string;
  approval_logic: 'any' | 'all';
  is_required?: boolean;
  auto_approve_conditions?: any;
  action_type?: 'approve' | 'review' | 'certify' | 'recommend';
}

export interface WorkflowList {
  id: string;
  workflow_name: string;
  description: string;
  workflow_type: string;
  workflow_type_display: string;
  is_active: boolean;
  stage_count: number;
  require_sequential: boolean;
  allow_parallel_approval: boolean;
  escalation_enabled: boolean;
  escalation_hours: number | null;
  applicable_group_codes: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowDetail extends WorkflowList {
  stages: WorkflowStage[];
  applicable_groups_detail: ApprovalGroupList[];
  conditions: Record<string, any>;
  escalation_action: Record<string, any>;
  created_by: string | null;
  modified_by: string | null;
}

export interface WorkflowCreateRequest {
  workflow_name: string;
  description?: string;
  workflow_type: 'petty_cash' | 'payable' | 'receivable' | 'expense' | 'procurement';
  stages: WorkflowStage[];
  applicable_group_ids?: string[];
  conditions?: Record<string, any>;
  is_active?: boolean;
  allow_parallel_approval?: boolean;
  require_sequential?: boolean;
  escalation_enabled?: boolean;
  escalation_hours?: number;
  escalation_action?: Record<string, any>;
}

export interface EmployeeSummary {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  department: string | null;
  department_name: string | null;
  role: string;
  is_active: boolean;
}

export interface EmployeeWithGroup {
  employee_id: string;
  employee_number: string;
  employee_name: string;
  department: string | null;
  group_id: string | null;
  group_code: string | null;
  group_name: string | null;
  role: 'member' | 'lead' | 'admin' | null;
}

// ============================================================================
// API FUNCTIONS - Approval Groups
// ============================================================================

export const financeApprovalGroupsApi = {
  /**
   * List all finance approval groups
   */
  list: async (): Promise<ApprovalGroupList[]> => {
    const response = await apiClient.get('/finance-approval-groups/');
    return response.data;
  },

  /**
   * Get single approval group by ID
   */
  retrieve: async (id: string): Promise<ApprovalGroupDetail> => {
    const response = await apiClient.get(`/finance-approval-groups/${id}/`);
    return response.data;
  },

  /**
   * Create new finance approval group
   */
  create: async (data: ApprovalGroupCreateRequest): Promise<ApprovalGroupDetail> => {
    const response = await apiClient.post('/finance-approval-groups/', { ...data, category: 'finance' });
    return response.data;
  },

  /**
   * Update existing approval group
   */
  update: async (id: string, data: Partial<ApprovalGroupCreateRequest>): Promise<ApprovalGroupDetail> => {
    const response = await apiClient.put(`/finance-approval-groups/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update approval group
   */
  partialUpdate: async (id: string, data: Partial<ApprovalGroupCreateRequest>): Promise<ApprovalGroupDetail> => {
    const response = await apiClient.patch(`/finance-approval-groups/${id}/`, data);
    return response.data;
  },

  /**
   * Delete approval group
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance-approval-groups/${id}/`);
  },

  /**
   * Add member to approval group
   */
  addMember: async (groupId: string, data: AddMemberRequest): Promise<ApprovalGroupDetail> => {
    const response = await apiClient.post(`/finance-approval-groups/${groupId}/add-member/`, data);
    return response.data.group;
  },

  /**
   * Remove member from approval group
   */
  removeMember: async (groupId: string, employeeId: string): Promise<ApprovalGroupDetail> => {
    const response = await apiClient.post(`/finance-approval-groups/${groupId}/remove-member/`, {
      employee_id: employeeId
    });
    return response.data.group;
  },

  /**
   * Update member role in approval group
   */
  updateMemberRole: async (groupId: string, data: UpdateMemberRoleRequest): Promise<ApprovalGroupMember> => {
    const response = await apiClient.patch(`/finance-approval-groups/${groupId}/update-member-role/`, data);
    return response.data.membership;
  },

  /**
   * Get list of available employees who can be added to groups
   */
  availableEmployees: async (departmentId?: string): Promise<EmployeeSummary[]> => {
    const params = new URLSearchParams();
    if (departmentId) params.append('department', departmentId);

    const response = await apiClient.get(`/finance-approval-groups/available-employees/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get all employees with their current finance approval group assignments
   * Used for drag-and-drop member management
   */
  getEmployeeGroups: async (): Promise<EmployeeWithGroup[]> => {
    const response = await apiClient.get('/finance-approval-groups/employee-groups/');
    return response.data;
  },
};

// ============================================================================
// API FUNCTIONS - Finance Workflows
// ============================================================================

export const financeWorkflowsApi = {
  /**
   * List all finance workflows
   */
  list: async (): Promise<WorkflowList[]> => {
    const response = await apiClient.get('/finance-workflows/');
    return response.data;
  },

  /**
   * Get workflows grouped by type
   */
  byType: async (): Promise<Record<string, WorkflowList[]>> => {
    const response = await apiClient.get('/finance-workflows/by-type/');
    return response.data;
  },

  /**
   * Get single workflow by ID
   */
  retrieve: async (id: string): Promise<WorkflowDetail> => {
    const response = await apiClient.get(`/finance-workflows/${id}/`);
    return response.data;
  },

  /**
   * Create new finance workflow
   */
  create: async (data: WorkflowCreateRequest): Promise<WorkflowDetail> => {
    const response = await apiClient.post('/finance-workflows/', data);
    return response.data;
  },

  /**
   * Update existing workflow
   */
  update: async (id: string, data: Partial<WorkflowCreateRequest>): Promise<WorkflowDetail> => {
    const response = await apiClient.put(`/finance-workflows/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update workflow
   */
  partialUpdate: async (id: string, data: Partial<WorkflowCreateRequest>): Promise<WorkflowDetail> => {
    const response = await apiClient.patch(`/finance-workflows/${id}/`, data);
    return response.data;
  },

  /**
   * Delete workflow
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/finance-workflows/${id}/`);
  },

  /**
   * Duplicate an existing workflow
   */
  duplicate: async (id: string, newName: string): Promise<WorkflowDetail> => {
    const response = await apiClient.post(`/finance-workflows/${id}/duplicate/`, {
      workflow_name: newName
    });
    return response.data.workflow;
  },

  /**
   * Toggle workflow active status
   */
  toggleActive: async (id: string): Promise<{ is_active: boolean }> => {
    const response = await apiClient.post(`/finance-workflows/${id}/toggle-active/`);
    return response.data;
  },
};
