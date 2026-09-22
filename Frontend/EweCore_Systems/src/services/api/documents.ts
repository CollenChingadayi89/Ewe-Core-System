/**
 * Document API Service
 * Handles document management and categories
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentCategoryResponse {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_category: string | null;
  parent_category_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  id: string;
  document_number: string;
  title: string;
  description: string | null;
  category: string;
  category_name: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_extension: string;
  version: number;
  is_latest_version: boolean;
  uploaded_by: string;
  uploaded_by_name: string;
  upload_date: string;
  access_level: string;
  access_level_display: string;
  status: string;
  status_display: string;
  expiry_date: string | null;
  is_expired: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface DocumentDetailResponse extends DocumentListResponse {
  previous_version: string | null;
  content_type: number | null;
  object_id: string | null;
  allowed_roles: string[];
  allowed_users: string[];
  notes: string | null;
}

export interface DocumentCreateRequest {
  title: string;
  description?: string;
  category: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  file_extension: string;
  access_level?: string;
  allowed_roles?: string[];
  allowed_users?: string[];
  tags?: string[];
  expiry_date?: string;
  status?: string;
  notes?: string;
}

export interface DocumentCategoryCreateRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parent_category?: string;
  is_active?: boolean;
}

export interface DocumentFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  category?: string;
  access_level?: string;
  uploaded_by?: string;
  is_latest_version?: boolean;
  ordering?: string;
}

export interface DocumentCategoryFilters {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
  parent_category?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const documentApi = {
  /**
   * List documents with optional filtering
   */
  list: async (filters?: DocumentFilters): Promise<PaginatedResponse<DocumentListResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.access_level) params.append('access_level', filters.access_level);
    if (filters?.uploaded_by) params.append('uploaded_by', filters.uploaded_by);
    if (filters?.is_latest_version !== undefined) params.append('is_latest_version', filters.is_latest_version.toString());
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/documents/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single document by ID
   */
  retrieve: async (id: string): Promise<DocumentDetailResponse> => {
    const response = await apiClient.get(`/documents/${id}/`);
    return response.data;
  },

  /**
   * Create new document
   */
  create: async (data: DocumentCreateRequest): Promise<DocumentDetailResponse> => {
    const response = await apiClient.post('/documents/', data);
    return response.data;
  },

  /**
   * Update existing document
   */
  update: async (id: string, data: Partial<DocumentCreateRequest>): Promise<DocumentDetailResponse> => {
    const response = await apiClient.put(`/documents/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update document
   */
  partialUpdate: async (id: string, data: Partial<DocumentCreateRequest>): Promise<DocumentDetailResponse> => {
    const response = await apiClient.patch(`/documents/${id}/`, data);
    return response.data;
  },

  /**
   * Delete document
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}/`);
  },
};

export const documentCategoryApi = {
  /**
   * List document categories with optional filtering
   */
  list: async (filters?: DocumentCategoryFilters): Promise<PaginatedResponse<DocumentCategoryResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.parent_category) params.append('parent_category', filters.parent_category);

    const response = await apiClient.get(`/document-categories/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single category by ID
   */
  retrieve: async (id: string): Promise<DocumentCategoryResponse> => {
    const response = await apiClient.get(`/document-categories/${id}/`);
    return response.data;
  },

  /**
   * Create new category
   */
  create: async (data: DocumentCategoryCreateRequest): Promise<DocumentCategoryResponse> => {
    const response = await apiClient.post('/document-categories/', data);
    return response.data;
  },

  /**
   * Update existing category
   */
  update: async (id: string, data: Partial<DocumentCategoryCreateRequest>): Promise<DocumentCategoryResponse> => {
    const response = await apiClient.put(`/document-categories/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update category
   */
  partialUpdate: async (id: string, data: Partial<DocumentCategoryCreateRequest>): Promise<DocumentCategoryResponse> => {
    const response = await apiClient.patch(`/document-categories/${id}/`, data);
    return response.data;
  },

  /**
   * Delete category
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/document-categories/${id}/`);
  },
};
