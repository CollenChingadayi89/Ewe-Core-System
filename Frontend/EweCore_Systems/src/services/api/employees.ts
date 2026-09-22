/**
 * Employee API Service
 * Handles all employee-related API calls
 */

import { get, post, put, patch, del } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EmployeeListResponse {
  id: string;
  user: string;
  user_email: string;
  employee_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone: string;
  department: string;
  department_name: string;
  designation: string;
  designation_title: string;
  role: string;
  reports_to: string | null;
  manager_name: string | null;
  employment_status: 'probation' | 'permanent' | 'contract' | 'resigned' | 'terminated';
  join_date: string;
  avatar: string | null;
  is_active: boolean;
}

export interface EmployeeDetailResponse extends EmployeeListResponse {
  user_details: {
    id: string;
    email: string;
    is_active: boolean;
    last_login: string | null;
  };
  department_details: {
    id: string;
    code: string;
    name: string;
  };
  designation_details: {
    id: string;
    code: string;
    title: string;
    level: string | null;
  };
  manager_details: {
    id: string;
    employee_number: string;
    first_name: string;
    last_name: string;
    designation: string | null;
  } | null;
  current_salary: {
    id: string;
    basic_salary: string;
    currency: string;
    payment_frequency: string;
    housing_allowance: string;
    transport_allowance: string;
    medical_allowance: string;
    other_allowances: string;
    gross_salary: string;
    effective_from: string;
  } | null;
  date_of_birth: string | null;
  nationality: string;
  marital_status: string | null;
  religion: string | null;
  blood_group: string | null;
  number_of_children: number;
  spouse_employed: boolean;
  personal_email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  confirmation_date: string | null;
  probation_end_date: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  resignation_date: string | null;
  termination_date: string | null;
  exit_notes: string | null;
  passport_expiry_date: string | null;
  work_permit_expiry_date: string | null;
  bio: string | null;
  skills: any;
  certifications: any;
  education: any;
  experience: any;
  projects_assigned: number;
  tasks_completed: number;
  productivity_score: string | null;
  last_performance_review: string | null;
  next_performance_review: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreateRequest {
  user: string;
  employee_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  date_of_birth?: string;
  nationality: string;
  marital_status?: string;
  religion?: string;
  blood_group?: string;
  number_of_children?: number;
  spouse_employed?: boolean;
  phone: string;
  personal_email?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  department: string;
  designation: string;
  role: string;
  reports_to?: string;
  employment_status: 'probation' | 'permanent' | 'contract' | 'resigned' | 'terminated';
  join_date: string;
  confirmation_date?: string;
  probation_end_date?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  avatar?: string;
  bio?: string;
  skills?: any;
  certifications?: any;
  education?: any;
  experience?: any;
  is_active?: boolean;
}

export interface LeaveBalanceResponse {
  employee_id: string;
  employee_name: string;
  employee_number: string;
  balances: {
    leave_type: string;
    leave_type_name: string;
    total_accrued: number;
    total_used: number;
    total_approved_future: number;
    available_balance: number;
    policy_entitlement: number | null;
  }[];
}

export interface EmployeeSalaryResponse {
  id: string;
  employee: string;
  employee_name: string;
  basic_salary: string;
  currency: string;
  payment_frequency: 'monthly' | 'bi_weekly' | 'weekly' | 'annual';
  housing_allowance: string;
  transport_allowance: string;
  medical_allowance: string;
  other_allowances: string;
  gross_salary: string;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeBankDetailsResponse {
  id: string;
  employee: string;
  employee_name: string;
  bank_name: string;
  branch: string;
  branch_code: string;
  account_number: string;
  account_holder_name: string;
  swift_code: string | null;
  iban: string | null;
  account_type: 'savings' | 'checking' | 'current';
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeEmergencyContactResponse {
  id: string;
  employee: string;
  employee_name: string;
  name: string;
  relationship: string;
  phone: string;
  alternate_phone: string | null;
  email: string | null;
  address: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeTaxResponse {
  id: string;
  employee: string;
  employee_name: string;
  tax_reference_number: string | null;
  nssa_number: string | null;
  pension_fund_number: string | null;
  medical_aid_number: string | null;
  medical_aid_provider: string | null;
  tax_exemption_certificate: string | null;
  disability_exemption: boolean;
  number_of_dependents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocumentResponse {
  id: string;
  employee: string;
  employee_name: string;
  document_type: 'national_id' | 'passport' | 'birth_certificate' | 'education' | 'professional' | 'contract' | 'other';
  document_type_display: string;
  file: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  title: string | null;
  notes: string | null;
  expiry_date: string | null;
  is_expired: boolean;
  is_verified: boolean;
  verified_by: string | null;
  verified_by_name: string | null;
  verified_at: string | null;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const employeeApi = {
  /**
   * List all employees with pagination and filtering
   */
  list: async (params?: {
    page?: number;
    search?: string;
    is_active?: boolean;
    department?: string;
    designation?: string;
    role?: string;
    employment_status?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<EmployeeListResponse>> => {
    const response = await get<PaginatedResponse<EmployeeListResponse>>('/employees/', { params });
    return response.data;
  },

  /**
   * Get detailed employee information
   */
  retrieve: async (id: string): Promise<EmployeeDetailResponse> => {
    const response = await get<EmployeeDetailResponse>(`/employees/${id}/`);
    return response.data;
  },

  /**
   * Create a new employee
   */
  create: async (data: EmployeeCreateRequest): Promise<EmployeeDetailResponse> => {
    const response = await post<EmployeeDetailResponse>('/employees/', data);
    return response.data;
  },

  /**
   * Update an employee (full update)
   */
  update: async (id: string, data: EmployeeCreateRequest): Promise<EmployeeDetailResponse> => {
    const response = await put<EmployeeDetailResponse>(`/employees/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update an employee
   */
  partialUpdate: async (id: string, data: Partial<EmployeeCreateRequest>): Promise<EmployeeDetailResponse> => {
    const response = await patch<EmployeeDetailResponse>(`/employees/${id}/`, data);
    return response.data;
  },

  /**
   * Delete an employee (soft delete by setting is_active=false)
   */
  delete: async (id: string): Promise<void> => {
    await del(`/employees/${id}/`);
  },

  /**
   * Get employee's leave balances
   */
  leaveBalances: async (id: string): Promise<LeaveBalanceResponse> => {
    const response = await get<LeaveBalanceResponse>(`/employees/${id}/leave-balances/`);
    return response.data;
  },

  // ============================================================================
  // SALARY ENDPOINTS
  // ============================================================================

  /**
   * List salary records
   */
  listSalaries: async (params?: {
    page?: number;
    employee?: string;
    is_current?: boolean;
    currency?: string;
    payment_frequency?: string;
  }): Promise<PaginatedResponse<EmployeeSalaryResponse>> => {
    const response = await get<PaginatedResponse<EmployeeSalaryResponse>>('/employee-salaries/', { params });
    return response.data;
  },

  /**
   * Get salary details
   */
  retrieveSalary: async (id: string): Promise<EmployeeSalaryResponse> => {
    const response = await get<EmployeeSalaryResponse>(`/hr/salaries/${id}/`);
    return response.data;
  },

  /**
   * Create salary record
   */
  createSalary: async (data: Partial<EmployeeSalaryResponse>): Promise<EmployeeSalaryResponse> => {
    const response = await post<EmployeeSalaryResponse>('/employee-salaries/', data);
    return response.data;
  },

  /**
   * Update salary record
   */
  updateSalary: async (id: string, data: Partial<EmployeeSalaryResponse>): Promise<EmployeeSalaryResponse> => {
    const response = await put<EmployeeSalaryResponse>(`/hr/salaries/${id}/`, data);
    return response.data;
  },

  /**
   * Delete salary record
   */
  deleteSalary: async (id: string): Promise<void> => {
    await del(`/hr/salaries/${id}/`);
  },

  // ============================================================================
  // BANK DETAILS ENDPOINTS
  // ============================================================================

  /**
   * List bank details
   */
  listBankDetails: async (params?: {
    page?: number;
    employee?: string;
    is_primary?: boolean;
    is_active?: boolean;
  }): Promise<PaginatedResponse<EmployeeBankDetailsResponse>> => {
    const response = await get<PaginatedResponse<EmployeeBankDetailsResponse>>('/employee-bank-details/', { params });
    return response.data;
  },

  /**
   * Get bank details
   */
  retrieveBankDetails: async (id: string): Promise<EmployeeBankDetailsResponse> => {
    const response = await get<EmployeeBankDetailsResponse>(`/hr/bank-details/${id}/`);
    return response.data;
  },

  /**
   * Create bank details
   */
  createBankDetails: async (data: Partial<EmployeeBankDetailsResponse>): Promise<EmployeeBankDetailsResponse> => {
    const response = await post<EmployeeBankDetailsResponse>('/employee-bank-details/', data);
    return response.data;
  },

  /**
   * Update bank details
   */
  updateBankDetails: async (id: string, data: Partial<EmployeeBankDetailsResponse>): Promise<EmployeeBankDetailsResponse> => {
    const response = await put<EmployeeBankDetailsResponse>(`/hr/bank-details/${id}/`, data);
    return response.data;
  },

  /**
   * Delete bank details
   */
  deleteBankDetails: async (id: string): Promise<void> => {
    await del(`/hr/bank-details/${id}/`);
  },

  // ============================================================================
  // EMERGENCY CONTACTS ENDPOINTS
  // ============================================================================

  /**
   * List emergency contacts
   */
  listEmergencyContacts: async (params?: {
    page?: number;
    employee?: string;
    is_primary?: boolean;
  }): Promise<PaginatedResponse<EmployeeEmergencyContactResponse>> => {
    const response = await get<PaginatedResponse<EmployeeEmergencyContactResponse>>('/employee-emergency-contacts/', { params });
    return response.data;
  },

  /**
   * Get emergency contact
   */
  retrieveEmergencyContact: async (id: string): Promise<EmployeeEmergencyContactResponse> => {
    const response = await get<EmployeeEmergencyContactResponse>(`/hr/emergency-contacts/${id}/`);
    return response.data;
  },

  /**
   * Create emergency contact
   */
  createEmergencyContact: async (data: Partial<EmployeeEmergencyContactResponse>): Promise<EmployeeEmergencyContactResponse> => {
    const response = await post<EmployeeEmergencyContactResponse>('/employee-emergency-contacts/', data);
    return response.data;
  },

  /**
   * Update emergency contact
   */
  updateEmergencyContact: async (id: string, data: Partial<EmployeeEmergencyContactResponse>): Promise<EmployeeEmergencyContactResponse> => {
    const response = await put<EmployeeEmergencyContactResponse>(`/hr/emergency-contacts/${id}/`, data);
    return response.data;
  },

  /**
   * Delete emergency contact
   */
  deleteEmergencyContact: async (id: string): Promise<void> => {
    await del(`/hr/emergency-contacts/${id}/`);
  },

  // ============================================================================
  // TAX INFORMATION ENDPOINTS
  // ============================================================================

  /**
   * List tax information
   */
  listTaxInfo: async (params?: {
    page?: number;
    employee?: string;
    disability_exemption?: boolean;
  }): Promise<PaginatedResponse<EmployeeTaxResponse>> => {
    const response = await get<PaginatedResponse<EmployeeTaxResponse>>('/employee-tax/', { params });
    return response.data;
  },

  /**
   * Get tax information
   */
  retrieveTaxInfo: async (id: string): Promise<EmployeeTaxResponse> => {
    const response = await get<EmployeeTaxResponse>(`/hr/tax-info/${id}/`);
    return response.data;
  },

  /**
   * Create tax information
   */
  createTaxInfo: async (data: Partial<EmployeeTaxResponse>): Promise<EmployeeTaxResponse> => {
    const response = await post<EmployeeTaxResponse>('/employee-tax/', data);
    return response.data;
  },

  /**
   * Update tax information
   */
  updateTaxInfo: async (id: string, data: Partial<EmployeeTaxResponse>): Promise<EmployeeTaxResponse> => {
    const response = await put<EmployeeTaxResponse>(`/hr/tax-info/${id}/`, data);
    return response.data;
  },

  /**
   * Delete tax information
   */
  deleteTaxInfo: async (id: string): Promise<void> => {
    await del(`/hr/tax-info/${id}/`);
  },

  // ============================================================================
  // DOCUMENT ENDPOINTS
  // ============================================================================

  /**
   * List employee documents
   */
  listDocuments: async (params?: {
    page?: number;
    employee?: string;
    document_type?: string;
    is_verified?: boolean;
  }): Promise<PaginatedResponse<EmployeeDocumentResponse>> => {
    const response = await get<PaginatedResponse<EmployeeDocumentResponse>>('/employee-documents/', { params });
    return response.data;
  },

  /**
   * Get document details
   */
  retrieveDocument: async (id: string): Promise<EmployeeDocumentResponse> => {
    const response = await get<EmployeeDocumentResponse>(`/employee-documents/${id}/`);
    return response.data;
  },

  /**
   * Upload employee document
   */
  uploadDocument: async (
    employeeId: string,
    file: File,
    documentType: 'national_id' | 'passport' | 'birth_certificate' | 'education' | 'professional' | 'contract' | 'other',
    title?: string,
    notes?: string,
    expiryDate?: string
  ): Promise<EmployeeDocumentResponse> => {
    const formData = new FormData();
    formData.append('employee', employeeId);
    formData.append('document_type', documentType);
    formData.append('file', file);
    if (title) formData.append('title', title);
    if (notes) formData.append('notes', notes);
    if (expiryDate) formData.append('expiry_date', expiryDate);

    const response = await post<EmployeeDocumentResponse>('/employee-documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Update document metadata (not the file itself)
   */
  updateDocument: async (id: string, data: {
    title?: string;
    notes?: string;
    expiry_date?: string;
  }): Promise<EmployeeDocumentResponse> => {
    const response = await patch<EmployeeDocumentResponse>(`/employee-documents/${id}/`, data);
    return response.data;
  },

  /**
   * Delete document
   */
  deleteDocument: async (id: string): Promise<void> => {
    await del(`/employee-documents/${id}/`);
  },

  /**
   * Verify document (HR only)
   */
  verifyDocument: async (id: string): Promise<EmployeeDocumentResponse> => {
    const response = await post<EmployeeDocumentResponse>(`/employee-documents/${id}/verify/`, {});
    return response.data;
  },
};
