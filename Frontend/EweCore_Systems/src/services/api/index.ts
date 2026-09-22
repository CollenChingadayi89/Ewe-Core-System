/**
 * API Services Index
 * Central export point for all API service modules
 */

// Export client and utilities
export { default as apiClient, tokenManager } from './client';
export * from './client';

// Export types
export * from './types';

// Export authentication
export { authApi } from './auth';
export type {
  TokenResponse,
  TokenRefreshResponse,
  UserResponse,
  EmployeeProfileResponse,
  ChangePasswordRequest,
  RegisterUserRequest,
  SuccessResponse,
  ErrorResponse,
} from './types';

// Export HR services
export { departmentApi } from './departments';
export { employeeApi } from './employees';
export { leaveApi } from './leave';

// Export finance services
export { receivableApi, receivablePaymentApi } from './receivables';
export { payableApi } from './payables';
export { invoiceApi, estimateApi, paymentApi } from './finance-documents';
export { expenseApi } from './expenses';
export { pettyCashApi } from './petty-cash';
export { procurementApi } from './procurement';

// Export asset services
export { assetApi } from './assets';
export { vehicleApi } from './vehicles';

// Export document services
export { documentApi, documentCategoryApi } from './documents';

// Export approval services
export { approvalApi } from './approval';
