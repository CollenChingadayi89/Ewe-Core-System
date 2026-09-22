/**
 * Onboarding Store - Zustand state management for employee onboarding
 * Integrates with real API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { onboardingApi } from '../services/api/onboarding';
import type {
  OnboardingListResponse,
  OnboardingDetailResponse,
  OnboardingCreateRequest,
  OnboardingUpdateRequest,
  OnboardingFilters,
  OnboardingStatistics,
  ChecklistItem,
} from '../services/api/onboarding';
import { message } from 'antd';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface OnboardingState {
  // State
  onboardings: OnboardingListResponse[];
  myOnboarding: OnboardingDetailResponse | null;
  selectedOnboarding: OnboardingDetailResponse | null;
  statistics: OnboardingStatistics | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions - Standard CRUD
  fetchOnboardings: (filters?: OnboardingFilters) => Promise<void>;
  fetchOnboardingById: (id: string) => Promise<void>;
  createOnboarding: (data: OnboardingCreateRequest) => Promise<OnboardingDetailResponse | null>;
  updateOnboarding: (id: string, data: OnboardingUpdateRequest) => Promise<OnboardingDetailResponse | null>;
  deleteOnboarding: (id: string) => Promise<boolean>;

  // Actions - Custom Operations
  completeTask: (id: string, taskId: string, completedBy?: string, notes?: string) => Promise<boolean>;
  fetchMyOnboarding: () => Promise<void>;
  fetchStatistics: (filters?: { hr_coordinator?: string; start_date_after?: string; start_date_before?: string }) => Promise<void>;
  updateChecklist: (id: string, checklist: ChecklistItem[]) => Promise<OnboardingDetailResponse | null>;

  // Utility
  clearError: () => void;
  clearSelectedOnboarding: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial State
      onboardings: [],
      myOnboarding: null,
      selectedOnboarding: null,
      statistics: null,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // STANDARD CRUD ACTIONS
      // ========================================================================

      fetchOnboardings: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await onboardingApi.list({
            page: filters.page || 1,
            page_size: filters.page_size || 50,
            search: filters.search,
            employee: filters.employee,
            status: filters.status,
            hr_coordinator: filters.hr_coordinator,
            assigned_buddy: filters.assigned_buddy,
            start_date_after: filters.start_date_after,
            start_date_before: filters.start_date_before,
            ordering: filters.ordering || '-start_date',
          });

          set({
            onboardings: response.results,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / (filters.page_size || 50)),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch onboarding records:', error);
          set({
            error: error.message || 'Failed to fetch onboarding records',
            loading: false,
            onboardings: [],
          });
          message.error('Failed to load onboarding records');
        }
      },

      fetchOnboardingById: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await onboardingApi.retrieve(id);

          set({
            selectedOnboarding: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch onboarding details:', error);
          set({
            error: error.message || 'Failed to fetch onboarding details',
            loading: false,
          });
          message.error('Failed to load onboarding details');
        }
      },

      createOnboarding: async (data: OnboardingCreateRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await onboardingApi.create(data);

          set(state => ({
            onboardings: [response, ...state.onboardings],
            loading: false,
          }));

          message.success(`Onboarding "${response.onboarding_number}" created successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to create onboarding record:', error);
          set({
            error: error.message || 'Failed to create onboarding record',
            loading: false,
          });
          message.error('Failed to create onboarding record');
          return null;
        }
      },

      updateOnboarding: async (id: string, data: OnboardingUpdateRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await onboardingApi.partialUpdate(id, data);

          set(state => ({
            onboardings: state.onboardings.map(o =>
              o.id === id ? response : o
            ),
            selectedOnboarding: state.selectedOnboarding?.id === id ? response : state.selectedOnboarding,
            loading: false,
          }));

          message.success(`Onboarding "${response.onboarding_number}" updated successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to update onboarding record:', error);
          set({
            error: error.message || 'Failed to update onboarding record',
            loading: false,
          });
          message.error('Failed to update onboarding record');
          return null;
        }
      },

      deleteOnboarding: async (id: string) => {
        set({ loading: true, error: null });

        try {
          await onboardingApi.delete(id);

          set(state => ({
            onboardings: state.onboardings.filter(o => o.id !== id),
            loading: false,
          }));

          message.success('Onboarding record deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete onboarding record:', error);
          set({
            error: error.message || 'Failed to delete onboarding record',
            loading: false,
          });
          message.error('Failed to delete onboarding record');
          return false;
        }
      },

      // ========================================================================
      // CUSTOM OPERATION ACTIONS
      // ========================================================================

      completeTask: async (id: string, taskId: string, completedBy?: string, notes?: string) => {
        set({ loading: true, error: null });

        try {
          const response = await onboardingApi.completeTask(id, taskId, completedBy, notes);

          set(state => ({
            onboardings: state.onboardings.map(o =>
              o.id === id ? response.onboarding : o
            ),
            selectedOnboarding: state.selectedOnboarding?.id === id ? response.onboarding : state.selectedOnboarding,
            loading: false,
          }));

          message.success('Task completed successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to complete task:', error);
          set({
            error: error.message || 'Failed to complete task',
            loading: false,
          });
          message.error('Failed to complete task');
          return false;
        }
      },

      fetchMyOnboarding: async () => {
        set({ loading: true, error: null });

        try {
          const response = await onboardingApi.myOnboarding();

          set({
            myOnboarding: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch my onboarding:', error);
          set({
            error: error.message || 'Failed to fetch my onboarding',
            loading: false,
            myOnboarding: null,
          });
          // Don't show error message if user doesn't have onboarding record
          if (error.response?.status !== 404) {
            message.error('Failed to load your onboarding record');
          }
        }
      },

      fetchStatistics: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await onboardingApi.statistics(filters);

          set({
            statistics: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch onboarding statistics:', error);
          set({
            error: error.message || 'Failed to fetch onboarding statistics',
            loading: false,
          });
          message.error('Failed to load onboarding statistics');
        }
      },

      updateChecklist: async (id: string, checklist: ChecklistItem[]) => {
        set({ loading: true, error: null });

        try {
          const response = await onboardingApi.updateChecklist(id, checklist);

          set(state => ({
            onboardings: state.onboardings.map(o =>
              o.id === id ? response : o
            ),
            selectedOnboarding: state.selectedOnboarding?.id === id ? response : state.selectedOnboarding,
            loading: false,
          }));

          message.success('Checklist updated successfully');
          return response;
        } catch (error: any) {
          console.error('Failed to update checklist:', error);
          set({
            error: error.message || 'Failed to update checklist',
            loading: false,
          });
          message.error('Failed to update checklist');
          return null;
        }
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      clearError: () => set({ error: null }),

      clearSelectedOnboarding: () => set({ selectedOnboarding: null }),
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        onboardings: state.onboardings,
        myOnboarding: state.myOnboarding,
        statistics: state.statistics,
      }),
    }
  )
);
