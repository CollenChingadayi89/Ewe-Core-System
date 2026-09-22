/**
 * Attendance Store - Zustand state management for attendance tracking
 * Integrates with real API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { attendanceApi } from '../services/api/attendance';
import type {
  AttendanceListResponse,
  AttendanceDetailResponse,
  AttendanceCreateRequest,
  AttendanceFilters,
  AttendanceStatistics,
} from '../services/api/attendance';
import { message } from 'antd';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface AttendanceState {
  // State
  attendanceRecords: AttendanceListResponse[];
  myAttendance: AttendanceListResponse[];
  selectedAttendance: AttendanceDetailResponse | null;
  statistics: AttendanceStatistics | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions - Standard CRUD
  fetchAttendance: (filters?: AttendanceFilters) => Promise<void>;
  fetchAttendanceById: (id: string) => Promise<void>;
  createAttendance: (data: AttendanceCreateRequest) => Promise<AttendanceDetailResponse | null>;
  updateAttendance: (id: string, data: Partial<AttendanceCreateRequest>) => Promise<AttendanceDetailResponse | null>;
  deleteAttendance: (id: string) => Promise<boolean>;

  // Actions - Custom Operations
  clockIn: (date?: string, notes?: string) => Promise<boolean>;
  clockOut: (notes?: string) => Promise<boolean>;
  fetchMyAttendance: (filters?: AttendanceFilters) => Promise<void>;
  fetchStatistics: (filters?: { employee?: string; date_after?: string; date_before?: string }) => Promise<void>;

  // Utility
  clearError: () => void;
  clearSelectedAttendance: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      // Initial State
      attendanceRecords: [],
      myAttendance: [],
      selectedAttendance: null,
      statistics: null,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // STANDARD CRUD ACTIONS
      // ========================================================================

      fetchAttendance: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await attendanceApi.list({
            page: filters.page || 1,
            page_size: filters.page_size || 50,
            search: filters.search,
            employee: filters.employee,
            status: filters.status,
            date: filters.date,
            date_after: filters.date_after,
            date_before: filters.date_before,
            ordering: filters.ordering || '-date',
          });

          set({
            attendanceRecords: response.results,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / (filters.page_size || 50)),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch attendance records:', error);
          set({
            error: error.message || 'Failed to fetch attendance records',
            loading: false,
            attendanceRecords: [],
          });
          message.error('Failed to load attendance records');
        }
      },

      fetchAttendanceById: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await attendanceApi.retrieve(id);

          set({
            selectedAttendance: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch attendance details:', error);
          set({
            error: error.message || 'Failed to fetch attendance details',
            loading: false,
          });
          message.error('Failed to load attendance details');
        }
      },

      createAttendance: async (data: AttendanceCreateRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await attendanceApi.create(data);

          set(state => ({
            attendanceRecords: [response, ...state.attendanceRecords],
            loading: false,
          }));

          message.success('Attendance record created successfully');
          return response;
        } catch (error: any) {
          console.error('Failed to create attendance record:', error);
          set({
            error: error.message || 'Failed to create attendance record',
            loading: false,
          });
          message.error('Failed to create attendance record');
          return null;
        }
      },

      updateAttendance: async (id: string, data: Partial<AttendanceCreateRequest>) => {
        set({ loading: true, error: null });

        try {
          const response = await attendanceApi.partialUpdate(id, data);

          set(state => ({
            attendanceRecords: state.attendanceRecords.map(a =>
              a.id === id ? response : a
            ),
            selectedAttendance: state.selectedAttendance?.id === id ? response : state.selectedAttendance,
            loading: false,
          }));

          message.success('Attendance record updated successfully');
          return response;
        } catch (error: any) {
          console.error('Failed to update attendance record:', error);
          set({
            error: error.message || 'Failed to update attendance record',
            loading: false,
          });
          message.error('Failed to update attendance record');
          return null;
        }
      },

      deleteAttendance: async (id: string) => {
        set({ loading: true, error: null });

        try {
          await attendanceApi.delete(id);

          set(state => ({
            attendanceRecords: state.attendanceRecords.filter(a => a.id !== id),
            loading: false,
          }));

          message.success('Attendance record deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete attendance record:', error);
          set({
            error: error.message || 'Failed to delete attendance record',
            loading: false,
          });
          message.error('Failed to delete attendance record');
          return false;
        }
      },

      // ========================================================================
      // CUSTOM OPERATION ACTIONS
      // ========================================================================

      clockIn: async (date?: string, notes?: string) => {
        set({ loading: true, error: null });

        try {
          const response = await attendanceApi.clockIn(date, notes);

          set(state => ({
            attendanceRecords: [response.attendance, ...state.attendanceRecords],
            myAttendance: [response.attendance, ...state.myAttendance],
            loading: false,
          }));

          message.success('Clocked in successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to clock in:', error);
          set({
            error: error.message || 'Failed to clock in',
            loading: false,
          });
          message.error('Failed to clock in');
          return false;
        }
      },

      clockOut: async (notes?: string) => {
        set({ loading: true, error: null });

        try {
          const response = await attendanceApi.clockOut(notes);

          set(state => ({
            attendanceRecords: state.attendanceRecords.map(a =>
              a.id === response.attendance.id ? response.attendance : a
            ),
            myAttendance: state.myAttendance.map(a =>
              a.id === response.attendance.id ? response.attendance : a
            ),
            loading: false,
          }));

          message.success('Clocked out successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to clock out:', error);
          set({
            error: error.message || 'Failed to clock out',
            loading: false,
          });
          message.error('Failed to clock out');
          return false;
        }
      },

      fetchMyAttendance: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await attendanceApi.myAttendance(filters);

          set({
            myAttendance: response.results,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch my attendance:', error);
          set({
            error: error.message || 'Failed to fetch my attendance',
            loading: false,
            myAttendance: [],
          });
          message.error('Failed to load your attendance records');
        }
      },

      fetchStatistics: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await attendanceApi.statistics(filters);

          set({
            statistics: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch attendance statistics:', error);
          set({
            error: error.message || 'Failed to fetch attendance statistics',
            loading: false,
          });
          message.error('Failed to load attendance statistics');
        }
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      clearError: () => set({ error: null }),

      clearSelectedAttendance: () => set({ selectedAttendance: null }),
    }),
    {
      name: 'attendance-storage',
      partialize: (state) => ({
        attendanceRecords: state.attendanceRecords,
        myAttendance: state.myAttendance,
        statistics: state.statistics,
      }),
    }
  )
);
