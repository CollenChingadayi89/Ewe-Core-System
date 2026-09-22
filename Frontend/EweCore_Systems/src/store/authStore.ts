import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/index';
import { authApi } from '../services/api/auth';
import type { UserResponse } from '../services/api/types';
import { message } from 'antd';

// Check if mock data is enabled via environment variable
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

/**
 * Map backend UserResponse to frontend User type
 */
const mapUserResponse = (userResponse: UserResponse): User => {
  const profile = userResponse.employee_profile;

  if (!profile) {
    // User exists but has no employee profile (shouldn't happen in production)
    return {
      id: userResponse.id,
      name: userResponse.email.split('@')[0], // Fallback to email username
      email: userResponse.email,
      role: userResponse.is_superuser ? 'admin' : 'employee',
      department: 'N/A',
      position: 'N/A',
      status: userResponse.is_active ? 'active' : 'inactive',
      joinDate: userResponse.date_joined,
    };
  }

  // Map with full employee profile
  return {
    id: profile.id,
    name: `${profile.first_name} ${profile.last_name}`,
    email: userResponse.email,
    role: profile.role as any, // Role from employee profile
    department: profile.department_name,
    position: profile.designation_name,
    avatar: profile.avatar || undefined,
    phone: profile.phone || undefined,
    joinDate: userResponse.date_joined,
    status: profile.is_active && userResponse.is_active ? 'active' : 'inactive',
  };
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      /**
       * Login with email and password
       * Uses real API if ENABLE_MOCK_DATA is false
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          // Use mock data if enabled
          if (ENABLE_MOCK_DATA) {
            const { mockEmployees } = await import('../mock/employees');
            const user = mockEmployees.find(emp => emp.email === email);

            if (user && password === 'password123') {
              set({ user, isAuthenticated: true, isLoading: false });
              message.success('Login successful (mock mode)');
              return true;
            }

            message.error('Invalid email or password');
            set({ isLoading: false });
            return false;
          }

          // Real API authentication
          await authApi.login(email, password);

          // Fetch current user profile
          const userResponse = await authApi.getCurrentUser();
          const user = mapUserResponse(userResponse);

          set({ user, isAuthenticated: true, isLoading: false });
          message.success(`Welcome back, ${user.name}!`);
          return true;
        } catch (error: any) {
          console.error('Login error:', error);

          // Error message already shown by API client interceptor
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        }
      },

      /**
       * Logout user
       * Clears tokens and user state
       */
      logout: async () => {
        try {
          if (!ENABLE_MOCK_DATA) {
            await authApi.logout();
          }

          set({ user: null, isAuthenticated: false });
          message.info('Logged out successfully');
        } catch (error) {
          console.error('Logout error:', error);
          // Still clear local state even if API call fails
          set({ user: null, isAuthenticated: false });
        }
      },

      /**
       * Refresh current user data from API
       * Useful after profile updates
       */
      refreshUser: async () => {
        if (ENABLE_MOCK_DATA) {
          console.log('Refresh user skipped in mock mode');
          return;
        }

        try {
          const userResponse = await authApi.getCurrentUser();
          const user = mapUserResponse(userResponse);

          set({ user, isAuthenticated: true });
        } catch (error) {
          console.error('Refresh user error:', error);

          // If refresh fails (e.g., token expired), logout
          set({ user: null, isAuthenticated: false });
        }
      },

      /**
       * Update user data in state
       * For optimistic updates before API confirmation
       */
      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      // Only persist user and isAuthenticated, not isLoading
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
