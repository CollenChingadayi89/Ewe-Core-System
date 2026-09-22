/**
 * Onboarding API Service
 * Handles new employee onboarding workflows and task tracking
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ChecklistItem {
  id: string;
  category: string;
  task: string;
  responsible: string;
  due_date: string;
  completed: boolean;
  completed_date?: string;
  completed_by?: string;
  notes?: string;
}

export interface EquipmentItem {
  equipment_id?: string;
  description: string;
  serial_number?: string;
  issued_date: string;
  issued_by?: string;
}

export interface AccessItem {
  system: string;
  username: string;
  granted_date: string;
  granted_by?: string;
}

export interface TrainingItem {
  training_name: string;
  completion_date: string;
  trainer: string;
  duration_hours: number;
}

export interface OnboardingListResponse {
  id: string;
  onboarding_number: string;
  employee: string;
  employee_name: string;
  employee_department: string;
  start_date: string;
  expected_completion_date: string;
  actual_completion_date: string | null;
  assigned_buddy: string | null;
  assigned_buddy_name: string | null;
  hr_coordinator: string | null;
  hr_coordinator_name: string | null;
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  status: string;
  status_display: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingDetailResponse extends OnboardingListResponse {
  checklist: ChecklistItem[];
  feedback_30_days: string | null;
  feedback_60_days: string | null;
  feedback_90_days: string | null;
  probation_passed: boolean;
  equipment_issued: EquipmentItem[];
  access_granted: AccessItem[];
  training_completed: TrainingItem[];
  notes: string | null;
}

export interface OnboardingCreateRequest {
  employee: string;
  start_date: string;
  expected_completion_date: string;
  assigned_buddy?: string;
  hr_coordinator?: string;
  checklist?: ChecklistItem[];
  status?: string;
  notes?: string;
}

export interface OnboardingUpdateRequest {
  expected_completion_date?: string;
  actual_completion_date?: string;
  assigned_buddy?: string;
  hr_coordinator?: string;
  checklist?: ChecklistItem[];
  status?: string;
  feedback_30_days?: string;
  feedback_60_days?: string;
  feedback_90_days?: string;
  probation_passed?: boolean;
  equipment_issued?: EquipmentItem[];
  access_granted?: AccessItem[];
  training_completed?: TrainingItem[];
  notes?: string;
}

export interface OnboardingFilters {
  page?: number;
  page_size?: number;
  search?: string;
  employee?: string;
  status?: string;
  hr_coordinator?: string;
  assigned_buddy?: string;
  start_date_after?: string;
  start_date_before?: string;
  ordering?: string;
}

export interface OnboardingStatistics {
  total_onboardings: number;
  in_progress: number;
  completed: number;
  overdue: number;
  average_completion_percentage: number;
  average_completion_time_days: number;
}

export interface CompleteTaskResponse {
  success: boolean;
  message: string;
  onboarding: OnboardingDetailResponse;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const onboardingApi = {
  /**
   * List onboarding records with optional filtering
   */
  list: async (filters?: OnboardingFilters): Promise<PaginatedResponse<OnboardingListResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.employee) params.append('employee', filters.employee);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.hr_coordinator) params.append('hr_coordinator', filters.hr_coordinator);
    if (filters?.assigned_buddy) params.append('assigned_buddy', filters.assigned_buddy);
    if (filters?.start_date_after) params.append('start_date_after', filters.start_date_after);
    if (filters?.start_date_before) params.append('start_date_before', filters.start_date_before);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/onboarding/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single onboarding record by ID
   */
  retrieve: async (id: string): Promise<OnboardingDetailResponse> => {
    const response = await apiClient.get(`/onboarding/${id}/`);
    return response.data;
  },

  /**
   * Create new onboarding record
   */
  create: async (data: OnboardingCreateRequest): Promise<OnboardingDetailResponse> => {
    const response = await apiClient.post('/onboarding/', data);
    return response.data;
  },

  /**
   * Update existing onboarding record
   */
  update: async (id: string, data: OnboardingUpdateRequest): Promise<OnboardingDetailResponse> => {
    const response = await apiClient.put(`/onboarding/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update onboarding record
   */
  partialUpdate: async (id: string, data: Partial<OnboardingUpdateRequest>): Promise<OnboardingDetailResponse> => {
    const response = await apiClient.patch(`/onboarding/${id}/`, data);
    return response.data;
  },

  /**
   * Delete onboarding record
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/onboarding/${id}/`);
  },

  /**
   * Complete a specific task in the checklist
   */
  completeTask: async (
    id: string,
    taskId: string,
    completedBy?: string,
    notes?: string
  ): Promise<CompleteTaskResponse> => {
    const response = await apiClient.post(`/onboarding/${id}/complete_task/`, {
      task_id: taskId,
      completed_by: completedBy,
      notes,
    });
    return response.data;
  },

  /**
   * Get onboarding records for current user (if they are the employee being onboarded)
   */
  myOnboarding: async (): Promise<OnboardingDetailResponse | null> => {
    const response = await apiClient.get('/onboarding/my_onboarding/');
    return response.data;
  },

  /**
   * Get onboarding statistics
   */
  statistics: async (filters?: {
    hr_coordinator?: string;
    start_date_after?: string;
    start_date_before?: string;
  }): Promise<OnboardingStatistics> => {
    const params = new URLSearchParams();
    if (filters?.hr_coordinator) params.append('hr_coordinator', filters.hr_coordinator);
    if (filters?.start_date_after) params.append('start_date_after', filters.start_date_after);
    if (filters?.start_date_before) params.append('start_date_before', filters.start_date_before);

    const response = await apiClient.get(`/onboarding/statistics/?${params.toString()}`);
    return response.data;
  },

  /**
   * Update checklist progress
   */
  updateChecklist: async (id: string, checklist: ChecklistItem[]): Promise<OnboardingDetailResponse> => {
    const response = await apiClient.patch(`/onboarding/${id}/`, {
      checklist,
    });
    return response.data;
  },

  /**
   * Issue equipment to employee
   */
  issueEquipment: async (id: string, equipment: EquipmentItem[]): Promise<OnboardingDetailResponse> => {
    const response = await apiClient.patch(`/onboarding/${id}/`, {
      equipment_issued: equipment,
    });
    return response.data;
  },

  /**
   * Grant system access to employee
   */
  grantAccess: async (id: string, accessItems: AccessItem[]): Promise<OnboardingDetailResponse> => {
    const response = await apiClient.patch(`/onboarding/${id}/`, {
      access_granted: accessItems,
    });
    return response.data;
  },

  /**
   * Record training completion
   */
  recordTraining: async (id: string, training: TrainingItem[]): Promise<OnboardingDetailResponse> => {
    const response = await apiClient.patch(`/onboarding/${id}/`, {
      training_completed: training,
    });
    return response.data;
  },
};
