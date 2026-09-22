/**
 * Attendance API Service
 * Handles employee attendance tracking, clock in/out operations
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface AttendanceListResponse {
  id: string;
  employee: string;
  employee_name: string;
  employee_department: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  status_display: string;
  total_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceDetailResponse extends AttendanceListResponse {
  employee_email: string;
  employee_position: string;
}

export interface AttendanceCreateRequest {
  employee?: string;
  date: string;
  time_in?: string;
  time_out?: string;
  status?: string;
  notes?: string;
}

export interface AttendanceFilters {
  page?: number;
  page_size?: number;
  search?: string;
  employee?: string;
  status?: string;
  date?: string;
  date_after?: string;
  date_before?: string;
  ordering?: string;
}

export interface AttendanceStatistics {
  total_present: number;
  total_absent: number;
  total_late: number;
  total_on_leave: number;
  average_hours: number;
  attendance_rate: number;
}

export interface ClockInOutResponse {
  success: boolean;
  message: string;
  attendance: AttendanceDetailResponse;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const attendanceApi = {
  /**
   * List attendance records with optional filtering
   */
  list: async (filters?: AttendanceFilters): Promise<PaginatedResponse<AttendanceListResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.employee) params.append('employee', filters.employee);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.date) params.append('date', filters.date);
    if (filters?.date_after) params.append('date_after', filters.date_after);
    if (filters?.date_before) params.append('date_before', filters.date_before);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/attendance/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single attendance record by ID
   */
  retrieve: async (id: string): Promise<AttendanceDetailResponse> => {
    const response = await apiClient.get(`/attendance/${id}/`);
    return response.data;
  },

  /**
   * Create new attendance record
   */
  create: async (data: AttendanceCreateRequest): Promise<AttendanceDetailResponse> => {
    const response = await apiClient.post('/attendance/', data);
    return response.data;
  },

  /**
   * Update existing attendance record
   */
  update: async (id: string, data: Partial<AttendanceCreateRequest>): Promise<AttendanceDetailResponse> => {
    const response = await apiClient.put(`/attendance/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update attendance record
   */
  partialUpdate: async (id: string, data: Partial<AttendanceCreateRequest>): Promise<AttendanceDetailResponse> => {
    const response = await apiClient.patch(`/attendance/${id}/`, data);
    return response.data;
  },

  /**
   * Delete attendance record
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/attendance/${id}/`);
  },

  /**
   * Clock in - Record employee's arrival time
   */
  clockIn: async (date?: string, notes?: string): Promise<ClockInOutResponse> => {
    const response = await apiClient.post('/attendance/clock_in/', {
      date: date || new Date().toISOString().split('T')[0],
      notes,
    });
    return response.data;
  },

  /**
   * Clock out - Record employee's departure time
   */
  clockOut: async (notes?: string): Promise<ClockInOutResponse> => {
    const response = await apiClient.post('/attendance/clock_out/', {
      date: new Date().toISOString().split('T')[0],
      notes,
    });
    return response.data;
  },

  /**
   * Get current user's attendance records
   */
  myAttendance: async (filters?: AttendanceFilters): Promise<PaginatedResponse<AttendanceListResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.date) params.append('date', filters.date);
    if (filters?.date_after) params.append('date_after', filters.date_after);
    if (filters?.date_before) params.append('date_before', filters.date_before);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/attendance/my_attendance/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get attendance statistics
   */
  statistics: async (filters?: {
    employee?: string;
    date_after?: string;
    date_before?: string;
  }): Promise<AttendanceStatistics> => {
    const params = new URLSearchParams();
    if (filters?.employee) params.append('employee', filters.employee);
    if (filters?.date_after) params.append('date_after', filters.date_after);
    if (filters?.date_before) params.append('date_before', filters.date_before);

    const response = await apiClient.get(`/attendance/statistics/?${params.toString()}`);
    return response.data;
  },
};
