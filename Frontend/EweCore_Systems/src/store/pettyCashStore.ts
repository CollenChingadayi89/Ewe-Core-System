/**
 * Petty Cash Store - Zustand state management for petty cash disbursements
 * Integrates with real API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pettyCashApi } from '../services/api/petty-cash';
import type {
  PettyCashListResponse,
  PettyCashDetailResponse,
  PettyCashCreateRequest,
  PettyCashFilters,
} from '../services/api/petty-cash';
import { message } from 'antd';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface PettyCashState {
  // State
  pettyCashRequests: PettyCashListResponse[];
  selectedRequest: PettyCashDetailResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions
  fetchRequests: (filters?: PettyCashFilters) => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  createRequest: (data: PettyCashCreateRequest, files?: File[]) => Promise<PettyCashDetailResponse | null>;
  updateRequest: (id: string, data: Partial<PettyCashCreateRequest>) => Promise<PettyCashDetailResponse | null>;
  deleteRequest: (id: string) => Promise<boolean>;

  // Utility
  clearError: () => void;
  clearSelectedRequest: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const usePettyCashStore = create<PettyCashState>()(
  persist(
    (set, get) => ({
      // Initial State
      pettyCashRequests: [],
      selectedRequest: null,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // PETTY CASH ACTIONS
      // ========================================================================

      fetchRequests: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await pettyCashApi.list({
            page: filters.page || 1,
            page_size: filters.page_size || 50,
            search: filters.search,
            status: filters.status,
            category: filters.category,
            employee: filters.employee,
            approved_by: filters.approved_by,
            priority: filters.priority,
            request_date_after: filters.request_date_after,
            request_date_before: filters.request_date_before,
            ordering: filters.ordering || '-created_at',
          });

          set({
            pettyCashRequests: response.results,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / (filters.page_size || 50)),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch petty cash requests:', error);
          set({
            error: error.message || 'Failed to fetch petty cash requests',
            loading: false,
            pettyCashRequests: [],
          });
          message.error('Failed to load petty cash requests');
        }
      },

      fetchRequestById: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await pettyCashApi.retrieve(id);

          set({
            selectedRequest: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch petty cash details:', error);
          set({
            error: error.message || 'Failed to fetch petty cash details',
            loading: false,
          });
          message.error('Failed to load request details');
        }
      },

      createRequest: async (data: PettyCashCreateRequest, files?: File[]) => {
        set({ loading: true, error: null });

        try {
          const response = await pettyCashApi.create(data);

          set(state => ({
            pettyCashRequests: [response, ...state.pettyCashRequests],
            loading: false,
          }));

          message.success(`Petty cash request "${response.petty_cash_number}" created successfully`);

          // TODO: Upload files if provided (will be linked to petty cash via GenericForeignKey)
          // This can be implemented later when document upload endpoint is ready
          if (files && files.length > 0) {
            console.log(`${files.length} file(s) ready to upload for petty cash ${response.id}`);
          }

          return response;
        } catch (error: any) {
          console.error('Failed to create petty cash request:', error);
          set({
            error: error.message || 'Failed to create petty cash request',
            loading: false,
          });
          message.error('Failed to create request');
          return null;
        }
      },

      updateRequest: async (id: string, data: Partial<PettyCashCreateRequest>) => {
        set({ loading: true, error: null });

        try {
          const response = await pettyCashApi.partialUpdate(id, data);

          set(state => ({
            pettyCashRequests: state.pettyCashRequests.map(r =>
              r.id === id ? response : r
            ),
            selectedRequest: state.selectedRequest?.id === id ? response : state.selectedRequest,
            loading: false,
          }));

          message.success(`Request "${response.petty_cash_number}" updated successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to update petty cash request:', error);
          set({
            error: error.message || 'Failed to update request',
            loading: false,
          });
          message.error('Failed to update request');
          return null;
        }
      },

      deleteRequest: async (id: string) => {
        set({ loading: true, error: null });

        try {
          await pettyCashApi.delete(id);

          set(state => ({
            pettyCashRequests: state.pettyCashRequests.filter(r => r.id !== id),
            loading: false,
          }));

          message.success('Request deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete petty cash request:', error);
          set({
            error: error.message || 'Failed to delete request',
            loading: false,
          });
          message.error('Failed to delete request');
          return false;
        }
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      clearError: () => set({ error: null }),

      clearSelectedRequest: () => set({ selectedRequest: null }),
    }),
    {
      name: 'petty-cash-storage',
      partialize: (state) => ({
        pettyCashRequests: state.pettyCashRequests,
      }),
    }
  )
);
