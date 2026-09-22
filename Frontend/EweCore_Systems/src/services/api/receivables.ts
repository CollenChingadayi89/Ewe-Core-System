/**
 * Receivables API Service
 * Money coming INTO SACCO from members for 15 service categories.
 * Supports partial payments and approval workflows.
 */

import { get, post, put, patch, del } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES - Receivables
// ============================================================================

export interface ReceivableListResponse {
  id: string;
  receivable_number: string;
  member: string;
  member_name: string;
  member_number: string;
  category: string;
  category_display: string;
  amount: string;
  currency: string;
  amount_paid: string;
  outstanding_balance: string;
  transaction_date: string;
  due_date: string;
  collection_date: string | null;
  status: string;
  status_display: string;
  priority: string;
  is_overdue: boolean;
  submitted_by: string;
  submitted_by_name: string;
  approved_by: string | null;
  approved_by_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceivableDetailResponse {
  // Basic Info
  id: string;
  receivable_number: string;
  member: string;
  member_details: {
    id: string;
    member_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    email: string;
    status: string;
  };

  // Category & Amount
  category: string;
  category_display: string;
  amount: string;
  currency: string;
  amount_paid: string;
  outstanding_balance: string;

  // Dates
  transaction_date: string;
  due_date: string;
  collection_date: string | null;

  // Description
  description: string;
  notes: string | null;

  // Loan-Specific
  loan_account_number: string | null;
  installment_number: number | null;
  total_installments: number | null;
  principal_amount: string | null;
  interest_amount: string | null;
  interest_rate: string | null;

  // Share-Specific
  share_certificate_number: string | null;
  number_of_shares: number | null;
  share_price: string | null;

  // Status & Approval
  status: string;
  status_display: string;
  priority: string;
  submitted_by: string;
  submitted_by_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
  };
  approved_by: string | null;
  approved_by_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
    approved_date: string;
  } | null;
  approved_date: string | null;
  rejection_reason: string | null;

  // Payment Tracking
  is_recurring: boolean;
  payment_method: string | null;
  reference_number: string | null;
  is_overdue: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string;
  modified_by: string;

  // Related
  payments: ReceivablePaymentResponse[];
}

export interface ReceivableCreateRequest {
  member: string;
  category: string;
  amount: string;
  currency?: string;
  transaction_date: string;
  due_date: string;
  collection_date?: string;
  description: string;
  notes?: string;
  // Loan fields
  loan_account_number?: string;
  installment_number?: number;
  total_installments?: number;
  principal_amount?: string;
  interest_amount?: string;
  interest_rate?: string;
  // Share fields
  share_certificate_number?: string;
  number_of_shares?: number;
  share_price?: string;
  // Payment tracking
  is_recurring?: boolean;
  payment_method?: string;
  reference_number?: string;
  priority?: string;
  submitted_by: string;
}

export interface ApproveRejectRequest {
  notes?: string;
  reason?: string;
}

export interface RecordPaymentRequest {
  payment_date: string;
  amount_paid: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
}

export interface MarkPaidRequest {
  payment_date?: string;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

// ============================================================================
// TYPES - Receivable Payments
// ============================================================================

export interface ReceivablePaymentResponse {
  id: string;
  receivable: string;
  receivable_number: string;
  member_name: string;
  payment_number: string;
  payment_date: string;
  amount_paid: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  recorded_by: string;
  recorded_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ReceivablePaymentCreateRequest {
  receivable: string;
  payment_date: string;
  amount_paid: string;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  recorded_by: string;
}

// ============================================================================
// API FUNCTIONS - Receivables
// ============================================================================

export const receivableApi = {
  /**
   * List all receivables with optional filtering
   */
  list: async (params?: {
    page?: number;
    search?: string;
    member?: string;
    category?: string;
    status?: string;
    priority?: string;
    is_recurring?: boolean;
    submitted_by?: string;
    approved_by?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<ReceivableListResponse>> => {
    const response = await get<PaginatedResponse<ReceivableListResponse>>('/receivables/', { params });
    return response.data;
  },

  /**
   * Get detailed receivable information
   */
  retrieve: async (id: string): Promise<ReceivableDetailResponse> => {
    const response = await get<ReceivableDetailResponse>(`/receivables/${id}/`);
    return response.data;
  },

  /**
   * Create new receivable
   */
  create: async (data: ReceivableCreateRequest): Promise<ReceivableDetailResponse> => {
    const response = await post<ReceivableDetailResponse>('/receivables/', data);
    return response.data;
  },

  /**
   * Update existing receivable (draft only)
   */
  update: async (id: string, data: Partial<ReceivableCreateRequest>): Promise<ReceivableDetailResponse> => {
    const response = await put<ReceivableDetailResponse>(`/receivables/${id}/`, data);
    return response.data;
  },

  /**
   * Partial update of receivable
   */
  partialUpdate: async (id: string, data: Partial<ReceivableCreateRequest>): Promise<ReceivableDetailResponse> => {
    const response = await patch<ReceivableDetailResponse>(`/receivables/${id}/`, data);
    return response.data;
  },

  /**
   * Delete receivable
   */
  delete: async (id: string): Promise<void> => {
    await del(`/receivables/${id}/`);
  },

  // ============================================================================
  // CUSTOM ACTIONS
  // ============================================================================

  /**
   * Approve a receivable
   */
  approve: async (id: string, data?: ApproveRejectRequest): Promise<ReceivableDetailResponse> => {
    const response = await post<ReceivableDetailResponse>(`/receivables/${id}/approve/`, data || {});
    return response.data;
  },

  /**
   * Reject a receivable
   */
  reject: async (id: string, data: ApproveRejectRequest): Promise<ReceivableDetailResponse> => {
    const response = await post<ReceivableDetailResponse>(`/receivables/${id}/reject/`, data);
    return response.data;
  },

  /**
   * Record a partial payment
   */
  recordPayment: async (id: string, data: RecordPaymentRequest): Promise<ReceivableDetailResponse> => {
    const response = await post<ReceivableDetailResponse>(`/receivables/${id}/record-payment/`, data);
    return response.data;
  },

  /**
   * Mark receivable as fully paid
   */
  markPaid: async (id: string, data?: MarkPaidRequest): Promise<ReceivableDetailResponse> => {
    const response = await post<ReceivableDetailResponse>(`/receivables/${id}/mark-paid/`, data || {});
    return response.data;
  },
};

// ============================================================================
// API FUNCTIONS - Receivable Payments
// ============================================================================

export const receivablePaymentApi = {
  /**
   * List all receivable payments
   */
  list: async (params?: {
    page?: number;
    search?: string;
    receivable?: string;
    payment_method?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<ReceivablePaymentResponse>> => {
    const response = await get<PaginatedResponse<ReceivablePaymentResponse>>('/receivable-payments/', { params });
    return response.data;
  },

  /**
   * Get detailed payment information
   */
  retrieve: async (id: string): Promise<ReceivablePaymentResponse> => {
    const response = await get<ReceivablePaymentResponse>(`/receivable-payments/${id}/`);
    return response.data;
  },

  /**
   * Create new payment (prefer using receivableApi.recordPayment)
   */
  create: async (data: ReceivablePaymentCreateRequest): Promise<ReceivablePaymentResponse> => {
    const response = await post<ReceivablePaymentResponse>('/receivable-payments/', data);
    return response.data;
  },
};
