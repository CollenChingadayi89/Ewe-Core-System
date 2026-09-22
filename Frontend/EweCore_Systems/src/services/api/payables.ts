/**
 * Payables API Service
 * Money going OUT from SACCO to vendors/suppliers.
 * Supports approval workflows and payment tracking.
 */

import { get, post, put, patch, del } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES - Vendors
// ============================================================================

export interface VendorListResponse {
  id: string;
  vendor_code: string;
  company_name: string;
  contact_person: string | null;
  email: string;
  phone: string;
  vendor_type: string;
  vendor_type_display: string;
  payment_terms: string | null;
  is_active: boolean;
  payables_count: number;
  total_outstanding: number;
  created_at: string;
  updated_at: string;
}

export interface VendorDetailResponse {
  // Basic Info
  id: string;
  vendor_code: string;
  company_name: string;
  contact_person: string | null;
  email: string;
  phone: string;
  alternate_phone: string | null;

  // Address
  address: string;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string;

  // Banking Details
  bank_name: string | null;
  branch: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  swift_code: string | null;

  // Tax Information
  tax_id: string | null;

  // Additional Info
  vendor_type: string;
  vendor_type_display: string;
  payment_terms: string | null;
  notes: string | null;
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string;
  modified_by: string;

  // Related
  recent_payables: {
    id: string;
    payable_number: string;
    invoice_number: string | null;
    total_amount: number;
    invoice_date: string;
    due_date: string;
    status: string;
    status_display: string;
  }[];
  statistics: {
    total_payables: number;
    total_paid: number;
    total_pending: number;
    count_paid: number;
    count_pending: number;
  };
}

export interface VendorCreateRequest {
  company_name: string;
  contact_person?: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  address: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  bank_name?: string;
  branch?: string;
  account_number?: string;
  account_holder_name?: string;
  swift_code?: string;
  tax_id?: string;
  vendor_type?: string;
  payment_terms?: string;
  notes?: string;
  is_active?: boolean;
}

// ============================================================================
// TYPES - Payables
// ============================================================================

export interface PayableListResponse {
  id: string;
  payable_number: string;
  vendor: string;
  vendor_name: string;
  vendor_code: string;
  invoice_number: string | null;
  category: string;
  category_display: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  invoice_date: string;
  due_date: string;
  collection_date: string | null;
  status: string;
  status_display: string;
  priority: string;
  is_overdue: boolean;
  submitted_by: string;
  submitted_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface PayableDetailResponse {
  // Basic Info
  id: string;
  payable_number: string;
  vendor: string;
  vendor_details: {
    id: string;
    vendor_code: string;
    company_name: string;
    contact_person: string | null;
    phone: string;
    email: string;
    vendor_type: string;
    vendor_type_display: string;
    payment_terms: string | null;
  };

  // Invoice Details
  invoice_number: string | null;
  description: string;
  category: string;
  category_display: string;

  // Amount Details
  amount: string;
  currency: string;
  tax_amount: string;
  total_amount: string;

  // Dates
  invoice_date: string;
  due_date: string;
  collection_date: string | null;
  paid_date: string | null;

  // Payment Details
  payment_method: string | null;
  payment_reference: string | null;

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
  current_approver: string | null;
  current_approver_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
  approval_chain: {
    approver_id: string;
    approver_name: string;
    approved_at?: string;
    rejected_at?: string;
    notes?: string;
    reason?: string;
  }[];
  approved_date: string | null;
  rejection_reason: string | null;

  // Additional Info
  attachments: string[];
  notes: string | null;
  is_overdue: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string;
  modified_by: string;
}

export interface PayableCreateRequest {
  vendor: string;
  invoice_number?: string;
  description: string;
  category?: string;
  amount: string;
  currency?: string;
  tax_amount?: string;
  invoice_date: string;
  due_date: string;
  collection_date?: string;
  payment_method?: string;
  payment_reference?: string;
  priority?: string;
  attachments?: string[];
  notes?: string;
  submitted_by: string;
}

export interface ApproveRejectRequest {
  notes?: string;
  reason?: string;
}

export interface MarkPaidRequest {
  paid_date?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
}

// ============================================================================
// API FUNCTIONS - Vendors
// ============================================================================

export const vendorApi = {
  /**
   * List all vendors with optional filtering
   */
  list: async (params?: {
    page?: number;
    search?: string;
    vendor_type?: string;
    is_active?: boolean;
    city?: string;
    province?: string;
    country?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<VendorListResponse>> => {
    const response = await get<PaginatedResponse<VendorListResponse>>('/vendors/', { params });
    return response.data;
  },

  /**
   * Get detailed vendor information
   */
  retrieve: async (id: string): Promise<VendorDetailResponse> => {
    const response = await get<VendorDetailResponse>(`/vendors/${id}/`);
    return response.data;
  },

  /**
   * Create new vendor
   */
  create: async (data: VendorCreateRequest): Promise<VendorDetailResponse> => {
    const response = await post<VendorDetailResponse>('/vendors/', data);
    return response.data;
  },

  /**
   * Update existing vendor
   */
  update: async (id: string, data: VendorCreateRequest): Promise<VendorDetailResponse> => {
    const response = await put<VendorDetailResponse>(`/vendors/${id}/`, data);
    return response.data;
  },

  /**
   * Partial update of vendor
   */
  partialUpdate: async (id: string, data: Partial<VendorCreateRequest>): Promise<VendorDetailResponse> => {
    const response = await patch<VendorDetailResponse>(`/vendors/${id}/`, data);
    return response.data;
  },

  /**
   * Delete vendor
   */
  delete: async (id: string): Promise<void> => {
    await del(`/vendors/${id}/`);
  },
};

// ============================================================================
// API FUNCTIONS - Payables
// ============================================================================

export const payableApi = {
  /**
   * List all payables with optional filtering
   */
  list: async (params?: {
    page?: number;
    search?: string;
    vendor?: string;
    category?: string;
    status?: string;
    priority?: string;
    submitted_by?: string;
    current_approver?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<PayableListResponse>> => {
    const response = await get<PaginatedResponse<PayableListResponse>>('/payables/', { params });
    return response.data;
  },

  /**
   * Get detailed payable information
   */
  retrieve: async (id: string): Promise<PayableDetailResponse> => {
    const response = await get<PayableDetailResponse>(`/payables/${id}/`);
    return response.data;
  },

  /**
   * Create new payable
   */
  create: async (data: PayableCreateRequest): Promise<PayableDetailResponse> => {
    const response = await post<PayableDetailResponse>('/payables/', data);
    return response.data;
  },

  /**
   * Update existing payable (draft only)
   */
  update: async (id: string, data: Partial<PayableCreateRequest>): Promise<PayableDetailResponse> => {
    const response = await put<PayableDetailResponse>(`/payables/${id}/`, data);
    return response.data;
  },

  /**
   * Partial update of payable
   */
  partialUpdate: async (id: string, data: Partial<PayableCreateRequest>): Promise<PayableDetailResponse> => {
    const response = await patch<PayableDetailResponse>(`/payables/${id}/`, data);
    return response.data;
  },

  /**
   * Delete payable
   */
  delete: async (id: string): Promise<void> => {
    await del(`/payables/${id}/`);
  },

  // ============================================================================
  // CUSTOM ACTIONS
  // ============================================================================

  /**
   * Approve a payable
   */
  approve: async (id: string, data?: ApproveRejectRequest): Promise<PayableDetailResponse> => {
    const response = await post<PayableDetailResponse>(`/payables/${id}/approve/`, data || {});
    return response.data;
  },

  /**
   * Reject a payable
   */
  reject: async (id: string, data: ApproveRejectRequest): Promise<PayableDetailResponse> => {
    const response = await post<PayableDetailResponse>(`/payables/${id}/reject/`, data);
    return response.data;
  },

  /**
   * Mark payable as fully paid
   */
  markPaid: async (id: string, data?: MarkPaidRequest): Promise<PayableDetailResponse> => {
    const response = await post<PayableDetailResponse>(`/payables/${id}/mark-paid/`, data || {});
    return response.data;
  },
};
