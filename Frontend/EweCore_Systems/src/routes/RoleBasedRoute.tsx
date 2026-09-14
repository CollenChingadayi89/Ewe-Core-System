import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

/**
 * Route guard that checks if user has required role
 * Redirects to appropriate dashboard if unauthorized
 */
export const RoleBasedRoute = ({ children, allowedRoles, redirectTo }: RoleBasedRouteProps) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasRequiredRole = allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    // Redirect to role-appropriate dashboard
    const defaultRedirect = redirectTo || (
      user.role === 'employee' ? '/employee/dashboard' : '/dashboard'
    );
    return <Navigate to={defaultRedirect} replace />;
  }

  return <>{children}</>;
};

/**
 * Helper to check if user is a manager/approver
 */
export const isManager = (role: UserRole): boolean => {
  return ['manager', 'hr_manager', 'finance_manager', 'ceo', 'admin'].includes(role);
};

/**
 * Helper to check if user is an employee (non-manager)
 */
export const isEmployee = (role: UserRole): boolean => {
  return role === 'employee';
};

/**
 * Helper to check if user has HR permissions
 */
export const hasHRAccess = (role: UserRole): boolean => {
  return ['hr_manager', 'ceo', 'admin'].includes(role);
};

/**
 * Helper to check if user has Finance permissions
 */
export const hasFinanceAccess = (role: UserRole): boolean => {
  return ['finance_manager', 'ceo', 'admin'].includes(role);
};
