/**
 * Employee API Service
 * Complete API integration for all employee-related endpoints
 * Backend endpoints: /api/employees/, /api/employee-salaries/, etc.
 */

import axios from 'axios';
import type {
  EmployeeListItem,
  EmployeeDetail,
  EmployeeCreateUpdate,
  EmployeeSalary,
  EmployeeBankDetails,
  EmployeeEmergencyContact,
  EmployeeTax,
  EmployeeDocument,
  EmployeeDocumentCreate,
  EmployeeLeaveBalances,
  EmployeeFilters,
  SalaryFilters,
  BankDetailsFilters,
  EmergencyContactFilters,
  TaxFilters,
  DocumentFilters,
  PaginatedResponse,
  Department,
  Designation,
} from '../../types/employee';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ============================================================================
// AXIOS INSTANCE WITH AUTH
// ============================================================================

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// EMPLOYEE ENDPOINTS
// ============================================================================

export const employeeApi = {
  /**
   * GET /api/employees/
   * List employees with filters and pagination
   */
  list: async (filters?: EmployeeFilters): Promise<PaginatedResponse<EmployeeListItem>> => {
    const response = await api.get('/employees/', { params: filters });
    return response.data;
  },

  /**
   * GET /api/employees/{id}/
   * Get employee detail
   */
  get: async (id: string): Promise<EmployeeDetail> => {
    const response = await api.get(`/employees/${id}/`);
    return response.data;
  },

  /**
   * POST /api/employees/
   * Create new employee
   */
  create: async (data: EmployeeCreateUpdate): Promise<EmployeeDetail> => {
    const response = await api.post('/employees/', data);
    return response.data;
  },

  /**
   * PUT /api/employees/{id}/
   * Update employee (full update)
   */
  update: async (id: string, data: EmployeeCreateUpdate): Promise<EmployeeDetail> => {
    const response = await api.put(`/employees/${id}/`, data);
    return response.data;
  },

  /**
   * PATCH /api/employees/{id}/
   * Partial update employee
   */
  partialUpdate: async (id: string, data: Partial<EmployeeCreateUpdate>): Promise<EmployeeDetail> => {
    const response = await api.patch(`/employees/${id}/`, data);
    return response.data;
  },

  /**
   * DELETE /api/employees/{id}/
   * Delete employee
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/employees/${id}/`);
  },

  /**
   * GET /api/employees/{id}/leave-balances/
   * Get employee's leave balances (custom action)
   */
  getLeaveBalances: async (id: string): Promise<EmployeeLeaveBalances> => {
    const response = await api.get(`/employees/${id}/leave-balances/`);
    return response.data;
  },
};

// ============================================================================
// EMPLOYEE SALARY ENDPOINTS
// ============================================================================

export const salaryApi = {
  /**
   * GET /api/employee-salaries/
   */
  list: async (filters?: SalaryFilters): Promise<PaginatedResponse<EmployeeSalary>> => {
    const response = await api.get('/employee-salaries/', { params: filters });
    return response.data;
  },

  /**
   * GET /api/employee-salaries/{id}/
   */
  get: async (id: string): Promise<EmployeeSalary> => {
    const response = await api.get(`/employee-salaries/${id}/`);
    return response.data;
  },

  /**
   * POST /api/employee-salaries/
   */
  create: async (data: Partial<EmployeeSalary>): Promise<EmployeeSalary> => {
    const response = await api.post('/employee-salaries/', data);
    return response.data;
  },

  /**
   * PUT /api/employee-salaries/{id}/
   */
  update: async (id: string, data: Partial<EmployeeSalary>): Promise<EmployeeSalary> => {
    const response = await api.put(`/employee-salaries/${id}/`, data);
    return response.data;
  },

  /**
   * PATCH /api/employee-salaries/{id}/
   */
  partialUpdate: async (id: string, data: Partial<EmployeeSalary>): Promise<EmployeeSalary> => {
    const response = await api.patch(`/employee-salaries/${id}/`, data);
    return response.data;
  },

  /**
   * DELETE /api/employee-salaries/{id}/
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/employee-salaries/${id}/`);
  },
};

// ============================================================================
// EMPLOYEE BANK DETAILS ENDPOINTS
// ============================================================================

export const bankDetailsApi = {
  list: async (filters?: BankDetailsFilters): Promise<PaginatedResponse<EmployeeBankDetails>> => {
    const response = await api.get('/employee-bank-details/', { params: filters });
    return response.data;
  },

  get: async (id: string): Promise<EmployeeBankDetails> => {
    const response = await api.get(`/employee-bank-details/${id}/`);
    return response.data;
  },

  create: async (data: Partial<EmployeeBankDetails>): Promise<EmployeeBankDetails> => {
    const response = await api.post('/employee-bank-details/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<EmployeeBankDetails>): Promise<EmployeeBankDetails> => {
    const response = await api.put(`/employee-bank-details/${id}/`, data);
    return response.data;
  },

  partialUpdate: async (id: string, data: Partial<EmployeeBankDetails>): Promise<EmployeeBankDetails> => {
    const response = await api.patch(`/employee-bank-details/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/employee-bank-details/${id}/`);
  },
};

// ============================================================================
// EMPLOYEE EMERGENCY CONTACT ENDPOINTS
// ============================================================================

export const emergencyContactApi = {
  list: async (filters?: EmergencyContactFilters): Promise<PaginatedResponse<EmployeeEmergencyContact>> => {
    const response = await api.get('/employee-emergency-contacts/', { params: filters });
    return response.data;
  },

  get: async (id: string): Promise<EmployeeEmergencyContact> => {
    const response = await api.get(`/employee-emergency-contacts/${id}/`);
    return response.data;
  },

  create: async (data: Partial<EmployeeEmergencyContact>): Promise<EmployeeEmergencyContact> => {
    const response = await api.post('/employee-emergency-contacts/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<EmployeeEmergencyContact>): Promise<EmployeeEmergencyContact> => {
    const response = await api.put(`/employee-emergency-contacts/${id}/`, data);
    return response.data;
  },

  partialUpdate: async (id: string, data: Partial<EmployeeEmergencyContact>): Promise<EmployeeEmergencyContact> => {
    const response = await api.patch(`/employee-emergency-contacts/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/employee-emergency-contacts/${id}/`);
  },
};

// ============================================================================
// EMPLOYEE TAX INFO ENDPOINTS
// ============================================================================

export const taxApi = {
  list: async (filters?: TaxFilters): Promise<PaginatedResponse<EmployeeTax>> => {
    const response = await api.get('/employee-tax/', { params: filters });
    return response.data;
  },

  get: async (id: string): Promise<EmployeeTax> => {
    const response = await api.get(`/employee-tax/${id}/`);
    return response.data;
  },

  create: async (data: Partial<EmployeeTax>): Promise<EmployeeTax> => {
    const response = await api.post('/employee-tax/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<EmployeeTax>): Promise<EmployeeTax> => {
    const response = await api.put(`/employee-tax/${id}/`, data);
    return response.data;
  },

  partialUpdate: async (id: string, data: Partial<EmployeeTax>): Promise<EmployeeTax> => {
    const response = await api.patch(`/employee-tax/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/employee-tax/${id}/`);
  },
};

// ============================================================================
// EMPLOYEE DOCUMENT ENDPOINTS
// ============================================================================

export const documentApi = {
  list: async (filters?: DocumentFilters): Promise<PaginatedResponse<EmployeeDocument>> => {
    const response = await api.get('/employee-documents/', { params: filters });
    return response.data;
  },

  get: async (id: string): Promise<EmployeeDocument> => {
    const response = await api.get(`/employee-documents/${id}/`);
    return response.data;
  },

  /**
   * Create document with file upload
   * Uses multipart/form-data
   */
  create: async (data: EmployeeDocumentCreate): Promise<EmployeeDocument> => {
    const formData = new FormData();
    formData.append('employee', data.employee);
    formData.append('document_type', data.document_type);
    formData.append('file', data.file);
    if (data.title) formData.append('title', data.title);
    if (data.notes) formData.append('notes', data.notes);
    if (data.expiry_date) formData.append('expiry_date', data.expiry_date);

    const response = await api.post('/employee-documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update document metadata (not file itself)
   */
  update: async (id: string, data: Partial<EmployeeDocument>): Promise<EmployeeDocument> => {
    const response = await api.patch(`/employee-documents/${id}/`, data);
    return response.data;
  },

  /**
   * Delete document
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/employee-documents/${id}/`);
  },

  /**
   * POST /api/employee-documents/{id}/verify/
   * Verify document (HR only)
   */
  verify: async (id: string): Promise<EmployeeDocument> => {
    const response = await api.post(`/employee-documents/${id}/verify/`);
    return response.data;
  },
};

// ============================================================================
// DEPARTMENT & DESIGNATION ENDPOINTS (supporting data)
// ============================================================================

export const departmentApi = {
  list: async (params?: any): Promise<PaginatedResponse<Department>> => {
    const response = await api.get('/departments/', { params });
    return response.data;
  },

  get: async (id: string): Promise<Department> => {
    const response = await api.get(`/departments/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Department>): Promise<Department> => {
    const response = await api.post('/departments/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Department>): Promise<Department> => {
    const response = await api.put(`/departments/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/departments/${id}/`);
  },
};

export const designationApi = {
  list: async (params?: any): Promise<PaginatedResponse<Designation>> => {
    const response = await api.get('/designations/', { params });
    return response.data;
  },

  get: async (id: string): Promise<Designation> => {
    const response = await api.get(`/designations/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Designation>): Promise<Designation> => {
    const response = await api.post('/designations/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Designation>): Promise<Designation> => {
    const response = await api.put(`/designations/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/designations/${id}/`);
  },
};

// ============================================================================
// USER CREATION ENDPOINT (for Add Employee workflow)
// ============================================================================

export interface UserCreateData {
  email: string;
  password: string;
  password_confirm: string;
}

export interface UserCreatedResponse {
  message: string;
  user: {
    id: string;
    email: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    date_joined: string;
  };
}

export const userApi = {
  /**
   * POST /api/auth/register/
   * Create new user account (admin only)
   */
  create: async (data: UserCreateData): Promise<UserCreatedResponse> => {
    const response = await api.post('/auth/register/', data);
    return response.data;
  },
};

// ============================================================================
// LEAVE POLICY ENDPOINTS
// ============================================================================

export const leavePolicyApi = {
  /**
   * GET /api/leave-policies/
   * List leave policies with filters
   */
  list: async (params?: any): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/leave-policies/', { params });
    return response.data;
  },

  /**
   * GET /api/leave-policies/{id}/
   * Get leave policy details
   */
  get: async (id: string): Promise<any> => {
    const response = await api.get(`/leave-policies/${id}/`);
    return response.data;
  },

  /**
   * POST /api/leave-policies/
   * Create new leave policy (HR only)
   */
  create: async (data: any): Promise<any> => {
    const response = await api.post('/leave-policies/', data);
    return response.data;
  },

  /**
   * PUT /api/leave-policies/{id}/
   * Update leave policy (HR only)
   */
  update: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/leave-policies/${id}/`, data);
    return response.data;
  },

  /**
   * DELETE /api/leave-policies/{id}/
   * Delete leave policy (HR only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/leave-policies/${id}/`);
  },
};

// ============================================================================
// LEAVE REQUEST ENDPOINTS
// ============================================================================

export const leaveRequestApi = {
  /**
   * GET /api/leave-requests/
   * List leave requests with filters
   */
  list: async (params?: any): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/leave-requests/', { params });
    return response.data;
  },

  /**
   * GET /api/leave-requests/{id}/
   * Get leave request details
   */
  get: async (id: string): Promise<any> => {
    const response = await api.get(`/leave-requests/${id}/`);
    return response.data;
  },

  /**
   * POST /api/leave-requests/
   * Create new leave request
   */
  create: async (data: any): Promise<any> => {
    const response = await api.post('/leave-requests/', data);
    return response.data;
  },

  /**
   * POST /api/leave-requests/{id}/approve/
   * Approve leave request
   */
  approve: async (id: string, notes?: string): Promise<any> => {
    const response = await api.post(`/leave-requests/${id}/approve/`, { notes });
    return response.data;
  },

  /**
   * POST /api/leave-requests/{id}/reject/
   * Reject leave request
   */
  reject: async (id: string, notes: string): Promise<any> => {
    const response = await api.post(`/leave-requests/${id}/reject/`, { notes });
    return response.data;
  },

  /**
   * POST /api/leave-requests/{id}/cancel/
   * Cancel leave request
   */
  cancel: async (id: string, reason: string): Promise<any> => {
    const response = await api.post(`/leave-requests/${id}/cancel/`, { reason });
    return response.data;
  },

  /**
   * POST /api/leave-requests/calculate-working-days/
   * Calculate working days for leave period
   */
  calculateDays: async (data: {
    start_date: string;
    end_date: string;
    leave_policy_id: string;
    is_half_day: boolean;
  }): Promise<{
    start_date: string;
    end_date: string;
    total_days: number;
    working_days: number;
    weekends_excluded: number;
    public_holidays_excluded: number;
    policy_counts_weekends: boolean;
    policy_counts_holidays: boolean;
  }> => {
    const response = await api.post('/leave-requests/calculate-working-days/', data);
    return response.data;
  },
};

// ============================================================================
// LEAVE TRANSACTION/BALANCE ENDPOINTS
// ============================================================================

export const leaveBalanceApi = {
  /**
   * GET /api/leave-transactions/balance/
   * Get employee leave balance for specific policy
   */
  get: async (params: { employee: string; leave_policy: string }): Promise<{
    total_accrued: number;
    total_used: number;
    total_pending: number;
    available_balance: number;
  }> => {
    const response = await api.get('/leave-transactions/balance/', { params });
    return response.data;
  },
};

export const leaveTransactionApi = {
  /**
   * GET /api/leave-transactions/
   * List leave transactions (ledger)
   */
  list: async (params?: any): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/leave-transactions/', { params });
    return response.data;
  },

  /**
   * POST /api/leave-transactions/create-transaction/
   * Create a single leave accrual or adjustment transaction (HR only)
   */
  createTransaction: async (data: {
    employee: string;
    leave_policy: string;
    transaction_type: 'accrual' | 'adjustment';
    days: number;
    transaction_date?: string;
    reference_number?: string;
    notes: string;
  }): Promise<any> => {
    const response = await api.post('/leave-transactions/create-transaction/', data);
    return response.data;
  },

  /**
   * POST /api/leave-transactions/bulk-accrual/
   * Create accrual transactions for multiple employees at once (HR only)
   */
  bulkAccrual: async (data: {
    employee_ids: string[];
    leave_policy: string;
    days: number;
    transaction_date?: string;
    notes: string;
  }): Promise<{
    success: boolean;
    created_count: number;
    transactions: any[];
    errors: any[];
  }> => {
    const response = await api.post('/leave-transactions/bulk-accrual/', data);
    return response.data;
  },
};

// ============================================================================
// PUBLIC HOLIDAY ENDPOINTS
// ============================================================================

export const publicHolidayApi = {
  /**
   * GET /api/public-holidays/
   * List public holidays
   */
  list: async (params?: any): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/public-holidays/', { params });
    return response.data;
  },

  /**
   * POST /api/public-holidays/
   * Create public holiday (HR only)
   */
  create: async (data: any): Promise<any> => {
    const response = await api.post('/public-holidays/', data);
    return response.data;
  },

  /**
   * DELETE /api/public-holidays/{id}/
   * Delete public holiday (HR only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/public-holidays/${id}/`);
  },
};

// ============================================================================
// WORKING HOURS ENDPOINTS
// ============================================================================

export const workingHoursApi = {
  /**
   * GET /api/working-hours/?is_default=true
   * Get default working hours configuration
   */
  get: async (): Promise<any> => {
    const response = await api.get('/working-hours/', { params: { is_default: true } });
    return response.data.results?.[0] || null;
  },

  /**
   * PUT /api/working-hours/{id}/
   * Update working hours configuration (HR only)
   */
  update: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/working-hours/${id}/`, data);
    return response.data;
  },
};

// ============================================================================
// LEAVE YEAR CONFIG ENDPOINTS (Singleton)
// ============================================================================

export const leaveYearConfigApi = {
  /**
   * GET /api/leave-year-config/
   * Get leave year configuration (singleton)
   */
  get: async (): Promise<any> => {
    const response = await api.get('/leave-year-config/');
    return response.data.results?.[0] || response.data;
  },

  /**
   * PUT /api/leave-year-config/{id}/
   * Update leave year configuration (HR only)
   */
  update: async (data: any): Promise<any> => {
    const response = await api.put('/leave-year-config/1/', data);
    return response.data;
  },
};

// ============================================================================
// LEAVE NOTIFICATION SETTINGS ENDPOINTS (Singleton)
// ============================================================================

export const leaveNotificationSettingsApi = {
  /**
   * GET /api/leave-notification-settings/
   * Get notification settings (singleton)
   */
  get: async (): Promise<any> => {
    const response = await api.get('/leave-notification-settings/');
    return response.data.results?.[0] || response.data;
  },

  /**
   * PUT /api/leave-notification-settings/{id}/
   * Update notification settings (HR only)
   */
  update: async (data: any): Promise<any> => {
    const response = await api.put('/leave-notification-settings/1/', data);
    return response.data;
  },
};

// ============================================================================
// LEAVE CALENDAR SETTINGS ENDPOINTS (Singleton)
// ============================================================================

export const leaveCalendarSettingsApi = {
  /**
   * GET /api/leave-calendar-settings/
   * Get calendar display settings (singleton)
   */
  get: async (): Promise<any> => {
    const response = await api.get('/leave-calendar-settings/');
    return response.data.results?.[0] || response.data;
  },

  /**
   * PUT /api/leave-calendar-settings/{id}/
   * Update calendar settings (HR only)
   */
  update: async (data: any): Promise<any> => {
    const response = await api.put('/leave-calendar-settings/1/', data);
    return response.data;
  },
};

// ============================================================================
// APPROVAL GROUP ENDPOINTS
// ============================================================================

export const approvalGroupApi = {
  /**
   * GET /api/approval-groups/
   * List approval groups
   */
  list: async (params?: any): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/approval-groups/', { params });
    return response.data;
  },

  /**
   * GET /api/approval-groups/{id}/
   * Get approval group details with members
   */
  get: async (id: string): Promise<any> => {
    const response = await api.get(`/approval-groups/${id}/`);
    return response.data;
  },

  /**
   * POST /api/approval-groups/
   * Create new approval group
   */
  create: async (data: any): Promise<any> => {
    const response = await api.post('/approval-groups/', data);
    return response.data;
  },

  /**
   * PUT /api/approval-groups/{id}/
   * Update approval group
   */
  update: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/approval-groups/${id}/`, data);
    return response.data;
  },

  /**
   * DELETE /api/approval-groups/{id}/
   * Delete approval group
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/approval-groups/${id}/`);
  },

  /**
   * POST /api/approval-groups/{id}/add-member/
   * Add employee to group
   */
  addMember: async (groupId: string, employeeId: string, role: string = 'member'): Promise<any> => {
    const response = await api.post(`/approval-groups/${groupId}/add-member/`, {
      employee_id: employeeId,
      role: role
    });
    return response.data;
  },

  /**
   * POST /api/approval-groups/{id}/remove-member/
   * Remove employee from group
   */
  removeMember: async (groupId: string, employeeId: string): Promise<any> => {
    const response = await api.post(`/approval-groups/${groupId}/remove-member/`, {
      employee_id: employeeId
    });
    return response.data;
  },

  /**
   * GET /api/approval-groups/{id}/members/
   * Get all members of the group
   */
  getMembers: async (groupId: string): Promise<any> => {
    const response = await api.get(`/approval-groups/${groupId}/members/`);
    return response.data;
  },

  /**
   * GET /api/approval-groups/employee-groups/
   * Get all employees with their current approval group
   * Used for drag-and-drop member management
   */
  getEmployeeGroups: async (): Promise<any[]> => {
    const response = await api.get('/approval-groups/employee-groups/');
    return response.data;
  },
};

// ============================================================================
// APPROVAL WORKFLOW ENDPOINTS
// ============================================================================

export const approvalWorkflowApi = {
  /**
   * GET /api/approval-workflows/
   * List approval workflows
   */
  list: async (params?: any): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/approval-workflows/', { params });
    return response.data;
  },

  /**
   * POST /api/approval-workflows/
   * Create approval workflow (HR only)
   */
  create: async (data: any): Promise<any> => {
    const response = await api.post('/approval-workflows/', data);
    return response.data;
  },

  /**
   * PUT /api/approval-workflows/{id}/
   * Update approval workflow (HR only)
   */
  update: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/approval-workflows/${id}/`, data);
    return response.data;
  },

  /**
   * DELETE /api/approval-workflows/{id}/
   * Delete approval workflow (HR only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/approval-workflows/${id}/`);
  },
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  employees: employeeApi,
  salaries: salaryApi,
  bankDetails: bankDetailsApi,
  emergencyContacts: emergencyContactApi,
  tax: taxApi,
  documents: documentApi,
  departments: departmentApi,
  designations: designationApi,
  users: userApi,
  leavePolicies: leavePolicyApi,
  leaveRequests: leaveRequestApi,
  leaveBalance: leaveBalanceApi,
  leaveTransactions: leaveTransactionApi,
  publicHolidays: publicHolidayApi,
  workingHours: workingHoursApi,
  leaveYearConfig: leaveYearConfigApi,
  leaveNotificationSettings: leaveNotificationSettingsApi,
  leaveCalendarSettings: leaveCalendarSettingsApi,
  approvalGroups: approvalGroupApi,
  approvalWorkflows: approvalWorkflowApi,
};
