/**
 * Authentication API Service
 * Handles all authentication-related API calls
 */

import { post, get, tokenManager } from './client';
import type {
  TokenResponse,
  TokenRefreshResponse,
  UserResponse,
  ChangePasswordRequest,
  RegisterUserRequest,
  SuccessResponse,
} from './types';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Login with email and password
   * POST /api/auth/login/
   */
  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await post<TokenResponse>('/auth/login/', {
      email,
      password,
    });

    // Store tokens
    tokenManager.setTokens(response.data.access, response.data.refresh);

    return response.data;
  },

  /**
   * Refresh access token using refresh token
   * POST /api/auth/refresh/
   */
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await post<TokenRefreshResponse>('/auth/refresh/', {
      refresh: refreshToken,
    });

    // Update access token
    const currentRefresh = tokenManager.getRefreshToken();
    if (currentRefresh) {
      tokenManager.setTokens(response.data.access, currentRefresh);
    }

    return response.data;
  },

  /**
   * Get current authenticated user with employee profile
   * GET /api/auth/me/
   */
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await get<UserResponse>('/auth/me/');
    return response.data;
  },

  /**
   * Change password for current user
   * POST /api/auth/change-password/
   */
  changePassword: async (data: ChangePasswordRequest): Promise<SuccessResponse> => {
    const response = await post<SuccessResponse>('/auth/change-password/', data);
    return response.data;
  },

  /**
   * Register new user (admin-only)
   * POST /api/auth/register/
   */
  registerUser: async (data: RegisterUserRequest): Promise<{ message: string; user: UserResponse }> => {
    const response = await post<{ message: string; user: UserResponse }>('/auth/register/', data);
    return response.data;
  },

  /**
   * Logout user (client-side only, clears tokens)
   */
  logout: async (): Promise<void> => {
    tokenManager.clearTokens();

    // In production, you might want to blacklist the refresh token on the server
    // await post('/auth/logout/', { refresh: refreshToken });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = tokenManager.getAccessToken();
    if (!token) return false;

    // Check if token is expired
    return !tokenManager.isTokenExpired(token);
  },

  /**
   * Get access token
   */
  getAccessToken: (): string | null => {
    return tokenManager.getAccessToken();
  },

  /**
   * Get refresh token
   */
  getRefreshToken: (): string | null => {
    return tokenManager.getRefreshToken();
  },
};

export default authApi;
