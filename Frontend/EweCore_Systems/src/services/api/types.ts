/**
 * API Response Types
 * Defines standard response structures from the Django REST Framework backend
 */

/**
 * Standard paginated response from DRF
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * JWT Token response from /api/auth/login/
 */
export interface TokenResponse {
  access: string;
  refresh: string;
}

/**
 * Token refresh response from /api/auth/refresh/
 */
export interface TokenRefreshResponse {
  access: string;
}

/**
 * User with employee profile from /api/auth/me/
 */
export interface UserResponse {
  id: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  email_verified: boolean;
  is_2fa_enabled: boolean;
  date_joined: string;
  last_login: string | null;
  employee_profile: EmployeeProfileResponse | null;
}

/**
 * Nested employee profile in user response
 */
export interface EmployeeProfileResponse {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  department_id: string;
  department_name: string;
  designation_id: string;
  designation_name: string;
  role: string;
  employment_status: string;
  phone: string | null;
  is_active: boolean;
}

/**
 * Change password request payload
 */
export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

/**
 * User registration request (admin-only)
 */
export interface RegisterUserRequest {
  email: string;
  password: string;
  password_confirm: string;
}

/**
 * Generic success response
 */
export interface SuccessResponse {
  message: string;
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  detail?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * API Error with detailed information
 */
export interface APIError extends Error {
  status?: number;
  data?: ErrorResponse;
}
