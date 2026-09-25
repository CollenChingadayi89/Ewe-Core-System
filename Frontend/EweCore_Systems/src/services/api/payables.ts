/**
 * Payables API Service
 * Money going OUT from the SACCO to vendors/suppliers and to members (payouts).
 * Supports approval workflows and payment tracking.
 */

import { get, post, put, patch, del } from './client';
import type { ApprovalSummary } from './approval';
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

export type PayeeType = 'vendor' | 'member';

/** Must match core.constants.PayableCategory in the backend. */
export const VENDOR_PAYABLE_CATEGORIES = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'rent', label: 'Rent' },
  { value: 'supplies', label: 'Office Supplies' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'services', label: 'Professional Services' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes & Fees' },
  { value: 'salaries', label: 'Salaries & Wages' },
  { value: 'procurement', label: 'Procurement / Supplier Contract' },
  { value: 'other', label: 'Other' },
];

export const MEMBER_PAYABLE_CATEGORIES = [
  { value: 'dividend-payout', label: 'Dividend Payout' },
  { value: 'interest-payout', label: 'Interest Payout' },
  { value: 'share-buyback', label: 'Share Sale / Buy-back' },
  { value: 'savings-withdrawal', label: 'Savings Withdrawal' },
];

/** Must match CURRENCY_CHOICES in the backend. */
export const PAYABLE_CURRENCIES = ['ZWG', 'USD'];

export type PayableApprovalSummary = ApprovalSummary;

/** Where the money goes. Which fields apply depends on the payment method. */
export interface PayablePayToDetails {
  pay_to_bank_name?: string | null;
  pay_to_bank_branch?: string | null;
  pay_to_account_number?: string | null;
  pay_to_account_name?: string | null;
  pay_to_mobile_number?: string | null;
}

/** DRF serialises DecimalFields as strings. */
export interface PayableListResponse extends PayablePayToDetails {
  id: string;
  payable_number: string;
  payee_type: PayeeType;
  payee_type_display: string;
  payee_name: string;
  payee_reference: string;
  vendor: string | null;
  member: string | null;
  invoice_number: string | null;
  description: string;
  category: string;
  category_display: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  currency: string;
  invoice_date: string;
  due_date: string;
  collection_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  status: string;
  status_display: string;
  priority: string;
  is_overdue: boolean;
  submitted_by: string;
  submitted_by_name: string;
  approved_by_name: string | null;
  paid_by_name: string | null;
  approval: PayableApprovalSummary | null;
  /** True when the current user is the Pay-stage assignee and the payable is approved */
  can_mark_paid: boolean;
  in_person_collection: boolean;
  collector_name: string | null;
  collector_id_number: string | null;
  collector_phone: string | null;
  collector_id_verified: boolean;
  /** Procurement installments this payable settles */
  procurement_installments: PayableProcurementInstallment[];
  /** Payment/collection date asked for when raised; approvers may move collection_date */
  requested_collection_date: string | null;
  created_at: string;
  updated_at: string;
}

/** An approver moved the payment/collection date (audit trail). */
export interface PayableDateChange {
  id: number;
  old_date: string | null;
  new_date: string;
  reason: string;
  changed_by_name: string;
  stage_name: string;
  created_at: string;
}

export interface RescheduleRequest {
  /** YYYY-MM-DD, today or later */
  collection_date: string;
  reason: string;
}

export interface PayableProcurementInstallment {
  id: string;
  record_id: string;
  record_number: string;
  procurement_number: string;
  item_description: string;
  label: string;
  due_date: string;
  amount: string;
}

/** Someone collects the payment in person (cash/cheque); the payer checks their ID. */
export interface PayableCollectionDetails {
  in_person_collection?: boolean;
  collector_name?: string;
  collector_id_number?: string;
  collector_phone?: string;
}

export interface PayableDetailResponse extends PayableListResponse {
  vendor_details: {
    id: string;
    vendor_code: string;
    company_name: string;
    contact_person: string | null;
    phone: string;
    email: string;
    vendor_type_display: string;
    payment_terms: string | null;
  } | null;
  member_details: {
    id: string;
    member_number: string;
    full_name: string;
    phone: string;
    email: string;
    account_status: string;
  } | null;
  payment_reference: string | null;
  date_changes: PayableDateChange[];
  approved_date: string | null;
  rejection_reason: string | null;
  attachments: string[];
  notes: string | null;
}


export interface PayableCreateRequest extends PayablePayToDetails, PayableCollectionDetails {
  /** Procurement installments to settle; the amount is then set from them (vendor payables) */
  procurement_installments?: string[];
  payee_type: PayeeType;
  vendor?: string;
  member?: string;
  invoice_number?: string;
  description: string;
  category: string;
  amount: string;
  currency: string;
  tax_amount?: string;
  /** YYYY-MM-DD; required for vendor payables, defaults to today for member payouts */
  invoice_date?: string;
  due_date: string;
  collection_date?: string;
  payment_method?: string;
  priority?: string;
  notes?: string;
}

export interface MarkPaidRequest {
  /** YYYY-MM-DD, defaults to today */
  paid_date?: string;
  payment_method: string;
  payment_reference?: string;
  notes?: string;
  /** Required (true) for in-person collection: the payer checked the collector's ID */
  collector_id_verified?: boolean;
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
    payee_type?: PayeeType;
    vendor?: string;
    member?: string;
    category?: string;
    currency?: string;
    status?: string;
    priority?: string;
    submitted_by?: string;
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
   * Update a payable (only until an approver has acted on it)
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
  // Approve / reject go through the approval workflow:
  // approvalRequestApi.approve/reject(payable.approval.id, ...)
  // ============================================================================

  /**
   * Move the payment/collection date (approver whose turn it is; reason required)
   */
  reschedule: async (id: string, data: RescheduleRequest): Promise<PayableDetailResponse> => {
    const response = await post<PayableDetailResponse>(`/payables/${id}/reschedule/`, data);
    return response.data;
  },

  /**
   * Record payment and complete the workflow's Pay stage (Pay-stage assignee only)
   */
  markPaid: async (id: string, data: MarkPaidRequest): Promise<PayableDetailResponse> => {
    const response = await post<PayableDetailResponse>(`/payables/${id}/mark-paid/`, data);
    return response.data;
  },
};
