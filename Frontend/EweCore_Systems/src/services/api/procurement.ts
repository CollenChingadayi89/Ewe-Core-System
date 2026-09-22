/**
 * Procurement API Service
 * Handles procurement/purchase requests
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ProcurementListResponse {
  id: string;
  request_number: string;
  requested_by: string;
  requested_by_name: string;
  requested_by_department: string;
  vendor: string | null;
  vendor_name: string | null;
  item_description: string;
  category: string;
  category_display: string;
  quantity: number;
  unit_price: number | null;
  total_amount: number;
  currency: string;
  request_date: string;
  required_by_date: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  current_approver: string | null;
  current_approver_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcurementDetailResponse extends ProcurementListResponse {
  business_justification: string;
  budget_code: string | null;
  approval_chain: any[];
  approved_by: string | null;
  approved_by_name: string | null;
  approved_date: string | null;
  rejection_reason: string | null;
  po_number: string | null;
  ordered_date: string | null;
  received_date: string | null;
  attachments: string[];
  notes: string | null;
}

export interface ProcurementCreateRequest {
  vendor?: string;
  item_description: string;
  category: string;
  quantity?: number;
  unit_price?: number;
  total_amount: number;
  currency?: string;
  business_justification: string;
  budget_code?: string;
  required_by_date: string;
  status?: string;
  priority?: string;
  attachments?: string[];
  notes?: string;
}

export interface ProcurementFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  category?: string;
  requested_by?: string;
  current_approver?: string;
  priority?: string;
  vendor?: string;
  request_date_after?: string;
  request_date_before?: string;
  required_by_date_after?: string;
  required_by_date_before?: string;
  ordering?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const procurementApi = {
  /**
   * List procurement requests with optional filtering
   */
  list: async (filters?: ProcurementFilters): Promise<PaginatedResponse<ProcurementListResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.requested_by) params.append('requested_by', filters.requested_by);
    if (filters?.current_approver) params.append('current_approver', filters.current_approver);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.vendor) params.append('vendor', filters.vendor);
    if (filters?.request_date_after) params.append('request_date_after', filters.request_date_after);
    if (filters?.request_date_before) params.append('request_date_before', filters.request_date_before);
    if (filters?.required_by_date_after) params.append('required_by_date_after', filters.required_by_date_after);
    if (filters?.required_by_date_before) params.append('required_by_date_before', filters.required_by_date_before);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/procurement-requests/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single procurement request by ID
   */
  retrieve: async (id: string): Promise<ProcurementDetailResponse> => {
    const response = await apiClient.get(`/procurement-requests/${id}/`);
    return response.data;
  },

  /**
   * Create new procurement request
   */
  create: async (data: ProcurementCreateRequest): Promise<ProcurementDetailResponse> => {
    const response = await apiClient.post('/procurement-requests/', data);
    return response.data;
  },

  /**
   * Update existing procurement request
   */
  update: async (id: string, data: Partial<ProcurementCreateRequest>): Promise<ProcurementDetailResponse> => {
    const response = await apiClient.put(`/procurement-requests/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update procurement request
   */
  partialUpdate: async (id: string, data: Partial<ProcurementCreateRequest>): Promise<ProcurementDetailResponse> => {
    const response = await apiClient.patch(`/procurement-requests/${id}/`, data);
    return response.data;
  },

  /**
   * Delete procurement request
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/procurement-requests/${id}/`);
  },
};
