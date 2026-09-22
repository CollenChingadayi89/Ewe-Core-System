/**
 * Petty Cash API Service
 * Handles petty cash disbursement requests
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface PettyCashListResponse {
  id: string;
  petty_cash_number: string;
  employee: string;
  employee_name: string;
  employee_number: string;
  employee_department: string;
  amount: number;
  currency: string;
  currency_display: string;
  purpose: string;
  category: string;
  category_display: string;
  justification: string | null;
  receipt_expected: boolean;
  account_code: string | null;
  request_date: string;
  required_by_date: string | null;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PettyCashDetailResponse extends PettyCashListResponse {
  rejection_reason: string | null;
  disbursed_by: string | null;
  disbursed_by_name: string | null;
  disbursed_date: string | null;
  receipt_number: string | null;
  notes: string | null;
}

export interface PettyCashCreateRequest {
  amount: number;
  currency?: string;
  purpose: string;
  category: string;
  justification?: string;
  receipt_expected?: boolean;
  account_code?: string;
  required_by_date?: string;
  status?: string;
  priority?: string;
  notes?: string;
}

export interface PettyCashFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  category?: string;
  employee?: string;
  approved_by?: string;
  priority?: string;
  request_date_after?: string;
  request_date_before?: string;
  ordering?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const pettyCashApi = {
  /**
   * List petty cash requests with optional filtering
   */
  list: async (filters?: PettyCashFilters): Promise<PaginatedResponse<PettyCashListResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.employee) params.append('employee', filters.employee);
    if (filters?.approved_by) params.append('approved_by', filters.approved_by);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.request_date_after) params.append('request_date_after', filters.request_date_after);
    if (filters?.request_date_before) params.append('request_date_before', filters.request_date_before);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/petty-cash/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single petty cash request by ID
   */
  retrieve: async (id: string): Promise<PettyCashDetailResponse> => {
    const response = await apiClient.get(`/petty-cash/${id}/`);
    return response.data;
  },

  /**
   * Create new petty cash request
   */
  create: async (data: PettyCashCreateRequest): Promise<PettyCashDetailResponse> => {
    const response = await apiClient.post('/petty-cash/', data);
    return response.data;
  },

  /**
   * Update existing petty cash request
   */
  update: async (id: string, data: Partial<PettyCashCreateRequest>): Promise<PettyCashDetailResponse> => {
    const response = await apiClient.put(`/petty-cash/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update petty cash request
   */
  partialUpdate: async (id: string, data: Partial<PettyCashCreateRequest>): Promise<PettyCashDetailResponse> => {
    const response = await apiClient.patch(`/petty-cash/${id}/`, data);
    return response.data;
  },

  /**
   * Delete petty cash request
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/petty-cash/${id}/`);
  },
};
