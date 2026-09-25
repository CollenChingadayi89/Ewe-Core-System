/**
 * Procurement API Service
 * Handles procurement/purchase requests
 */

import { apiClient, postFormData } from './client';

/** Uploads and document downloads can be larger than typical API calls. */
const FILE_TRANSFER_TIMEOUT_MS = 120_000;

/** Currencies a procurement request can be raised in, in display order. */
export const PROCUREMENT_CURRENCIES: string[] = ['ZWG', 'USD', 'ZAR'];

/** Must match ALLOWED_EXTENSIONS / MAX_FILE_SIZE in Backend/finance_procurement/services.py */
export const QUOTATION_ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
export const QUOTATION_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
import type { PaginatedResponse } from './types';

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
  vendor_name: string;
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
