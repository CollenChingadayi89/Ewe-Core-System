/**
 * Procurement Store - Zustand state management for procurement/purchase requests
 * Integrates with real API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { procurementApi } from '../services/api/procurement';
import type {
  ProcurementListResponse,
  ProcurementDetailResponse,
  ProcurementCreateRequest,
  ProcurementUpdateRequest,
  ProcurementFilters,
} from '../services/api/procurement';
import { message } from 'antd';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface ProcurementState {
  // State
  procurementRequests: ProcurementListResponse[];
  selectedRequest: ProcurementDetailResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions
  fetchRequests: (filters?: ProcurementFilters) => Promise<void>;
  fetchRequestById: (id: string) => Promise<void>;
  createRequest: (data: ProcurementCreateRequest, quotationDocuments: File[]) => Promise<ProcurementDetailResponse | null>;
  updateRequest: (id: string, data: ProcurementUpdateRequest) => Promise<ProcurementDetailResponse | null>;
  deleteRequest: (id: string) => Promise<boolean>;

  // Utility
  clearError: () => void;
  clearSelectedRequest: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useProcurementStore = create<ProcurementState>()(
  persist(
    (set, get) => ({
      // Initial State
      procurementRequests: [],
      selectedRequest: null,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // PROCUREMENT ACTIONS
      // ========================================================================

      fetchRequests: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await procurementApi.list({
            page: filters.page || 1,
            page_size: filters.page_size || 50,
            search: filters.search,
            status: filters.status,
            category: filters.category,
            requested_by: filters.requested_by,
            current_approver: filters.current_approver,
            priority: filters.priority,
            vendor: filters.vendor,
            request_date_after: filters.request_date_after,
            request_date_before: filters.request_date_before,
            required_by_date_after: filters.required_by_date_after,
            required_by_date_before: filters.required_by_date_before,
            ordering: filters.ordering || '-created_at',
          });

          set({
            procurementRequests: response.results,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / (filters.page_size || 50)),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch procurement requests:', error);
          set({
            error: error.message || 'Failed to fetch procurement requests',
            loading: false,
            procurementRequests: [],
          });
          message.error('Failed to load procurement requests');
        }
      },

      fetchRequestById: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await procurementApi.retrieve(id);

          set({
            selectedRequest: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch procurement details:', error);
          set({
            error: error.message || 'Failed to fetch procurement details',
            loading: false,
          });
          message.error('Failed to load request details');
        }
      },

      createRequest: async (data: ProcurementCreateRequest, quotationDocuments: File[]) => {
        set({ loading: true, error: null });

        try {
          const response = await procurementApi.create(data, quotationDocuments);

          set(state => ({
            procurementRequests: [response, ...state.procurementRequests],
            loading: false,
          }));

          message.success(`Procurement request "${response.request_number}" created successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to create procurement request:', error);
          set({
            error: error.message || 'Failed to create procurement request',
            loading: false,
          });
          message.error('Failed to create request');
          return null;
        }
      },

      updateRequest: async (id: string, data: ProcurementUpdateRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await procurementApi.partialUpdate(id, data);

          set(state => ({
            procurementRequests: state.procurementRequests.map(r =>
              r.id === id ? response : r
            ),
            selectedRequest: state.selectedRequest?.id === id ? response : state.selectedRequest,
            loading: false,
          }));

          message.success(`Request "${response.request_number}" updated successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to update procurement request:', error);
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
          await procurementApi.delete(id);

          set(state => ({
            procurementRequests: state.procurementRequests.filter(r => r.id !== id),
            loading: false,
          }));

          message.success('Request deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete procurement request:', error);
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
      name: 'procurement-storage',
      partialize: (state) => ({
        procurementRequests: state.procurementRequests,
      }),
    }
  )
);
