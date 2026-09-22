/**
 * Asset API Service
 * Handles asset management (IT equipment, furniture, etc.)
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface AssetListResponse {
  id: string;
  asset_number: string;
  name: string;
  category: string;
  category_display: string;
  description: string | null;
  serial_number: string | null;
  manufacturer: string | null;
  model: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  condition: string;
  condition_display: string;
  status: string;
  status_display: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assignment_date: string | null;
  location: string | null;
  warranty_expiry: string | null;
  is_warranty_expired: boolean;
  days_since_purchase: number | null;
  days_since_assignment: number | null;
  warranty_days_remaining: number | null;
  created_at: string;
  updated_at: string;
}

export interface AssetDetailResponse extends AssetListResponse {
  supplier: string | null;
  asset_age_years: number | null;
  depreciation_percentage: number | null;
  notes: string | null;
}

export interface AssetCreateRequest {
  name: string;
  category: string;
  description?: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  purchase_price?: number;
  supplier?: string;
  current_value?: number;
  condition?: string;
  status?: string;
  location?: string;
  warranty_expiry?: string;
  notes?: string;
}

export interface AssetAssignRequest {
  assigned_to: string;
  assignment_date?: string;
}

export interface AssetConditionUpdateRequest {
  condition: string;
  current_value?: number;
  notes?: string;
}

export interface AssetFilters {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
  assigned_to?: string;
  purchase_date_after?: string;
  purchase_date_before?: string;
  warranty_expiry_after?: string;
  warranty_expiry_before?: string;
  ordering?: string;
}

export interface AssetStatistics {
  total_assets: number;
  total_value: number;
  available_assets: number;
  assigned_assets: number;
  in_repair_assets: number;
  by_category: Record<string, number>;
  by_condition: Record<string, number>;
  warranty_expiring_soon: number;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const assetApi = {
  /**
   * List assets with optional filtering
   */
  list: async (filters?: AssetFilters): Promise<PaginatedResponse<AssetListResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.condition) params.append('condition', filters.condition);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.purchase_date_after) params.append('purchase_date_after', filters.purchase_date_after);
    if (filters?.purchase_date_before) params.append('purchase_date_before', filters.purchase_date_before);
    if (filters?.warranty_expiry_after) params.append('warranty_expiry_after', filters.warranty_expiry_after);
    if (filters?.warranty_expiry_before) params.append('warranty_expiry_before', filters.warranty_expiry_before);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/assets/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single asset by ID
   */
  retrieve: async (id: string): Promise<AssetDetailResponse> => {
    const response = await apiClient.get(`/assets/${id}/`);
    return response.data;
  },

  /**
   * Create new asset
   */
  create: async (data: AssetCreateRequest): Promise<AssetDetailResponse> => {
    const response = await apiClient.post('/assets/', data);
    return response.data;
  },

  /**
   * Update existing asset
   */
  update: async (id: string, data: Partial<AssetCreateRequest>): Promise<AssetDetailResponse> => {
    const response = await apiClient.put(`/assets/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update asset
   */
  partialUpdate: async (id: string, data: Partial<AssetCreateRequest>): Promise<AssetDetailResponse> => {
    const response = await apiClient.patch(`/assets/${id}/`, data);
    return response.data;
  },

  /**
   * Delete asset
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/assets/${id}/`);
  },

  /**
   * Assign asset to employee
   */
  assign: async (id: string, data: AssetAssignRequest): Promise<AssetDetailResponse> => {
    const response = await apiClient.post(`/assets/${id}/assign/`, data);
    return response.data;
  },

  /**
   * Return asset from employee
   */
  returnAsset: async (id: string): Promise<AssetDetailResponse> => {
    const response = await apiClient.post(`/assets/${id}/return/`);
    return response.data;
  },

  /**
   * Mark asset as lost/stolen
   */
  markLost: async (id: string, notes?: string): Promise<AssetDetailResponse> => {
    const response = await apiClient.post(`/assets/${id}/mark-lost/`, { notes });
    return response.data;
  },

  /**
   * Update asset condition
   */
  updateCondition: async (id: string, data: AssetConditionUpdateRequest): Promise<AssetDetailResponse> => {
    const response = await apiClient.post(`/assets/${id}/update-condition/`, data);
    return response.data;
  },

  /**
   * Get assets with warranty expiring within specified days
   */
  warrantyExpiring: async (days: number = 30): Promise<AssetListResponse[]> => {
    const response = await apiClient.get(`/assets/warranty-expiring/?days=${days}`);
    return response.data;
  },

  /**
   * Get all available (unassigned) assets
   */
  availableAssets: async (): Promise<AssetListResponse[]> => {
    const response = await apiClient.get('/assets/available/');
    return response.data;
  },

  /**
   * Get assets assigned to current user
   */
  myAssets: async (): Promise<AssetListResponse[]> => {
    const response = await apiClient.get('/assets/my-assets/');
    return response.data;
  },

  /**
   * Get asset statistics
   */
  statistics: async (): Promise<AssetStatistics> => {
    const response = await apiClient.get('/assets/statistics/');
    return response.data;
  },
};
