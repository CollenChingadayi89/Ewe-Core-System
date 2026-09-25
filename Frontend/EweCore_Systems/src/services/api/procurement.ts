/**
 * Procurement API Service
 * Handles procurement/purchase requests
 */

import { apiClient, postFormData } from './client';
import type { ApprovalSummary } from './approval';
import type { PaginatedResponse } from './types';

/** Uploads and document downloads can be larger than typical API calls. */
const FILE_TRANSFER_TIMEOUT_MS = 120_000;

/** Currencies a procurement request can be raised in, in display order. */
export const PROCUREMENT_CURRENCIES: string[] = ['ZWG', 'USD', 'ZAR'];

/** Must match ALLOWED_EXTENSIONS / MAX_FILE_SIZE in Backend/finance_procurement/services.py */
export const QUOTATION_ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
export const QUOTATION_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// ============================================================================
// TYPES
// ============================================================================

/** Stored as JSON on the request; numeric values may arrive as numbers or strings. */
export interface ProcurementLineItem {
  description: string;
  quantity: number | string;
  unit: string;
  unit_price: number | string;
  amount: number | string;
}

export interface ProcurementLineItemInput {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  amount: number;
}

/** Quotation as returned by the API. The document itself is fetched via getQuotationDocument. */
export interface ProcurementQuotation {
  /** Null for legacy quotations entered before vendors were linked */
  vendor_id: string | null;
  vendor_name: string;
  is_selected: boolean;
  file_name: string | null;
  file_size: number | null;
  content_type: string | null;
  /** False for legacy records created before document upload was supported. */
  has_document: boolean;
}

/** Quotation as sent on create; its document is uploaded alongside, in the same position. */
export interface ProcurementQuotationInput {
  vendor_id: string;
  is_selected: boolean;
}

/**
 * Shape returned by ProcurementRequestSerializer (all model fields + display fields).
 * DecimalFields are serialized as strings by DRF.
 */
export interface ProcurementListResponse {
  id: string;
  request_number: string;
  requested_by: string;
  employee_name: string | null;
  employee_department: string | null;
  vendor: string | null;
  vendor_name: string | null;
  item_description: string;
  category: string;
  category_display: string;
  quantity: number;
  unit: string;
  unit_price: string | null;
  total_amount: string;
  currency: string;
  quotations: ProcurementQuotation[];
  line_items: ProcurementLineItem[];
  is_for_employee: boolean;
  assigned_employees: string[];
  business_justification: string;
  technical_specifications: string | null;
  budget_code: string | null;
  delivery_location: string | null;
  request_type: string;
  request_type_display: string;
  request_date: string;
  required_by_date: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  current_approver: string | null;
  approval_chain: unknown[];
  approved_by: string | null;
  approved_by_name: string | null;
  approved_date: string | null;
  rejection_reason: string | null;
  po_number: string | null;
  ordered_date: string | null;
  received_date: string | null;
  attachments: string[];
  notes: string | null;
  // Award, made by the final approver
  selected_quotation_index: number | null;
  selection_reason: string | null;
  selected_by_name: string | null;
  selected_at: string | null;
  approval: ApprovalSummary | null;
  /** Procurement record created on final approval */
  record: { id: string; record_number: string; status: ProcurementRecordStatus } | null;
  created_at: string;
  updated_at: string;
}

export type ProcurementDetailResponse = ProcurementListResponse & {
  /** Only present when embedded in an approval request's content_object_details. */
  assigned_employee_names?: Record<string, string>;
};

export interface ProcurementCreateRequest {
  requested_by: string;
  vendor?: string;
  item_description: string;
  category: string;
  line_items: ProcurementLineItemInput[];
  total_amount: number;
  currency?: string;
  is_for_employee?: boolean;
  assigned_employees?: string[];
  quotations: ProcurementQuotationInput[];
  business_justification: string;
  technical_specifications?: string;
  delivery_location?: string;
  request_type?: string;
  budget_code?: string;
  required_by_date: string;
  status?: string;
  priority?: string;
  notes?: string;
}

/** Fields that can be edited after creation; quotations are fixed once submitted. */
export type ProcurementUpdateRequest = Partial<Omit<ProcurementCreateRequest, 'quotations'>>;

export interface AwardRequest {
  quotation_index: number;
  reason: string;
  comments?: string;
}

// ----------------------------------------------------------------------------
// Procurement records (what is owed to the winning supplier, paid in installments)
// ----------------------------------------------------------------------------

export type ProcurementRecordStatus = 'awaiting_terms' | 'active' | 'completed' | 'cancelled';
export type PaymentFrequency = 'once' | 'weekly' | 'monthly' | 'quarterly';

export const PAYMENT_FREQUENCIES: { value: PaymentFrequency; label: string }[] = [
  { value: 'once', label: 'Single payment' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
];

export interface ProcurementInstallment {
  id: string;
  sequence: number;
  label: string;
  due_date: string;
  amount: string;
  amount_paid: string;
  outstanding: string;
  status: 'pending' | 'partially_paid' | 'paid';
  /** Open payable currently covering this installment */
  reserved_by: { id: string; payable_number: string } | null;
}

export interface ProcurementPaymentEntry {
  id: string;
  installment: string;
  installment_label: string;
  payable: string;
  payable_number: string;
  amount: string;
  paid_date: string;
  recorded_by_name: string;
  created_at: string;
}

export interface ProcurementRecord {
  id: string;
  record_number: string;
  procurement: string;
  procurement_number: string;
  item_description: string;
  requested_by_name: string;
  vendor: string;
  vendor_name: string;
  vendor_code: string;
  currency: string;
  total_amount: string;
  deposit_amount: string;
  installment_count: number;
  frequency: PaymentFrequency;
  frequency_display: string;
  first_due_date: string | null;
  status: ProcurementRecordStatus;
  status_display: string;
  terms_set_by_name: string | null;
  terms_set_at: string | null;
  amount_paid: string;
  balance: string;
  next_due: { label: string; due_date: string; outstanding: string } | null;
  installments: ProcurementInstallment[];
  can_edit_terms: boolean;
  /** Detail view only: why terms can no longer change, if they can't */
  terms_locked_reason: string | null;
  /** Detail view only: the payment ledger */
  payments?: ProcurementPaymentEntry[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleRow {
  label?: string;
  due_date: string;
  amount: string;
}

export interface PaymentTermsRequest {
  total_amount: string;
  deposit_amount: string;
  installment_count: number;
  frequency: PaymentFrequency;
  first_due_date: string;
  /** Adjusted schedule; generated from the terms when omitted */
  installments?: ScheduleRow[];
}

/** An installment a vendor payable can settle. */
export interface OutstandingInstallment {
  id: string;
  record_id: string;
  record_number: string;
  procurement_number: string;
  item_description: string;
  label: string;
  due_date: string;
  amount: string;
  amount_paid: string;
  outstanding: string;
  currency: string;
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
   * Create new procurement request together with its quotation documents.
   * `quotationDocuments[i]` is the document for `data.quotations[i]`.
   */
  create: async (
    data: ProcurementCreateRequest,
    quotationDocuments: File[]
  ): Promise<ProcurementDetailResponse> => {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(data));
    quotationDocuments.forEach((file) => formData.append('quotation_documents', file));

    const response = await postFormData<ProcurementDetailResponse>('/procurement-requests/', formData, {
      timeout: FILE_TRANSFER_TIMEOUT_MS,
    });
    return response.data;
  },

  /**
   * Fetch a quotation document using the authenticated API client.
   * Returned as a Blob so it can be previewed in-app via an object URL.
   */
  getQuotationDocument: async (id: string, quotationIndex: number): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `/procurement-requests/${id}/quotations/${quotationIndex}/document/`,
      { responseType: 'blob', timeout: FILE_TRANSFER_TIMEOUT_MS }
    );
    return response.data;
  },

  /**
   * Final approver: select the winning quotation (with a reason) and give final approval
   */
  award: async (id: string, data: AwardRequest): Promise<ProcurementDetailResponse> => {
    const response = await apiClient.post(`/procurement-requests/${id}/award/`, data);
    return response.data;
  },

  /**
   * Update existing procurement request
   */
  update: async (id: string, data: ProcurementUpdateRequest): Promise<ProcurementDetailResponse> => {
    const response = await apiClient.put(`/procurement-requests/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update procurement request
   */
  partialUpdate: async (id: string, data: ProcurementUpdateRequest): Promise<ProcurementDetailResponse> => {
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

export const procurementRecordApi = {
  list: async (params?: { page?: number; status?: string; vendor?: string; search?: string }): Promise<PaginatedResponse<ProcurementRecord>> => {
    const response = await apiClient.get('/procurement-records/', { params });
    return response.data;
  },

  /** Includes the payment ledger */
  retrieve: async (id: string): Promise<ProcurementRecord> => {
    const response = await apiClient.get(`/procurement-records/${id}/`);
    return response.data;
  },

  setTerms: async (id: string, data: PaymentTermsRequest): Promise<ProcurementRecord> => {
    const response = await apiClient.post(`/procurement-records/${id}/set-terms/`, data);
    return response.data;
  },

  /** Schedule the terms would produce, without saving */
  previewSchedule: async (data: PaymentTermsRequest): Promise<ScheduleRow[]> => {
    const response = await apiClient.post('/procurement-records/preview-schedule/', data);
    return response.data;
  },

  /** Installments still owed to a vendor and not held by another open payable */
  outstandingInstallments: async (vendorId: string): Promise<OutstandingInstallment[]> => {
    const response = await apiClient.get('/procurement-records/outstanding-installments/', { params: { vendor: vendorId } });
    return response.data;
  },
};
