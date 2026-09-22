/**
 * Department & Designation API Service
 * Handles organization structure API calls
 */

import { get, post, put, patch, del } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPE DEFINITIONS - DEPARTMENTS
// ============================================================================

export interface DepartmentListResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  manager: string | null;
  manager_name: string | null;
  parent_department: string | null;
  parent_department_name: string | null;
  employee_count: number;
  sub_department_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentDetailResponse extends DepartmentListResponse {
  manager_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    designation: string | null;
  } | null;
  sub_departments: {
    id: string;
    code: string;
    name: string;
    employee_count: number;
  }[];
  designations: {
    id: string;
    code: string;
    title: string;
    employee_count: number;
  }[];
}

export interface DepartmentCreateRequest {
  code: string;
  name: string;
  description?: string;
  manager?: string;
  parent_department?: string;
  is_active?: boolean;
}

// ============================================================================
// TYPE DEFINITIONS - DESIGNATIONS
// ============================================================================

export interface DesignationListResponse {
  id: string;
  code: string;
  title: string;
  department: string;
  department_name: string;
  level: string | null;
  grade: string | null;
  description: string | null;
  employee_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignationDetailResponse extends DesignationListResponse {
  department_details: {
    id: string;
    code: string;
    name: string;
  };
  employees: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    email: string;
  }[];
  min_salary: string | null;
  max_salary: string | null;
  required_qualifications: any;
  required_skills: any;
  responsibilities: any;
}

export interface DesignationCreateRequest {
  code: string;
  title: string;
  department: string;
  level?: string;
  grade?: string;
  description?: string;
  min_salary?: string;
  max_salary?: string;
  required_qualifications?: any;
  required_skills?: any;
  responsibilities?: any;
  is_active?: boolean;
}

// ============================================================================
// API FUNCTIONS - DEPARTMENTS
// ============================================================================

export const departmentApi = {
  /**
   * List all departments with pagination and filtering
   */
  list: async (params?: {
    page?: number;
    search?: string;
    is_active?: boolean;
    parent_department?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<DepartmentListResponse>> => {
    const response = await get<PaginatedResponse<DepartmentListResponse>>('/departments/', { params });
    return response.data;
  },

  /**
   * Get detailed department information
   */
  retrieve: async (id: string): Promise<DepartmentDetailResponse> => {
    const response = await get<DepartmentDetailResponse>(`/hr/departments/${id}/`);
    return response.data;
  },

  /**
   * Create a new department
   */
  create: async (data: DepartmentCreateRequest): Promise<DepartmentDetailResponse> => {
    const response = await post<DepartmentDetailResponse>('/departments/', data);
    return response.data;
  },

  /**
   * Update a department (full update)
   */
  update: async (id: string, data: DepartmentCreateRequest): Promise<DepartmentDetailResponse> => {
    const response = await put<DepartmentDetailResponse>(`/hr/departments/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update a department
   */
  partialUpdate: async (id: string, data: Partial<DepartmentCreateRequest>): Promise<DepartmentDetailResponse> => {
    const response = await patch<DepartmentDetailResponse>(`/hr/departments/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a department
   */
  delete: async (id: string): Promise<void> => {
    await del(`/hr/departments/${id}/`);
  },
};

// ============================================================================
// API FUNCTIONS - DESIGNATIONS
// ============================================================================

export const designationApi = {
  /**
   * List all designations with pagination and filtering
   */
  list: async (params?: {
    page?: number;
    search?: string;
    is_active?: boolean;
    department?: string;
    level?: string;
    grade?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<DesignationListResponse>> => {
    const response = await get<PaginatedResponse<DesignationListResponse>>('/designations/', { params });
    return response.data;
  },

  /**
   * Get detailed designation information
   */
  retrieve: async (id: string): Promise<DesignationDetailResponse> => {
    const response = await get<DesignationDetailResponse>(`/hr/designations/${id}/`);
    return response.data;
  },

  /**
   * Create a new designation
   */
  create: async (data: DesignationCreateRequest): Promise<DesignationDetailResponse> => {
    const response = await post<DesignationDetailResponse>('/designations/', data);
    return response.data;
  },

  /**
   * Update a designation (full update)
   */
  update: async (id: string, data: DesignationCreateRequest): Promise<DesignationDetailResponse> => {
    const response = await put<DesignationDetailResponse>(`/hr/designations/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update a designation
   */
  partialUpdate: async (id: string, data: Partial<DesignationCreateRequest>): Promise<DesignationDetailResponse> => {
    const response = await patch<DesignationDetailResponse>(`/hr/designations/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a designation
   */
  delete: async (id: string): Promise<void> => {
    await del(`/hr/designations/${id}/`);
  },
};
