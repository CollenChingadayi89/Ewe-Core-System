/**
 * Employee Type Definitions
 * These types match the Django backend models EXACTLY
 * Backend: hr_employee app (models.py, serializers.py)
 */

// ============================================================================
// ENUMS & CONSTANTS (must match Backend core/constants.py)
// ============================================================================

export type UserRole = 'employee' | 'manager' | 'hr_manager' | 'finance_manager' | 'ceo' | 'admin';

export type EmploymentStatus =
  | 'permanent'
  | 'contract'
  | 'probation'
  | 'intern'
  | 'terminated'
  | 'resigned';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export type Currency = 'ZWG';

export type AccountType = 'savings' | 'checking';

export type DocumentType =
  | 'national_id'
  | 'passport'
  | 'birth_certificate'
  | 'education'
  | 'professional'
  | 'contract'
  | 'other';

// ============================================================================
// USER MODEL (from accounts app)
// ============================================================================

export interface User {
  id: string; // UUID
  email: string;
  is_active: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  date_joined: string; // ISO DateTime
  last_login: string | null; // ISO DateTime

  // 2FA fields
  is_2fa_enabled: boolean;
  last_2fa_verification: string | null;

  // Email verification
  email_verified: boolean;

  // Security
  failed_login_attempts: number;
  last_failed_login: string | null;
  account_locked_until: string | null;
  last_password_change: string | null;
}

// Brief user info for nested serializers
export interface UserBrief {
  id: string;
  email: string;
  is_active: boolean;
  last_login: string | null;
}

// ============================================================================
// DEPARTMENT & DESIGNATION (from hr_department app)
// ============================================================================

export interface Department {
  id: string; // UUID
  code: string; // e.g., "DEPT001"
  name: string;
  description: string | null;
  manager: string | null; // Employee ID (UUID)
  parent_department: string | null; // Department ID (UUID)
  employee_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentBrief {
  id: string;
  code: string;
  name: string;
}

export interface Designation {
  id: string; // UUID
  code: string; // e.g., "DES001"
  title: string;
  department: string; // Department ID (UUID)
  level: string | null; // e.g., "Junior", "Senior", "Manager"
  grade: string | null; // e.g., "G1", "M2", "E1"
  salary_range_min: number | null;
  salary_range_max: number | null;
  description: string | null;
  requirements: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DesignationBrief {
  id: string;
  code: string;
  title: string;
  level: string | null;
}

// ============================================================================
// EMPLOYEE MODEL (from hr_employee app)
// ============================================================================

/**
 * Employee List Serializer
 * Lightweight for list views - excludes sensitive fields
 */
export interface EmployeeListItem {
  id: string; // UUID
  user: string; // User ID (UUID)
  user_email: string;
  employee_number: string; // e.g., "EMP001"
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: Gender | null;
  phone: string | null;
  department: string; // Department ID (UUID)
  department_name: string;
  designation: string; // Designation ID (UUID)
  designation_title: string;
  role: UserRole;
  reports_to: string | null; // Employee ID (UUID)
  manager_name: string | null;
  employment_status: EmploymentStatus;
  join_date: string; // Date (YYYY-MM-DD)
  avatar: string | null; // URL to avatar image
  is_active: boolean;
}

/**
 * Manager Details for nested display
 */
export interface ManagerBrief {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  designation: string | null;
}

/**
 * Current Salary Info (only returned for HR/employee themselves)
 */
export interface CurrentSalary {
  id: string;
  basic_salary: number;
  currency: Currency;
  payment_frequency: PaymentFrequency;
  housing_allowance: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  gross_salary: number; // Calculated field
  effective_from: string; // Date
}

/**
 * Employee Detail Serializer
 * Comprehensive data for detail views
 */
export interface EmployeeDetail {
  // Basic Info
  id: string;
  user: string; // User ID
  user_details: UserBrief;
  employee_number: string;

  // Personal Info
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: Gender | null;
  date_of_birth: string | null; // Date
  nationality: string | null;
  marital_status: MaritalStatus | null;
  religion: string | null;
  blood_group: BloodGroup | null;
  number_of_children: number | null;
  spouse_employed: boolean | null;

  // Contact Info
  phone: string | null;
  personal_email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;

  // Employment Info
  department: string; // ID
  department_details: DepartmentBrief;
  designation: string; // ID
  designation_details: DesignationBrief;
  role: UserRole;
  reports_to: string | null; // Employee ID
  manager_details: ManagerBrief | null;
  employment_status: EmploymentStatus;
  join_date: string; // Date
  confirmation_date: string | null;
  probation_end_date: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  resignation_date: string | null;
  termination_date: string | null;
  exit_notes: string | null;

  // Documents (sensitive IDs excluded - use separate endpoint)
  passport_expiry_date: string | null;
  work_permit_expiry_date: string | null;

  // Profile
  avatar: string | null;
  bio: string | null;
  skills: string[]; // JSONField
  certifications: string[]; // JSONField
  education: any[]; // JSONField
  experience: any[]; // JSONField

  // Performance
  projects_assigned: number | null;
  tasks_completed: number | null;
  productivity_score: number | null; // Decimal
  last_performance_review: string | null; // Date
  next_performance_review: string | null; // Date

  // Status
  is_active: boolean;
  created_at: string; // ISO DateTime
  updated_at: string; // ISO DateTime

  // Nested Data (conditionally returned based on permissions)
  current_salary: CurrentSalary | null;
}

/**
 * Employee Create/Update Payload
 */
export interface EmployeeCreateUpdate {
  user: string; // User ID (UUID)
  employee_number: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  gender?: Gender | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  marital_status?: MaritalStatus | null;
  religion?: string | null;
  blood_group?: BloodGroup | null;
  number_of_children?: number | null;
  spouse_employed?: boolean | null;
  phone?: string | null;
  personal_email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string;
  department: string; // UUID
  designation: string; // UUID
  role?: UserRole;
  reports_to?: string | null; // Employee UUID
  employment_status?: EmploymentStatus;
  join_date: string; // Date
  confirmation_date?: string | null;
  probation_end_date?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  avatar?: File | string | null;
  bio?: string | null;
  skills?: string[];
  certifications?: string[];
  education?: any[];
  experience?: any[];
  is_active?: boolean;
}

// ============================================================================
// EMPLOYEE SALARY
// ============================================================================

export interface EmployeeSalary {
  id: string;
  employee: string; // Employee ID
  employee_name: string; // Readonly
  basic_salary: number;
  currency: Currency;
  payment_frequency: PaymentFrequency;
  housing_allowance: number;
  transport_allowance: number;
  medical_allowance: number;
  other_allowances: number;
  gross_salary: number; // Calculated
  effective_from: string; // Date
  effective_to: string | null; // Date
  notes: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EMPLOYEE BANK DETAILS
// ============================================================================

export interface EmployeeBankDetails {
  id: string;
  employee: string; // Employee ID
  employee_name: string; // Readonly
  bank_name: string;
  branch: string | null;
  branch_code: string | null;
  account_number: string; // Encrypted in backend
  account_holder_name: string;
  swift_code: string | null;
  iban: string | null;
  account_type: AccountType;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EMPLOYEE EMERGENCY CONTACT
// ============================================================================

export interface EmployeeEmergencyContact {
  id: string;
  employee: string; // Employee ID
  employee_name: string; // Readonly
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

// ============================================================================
// EMPLOYEE TAX INFO
// ============================================================================

export interface EmployeeTax {
  id: string;
  employee: string; // Employee ID
  employee_name: string; // Readonly
  tax_reference_number: string | null; // TIN - encrypted
  nssa_number: string | null; // NSSA - encrypted
  pension_fund_number: string | null; // Encrypted
  medical_aid_number: string | null; // Encrypted
  medical_aid_provider: string | null;
  tax_exemption_certificate: string | null;
  disability_exemption: boolean;
  number_of_dependents: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EMPLOYEE DOCUMENT
// ============================================================================

export interface EmployeeDocument {
  id: string;
  employee: string; // Employee ID
  employee_name: string; // Readonly
  document_type: DocumentType;
  document_type_display: string; // Human-readable
  file: string; // File field (URL)
  file_url: string; // Full URL
  file_name: string;
  file_size: number; // Bytes
  file_type: string; // MIME type
  title: string | null;
  notes: string | null;
  expiry_date: string | null; // Date
  is_expired: boolean; // Calculated
  is_verified: boolean;
  verified_by: string | null; // User ID
  verified_by_name: string | null; // Readonly
  verified_at: string | null; // DateTime
  uploaded_by: string; // User ID
  uploaded_by_name: string; // Readonly
  created_at: string;
  updated_at: string;
}

export interface EmployeeDocumentCreate {
  employee: string; // Employee UUID
  document_type: DocumentType;
  file: File;
  title?: string | null;
  notes?: string | null;
  expiry_date?: string | null;
}

// ============================================================================
// LEAVE BALANCES (from leave-balances custom action)
// ============================================================================

export interface LeaveBalance {
  leave_type: string;
  leave_type_name: string;
  total_accrued: number;
  total_used: number;
  total_approved_future: number;
  available_balance: number;
  policy_entitlement: number | null;
}

export interface EmployeeLeaveBalances {
  employee_id: string;
  employee_name: string;
  employee_number: string;
  balances: LeaveBalance[];
}

// ============================================================================
// API FILTER & SEARCH PARAMS
// ============================================================================

export interface EmployeeFilters {
  is_active?: boolean;
  department?: string; // UUID
  designation?: string; // UUID
  role?: UserRole;
  employment_status?: EmploymentStatus;
  gender?: Gender;
  marital_status?: MaritalStatus;
  search?: string; // Searches: employee_number, first_name, last_name, email, phone
  ordering?: string; // e.g., "employee_number", "-join_date"
  page?: number;
  page_size?: number;
}

export interface SalaryFilters {
  employee?: string;
  is_current?: boolean;
  currency?: Currency;
  payment_frequency?: PaymentFrequency;
  search?: string;
  ordering?: string;
}

export interface BankDetailsFilters {
  employee?: string;
  is_primary?: boolean;
  is_active?: boolean;
  account_type?: AccountType;
  search?: string;
}

export interface EmergencyContactFilters {
  employee?: string;
  is_primary?: boolean;
  relationship?: string;
  search?: string;
}

export interface TaxFilters {
  employee?: string;
  disability_exemption?: boolean;
  medical_aid_provider?: string;
  search?: string;
}

export interface DocumentFilters {
  employee?: string;
  document_type?: DocumentType;
  is_verified?: boolean;
  search?: string;
  ordering?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [field: string]: any;
}
