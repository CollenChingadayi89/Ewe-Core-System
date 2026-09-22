/**
 * Finance Documents API Service
 * Handles Invoices, Estimates, and Payments
 */

import { get, post, put, patch, del } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES - Invoices
// ============================================================================

export interface InvoiceListResponse {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client: string;
  client_name: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  amount_paid: string;
  amount_due: string;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceDetailResponse {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  client: string;
  client_details: {
    id: string;
    client_number: string;
    full_name: string;
    email: string;
  } | null;
  project: string | null;
  project_details: {
    id: string;
    project_number: string;
    project_name: string;
  } | null;
  deal: string | null;
  billing_address: string;
  billing_email: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  amount_paid: string;
  amount_due: string;
  currency: string;
  line_items: unknown;
  payment_terms: string;
  payment_terms_notes: string | null;
  status: string;
  notes: string | null;
  attachments: unknown;
  is_deleted: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreateRequest {
  invoice_date: string;
  due_date: string;
  client: string;
  billing_address: string;
  billing_email: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  amount_paid?: string;
  amount_due?: string;
  currency?: string;
  line_items?: unknown;
  payment_terms?: string;
  payment_terms_notes?: string;
  status?: string;
  project?: string;
  deal?: string;
  notes?: string;
  attachments?: unknown;
  is_active?: boolean;
}

// ============================================================================
// TYPES - Estimates
// ============================================================================

export interface EstimateListResponse {
  id: string;
  estimate_number: string;
  estimate_date: string;
  valid_until: string;
  client: string;
  client_name: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface EstimateDetailResponse {
  id: string;
  estimate_number: string;
  estimate_date: string;
  valid_until: string;
  client: string;
  client_details: {
    id: string;
    client_number: string;
    full_name: string;
    email: string;
  } | null;
  deal: string | null;
  billing_address: string;
  contact_email: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  line_items: unknown;
  payment_terms: string;
  status: string;
  notes: string | null;
  attachments: unknown;
  converted_to_invoice: string | null;
  converted_invoice_details: {
    id: string;
    invoice_number: string;
    status: string;
  } | null;
  is_deleted: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EstimateCreateRequest {
  estimate_date: string;
  valid_until: string;
  client: string;
  billing_address: string;
  contact_email: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  discount_amount: string;
  total_amount: string;
  currency?: string;
  line_items?: unknown;
  payment_terms?: string;
  status?: string;
  deal?: string;
  notes?: string;
  attachments?: unknown;
  converted_to_invoice?: string;
  is_active?: boolean;
}

// ============================================================================
// TYPES - Payments
// ============================================================================

export interface PaymentListResponse {
  id: string;
  payment_number: string;
  payment_date: string;
  invoice: string;
  invoice_number: string;
  client_name: string;
  amount: string;
  currency: string;
  payment_method: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentDetailResponse {
  id: string;
  payment_number: string;
  payment_date: string;
  invoice: string | null;
  invoice_details: {
    id: string;
    invoice_number: string;
    total_amount: string;
    amount_paid: string;
    amount_due: string;
  } | null;
  amount: string;
  currency: string;
  payment_method: string;
  transaction_reference: string | null;
  payment_gateway: string | null;
  payment_gateway_response: unknown;
  bank_name: string | null;
  account_number: string | null;
  cheque_number: string | null;
  mobile_number: string | null;
  mobile_money_provider: string | null;
  notes: string | null;
  status: string;
  processed_by: string | null;
  processed_by_details: {
    id: string;
    employee_number: string;
    full_name: string;
  } | null;
  attachments: unknown;
  is_deleted: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentCreateRequest {
  payment_date: string;
  invoice?: string;
  amount: string;
  currency?: string;
  payment_method: string;
  transaction_reference?: string;
  payment_gateway?: string;
  payment_gateway_response?: unknown;
  bank_name?: string;
  account_number?: string;
  cheque_number?: string;
  mobile_number?: string;
  mobile_money_provider?: string;
  notes?: string;
  status?: string;
  processed_by?: string;
  attachments?: unknown;
  is_active?: boolean;
}

// ============================================================================
// API FUNCTIONS - Invoices
// ============================================================================

export const invoiceApi = {
  /**
   * List all invoices with optional filtering
   * GET /api/invoices/
   */
  list: async (params?: {
    page?: number;
    search?: string;
    status?: string;
    client?: string;
    project?: string;
    payment_terms?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<InvoiceListResponse>> => {
    const response = await get<PaginatedResponse<InvoiceListResponse>>('/invoices/', { params });
    return response.data;
  },

  /**
   * Get detailed invoice information
   * GET /api/invoices/{id}/
   */
  retrieve: async (id: string): Promise<InvoiceDetailResponse> => {
    const response = await get<InvoiceDetailResponse>(`/invoices/${id}/`);
    return response.data;
  },

  /**
   * Create new invoice
   * POST /api/invoices/
   */
  create: async (data: InvoiceCreateRequest): Promise<InvoiceDetailResponse> => {
    const response = await post<InvoiceDetailResponse>('/invoices/', data);
    return response.data;
  },

  /**
   * Update existing invoice
   * PUT /api/invoices/{id}/
   */
  update: async (id: string, data: InvoiceCreateRequest): Promise<InvoiceDetailResponse> => {
    const response = await put<InvoiceDetailResponse>(`/invoices/${id}/`, data);
    return response.data;
  },

  /**
   * Partial update of invoice
   * PATCH /api/invoices/{id}/
   */
  partialUpdate: async (id: string, data: Partial<InvoiceCreateRequest>): Promise<InvoiceDetailResponse> => {
    const response = await patch<InvoiceDetailResponse>(`/invoices/${id}/`, data);
    return response.data;
  },

  /**
   * Delete invoice (soft delete)
   * DELETE /api/invoices/{id}/
   */
  delete: async (id: string): Promise<void> => {
    await del(`/invoices/${id}/`);
  },

  // ============================================================================
  // CUSTOM ACTIONS
  // ============================================================================

  /**
   * Mark invoice as sent
   * POST /api/invoices/{id}/mark_sent/
   */
  markSent: async (id: string): Promise<{ status: string }> => {
    const response = await post<{ status: string }>(`/invoices/${id}/mark_sent/`);
    return response.data;
  },

  /**
   * Mark invoice as fully paid
   * POST /api/invoices/{id}/mark_paid/
   */
  markPaid: async (id: string): Promise<{ status: string }> => {
    const response = await post<{ status: string }>(`/invoices/${id}/mark_paid/`);
    return response.data;
  },

  /**
   * Get all overdue invoices
   * GET /api/invoices/overdue/
   */
  getOverdue: async (): Promise<InvoiceListResponse[]> => {
    const response = await get<InvoiceListResponse[]>('/invoices/overdue/');
    return response.data;
  },
};

// ============================================================================
// API FUNCTIONS - Estimates
// ============================================================================

export const estimateApi = {
  /**
   * List all estimates with optional filtering
   * GET /api/estimates/
   */
  list: async (params?: {
    page?: number;
    search?: string;
    status?: string;
    client?: string;
    deal?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<EstimateListResponse>> => {
    const response = await get<PaginatedResponse<EstimateListResponse>>('/estimates/', { params });
    return response.data;
  },

  /**
   * Get detailed estimate information
   * GET /api/estimates/{id}/
   */
  retrieve: async (id: string): Promise<EstimateDetailResponse> => {
    const response = await get<EstimateDetailResponse>(`/estimates/${id}/`);
    return response.data;
  },

  /**
   * Create new estimate
   * POST /api/estimates/
   */
  create: async (data: EstimateCreateRequest): Promise<EstimateDetailResponse> => {
    const response = await post<EstimateDetailResponse>('/estimates/', data);
    return response.data;
  },

  /**
   * Update existing estimate
   * PUT /api/estimates/{id}/
   */
  update: async (id: string, data: EstimateCreateRequest): Promise<EstimateDetailResponse> => {
    const response = await put<EstimateDetailResponse>(`/estimates/${id}/`, data);
    return response.data;
  },

  /**
   * Partial update of estimate
   * PATCH /api/estimates/{id}/
   */
  partialUpdate: async (id: string, data: Partial<EstimateCreateRequest>): Promise<EstimateDetailResponse> => {
    const response = await patch<EstimateDetailResponse>(`/estimates/${id}/`, data);
    return response.data;
  },

  /**
   * Delete estimate (soft delete)
   * DELETE /api/estimates/{id}/
   */
  delete: async (id: string): Promise<void> => {
    await del(`/estimates/${id}/`);
  },

  // ============================================================================
  // CUSTOM ACTIONS
  // ============================================================================

  /**
   * Convert estimate to invoice
   * POST /api/estimates/{id}/convert_to_invoice/
   */
  convertToInvoice: async (id: string): Promise<InvoiceDetailResponse> => {
    const response = await post<InvoiceDetailResponse>(`/estimates/${id}/convert_to_invoice/`);
    return response.data;
  },

  /**
   * Mark estimate as accepted
   * POST /api/estimates/{id}/mark_accepted/
   */
  markAccepted: async (id: string): Promise<{ status: string }> => {
    const response = await post<{ status: string }>(`/estimates/${id}/mark_accepted/`);
    return response.data;
  },

  /**
   * Mark estimate as rejected
   * POST /api/estimates/{id}/mark_rejected/
   */
  markRejected: async (id: string): Promise<{ status: string }> => {
    const response = await post<{ status: string }>(`/estimates/${id}/mark_rejected/`);
    return response.data;
  },
};

// ============================================================================
// API FUNCTIONS - Payments
// ============================================================================

export const paymentApi = {
  /**
   * List all payments with optional filtering
   * GET /api/payments/
   */
  list: async (params?: {
    page?: number;
    search?: string;
    status?: string;
    payment_method?: string;
    invoice?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<PaymentListResponse>> => {
    const response = await get<PaginatedResponse<PaymentListResponse>>('/payments/', { params });
    return response.data;
  },

  /**
   * Get detailed payment information
   * GET /api/payments/{id}/
   */
  retrieve: async (id: string): Promise<PaymentDetailResponse> => {
    const response = await get<PaymentDetailResponse>(`/payments/${id}/`);
    return response.data;
  },

  /**
   * Create new payment
   * POST /api/payments/
   */
  create: async (data: PaymentCreateRequest): Promise<PaymentDetailResponse> => {
    const response = await post<PaymentDetailResponse>('/payments/', data);
    return response.data;
  },

  /**
   * Update existing payment
   * PUT /api/payments/{id}/
   */
  update: async (id: string, data: PaymentCreateRequest): Promise<PaymentDetailResponse> => {
    const response = await put<PaymentDetailResponse>(`/payments/${id}/`, data);
    return response.data;
  },

  /**
   * Partial update of payment
   * PATCH /api/payments/{id}/
   */
  partialUpdate: async (id: string, data: Partial<PaymentCreateRequest>): Promise<PaymentDetailResponse> => {
    const response = await patch<PaymentDetailResponse>(`/payments/${id}/`, data);
    return response.data;
  },

  /**
   * Delete payment (soft delete)
   * DELETE /api/payments/{id}/
   */
  delete: async (id: string): Promise<void> => {
    await del(`/payments/${id}/`);
  },

  // ============================================================================
  // CUSTOM ACTIONS
  // ============================================================================

  /**
   * Verify payment
   * POST /api/payments/{id}/verify/
   */
  verify: async (id: string): Promise<{ status: string }> => {
    const response = await post<{ status: string }>(`/payments/${id}/verify/`);
    return response.data;
  },

  /**
   * Refund payment
   * POST /api/payments/{id}/refund/
   */
  refund: async (id: string): Promise<{ status: string }> => {
    const response = await post<{ status: string }>(`/payments/${id}/refund/`);
    return response.data;
  },
};
