/**
 * Expense API Service
 * Handles expense reimbursement requests
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface ExpenseListResponse {
  id: string;
  expense_number: string;
  employee: string;
  employee_name: string;
  employee_department: string;
  category: string;
  category_display: string;
  description: string;
  amount: number;
  currency: string;
  expense_date: string;
  submission_date: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  current_approver: string | null;
  current_approver_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseDetailResponse extends ExpenseListResponse {
  receipt_number: string | null;
  attachments: string[];
  approval_chain: any[];
  approved_by: string | null;
  approved_by_name: string | null;
  approved_date: string | null;
  rejection_reason: string | null;
  paid_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  notes: string | null;
}

export interface ExpenseCreateRequest {
  category: string;
  description: string;
  amount: number;
  currency?: string;
  expense_date: string;
  receipt_number?: string;
  attachments?: string[];
  status?: string;
  priority?: string;
  notes?: string;
}

export interface ExpenseFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  category?: string;
  employee?: string;
  current_approver?: string;
  priority?: string;
  expense_date_after?: string;
  expense_date_before?: string;
  ordering?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const expenseApi = {
  /**
   * List expenses with optional filtering
   */
  list: async (filters?: ExpenseFilters): Promise<PaginatedResponse<ExpenseListResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.employee) params.append('employee', filters.employee);
    if (filters?.current_approver) params.append('current_approver', filters.current_approver);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.expense_date_after) params.append('expense_date_after', filters.expense_date_after);
    if (filters?.expense_date_before) params.append('expense_date_before', filters.expense_date_before);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/expenses/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single expense by ID
   */
  retrieve: async (id: string): Promise<ExpenseDetailResponse> => {
    const response = await apiClient.get(`/expenses/${id}/`);
    return response.data;
  },

  /**
   * Create new expense request
   */
  create: async (data: ExpenseCreateRequest): Promise<ExpenseDetailResponse> => {
    const response = await apiClient.post('/expenses/', data);
    return response.data;
  },

  /**
   * Update existing expense
   */
  update: async (id: string, data: Partial<ExpenseCreateRequest>): Promise<ExpenseDetailResponse> => {
    const response = await apiClient.put(`/expenses/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update expense
   */
  partialUpdate: async (id: string, data: Partial<ExpenseCreateRequest>): Promise<ExpenseDetailResponse> => {
    const response = await apiClient.patch(`/expenses/${id}/`, data);
    return response.data;
  },

  /**
   * Delete expense
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}/`);
  },
};
