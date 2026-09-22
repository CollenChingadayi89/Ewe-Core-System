/**
 * Asset Store - Zustand state management for asset tracking
 * Integrates with real API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { assetApi } from '../services/api/assets';
import type {
  AssetListResponse,
  AssetDetailResponse,
  AssetCreateRequest,
  AssetAssignRequest,
  AssetConditionUpdateRequest,
  AssetFilters,
  AssetStatistics,
} from '../services/api/assets';
import { message } from 'antd';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface AssetState {
  // State
  assets: AssetListResponse[];
  selectedAsset: AssetDetailResponse | null;
  statistics: AssetStatistics | null;
  warrantyExpiringAssets: AssetListResponse[];
  availableAssets: AssetListResponse[];
  myAssets: AssetListResponse[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions - Standard CRUD
  fetchAssets: (filters?: AssetFilters) => Promise<void>;
  fetchAssetById: (id: string) => Promise<void>;
  createAsset: (data: AssetCreateRequest) => Promise<AssetDetailResponse | null>;
  updateAsset: (id: string, data: Partial<AssetCreateRequest>) => Promise<AssetDetailResponse | null>;
  deleteAsset: (id: string) => Promise<boolean>;

  // Actions - Custom Operations
  assignAsset: (id: string, data: AssetAssignRequest) => Promise<AssetDetailResponse | null>;
  returnAsset: (id: string) => Promise<AssetDetailResponse | null>;
  markAssetLost: (id: string, notes?: string) => Promise<AssetDetailResponse | null>;
  updateAssetCondition: (id: string, data: AssetConditionUpdateRequest) => Promise<AssetDetailResponse | null>;

  // Actions - Data Retrieval
  fetchStatistics: () => Promise<void>;
  fetchWarrantyExpiring: (days?: number) => Promise<void>;
  fetchAvailableAssets: () => Promise<void>;
  fetchMyAssets: () => Promise<void>;

  // Utility
  clearError: () => void;
  clearSelectedAsset: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useAssetStore = create<AssetState>()(
  persist(
    (set, get) => ({
      // Initial State
      assets: [],
      selectedAsset: null,
      statistics: null,
      warrantyExpiringAssets: [],
      availableAssets: [],
      myAssets: [],
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // STANDARD CRUD ACTIONS
      // ========================================================================

      fetchAssets: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.list({
            page: filters.page || 1,
            page_size: filters.page_size || 50,
            search: filters.search,
            category: filters.category,
            status: filters.status,
            condition: filters.condition,
            assigned_to: filters.assigned_to,
            purchase_date_after: filters.purchase_date_after,
            purchase_date_before: filters.purchase_date_before,
            warranty_expiry_after: filters.warranty_expiry_after,
            warranty_expiry_before: filters.warranty_expiry_before,
            ordering: filters.ordering || '-created_at',
          });

          set({
            assets: response.results,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / (filters.page_size || 50)),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch assets:', error);
          set({
            error: error.message || 'Failed to fetch assets',
            loading: false,
            assets: [],
          });
          message.error('Failed to load assets');
        }
      },

      fetchAssetById: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.retrieve(id);

          set({
            selectedAsset: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch asset details:', error);
          set({
            error: error.message || 'Failed to fetch asset details',
            loading: false,
          });
          message.error('Failed to load asset details');
        }
      },

      createAsset: async (data: AssetCreateRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.create(data);

          set(state => ({
            assets: [response, ...state.assets],
            loading: false,
          }));

          message.success(`Asset "${response.asset_number}" created successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to create asset:', error);
          set({
            error: error.message || 'Failed to create asset',
            loading: false,
          });
          message.error('Failed to create asset');
          return null;
        }
      },

      updateAsset: async (id: string, data: Partial<AssetCreateRequest>) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.partialUpdate(id, data);

          set(state => ({
            assets: state.assets.map(a =>
              a.id === id ? response : a
            ),
            selectedAsset: state.selectedAsset?.id === id ? response : state.selectedAsset,
            loading: false,
          }));

          message.success(`Asset "${response.asset_number}" updated successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to update asset:', error);
          set({
            error: error.message || 'Failed to update asset',
            loading: false,
          });
          message.error('Failed to update asset');
          return null;
        }
      },

      deleteAsset: async (id: string) => {
        set({ loading: true, error: null });

        try {
          await assetApi.delete(id);

          set(state => ({
            assets: state.assets.filter(a => a.id !== id),
            loading: false,
          }));

          message.success('Asset deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete asset:', error);
          set({
            error: error.message || 'Failed to delete asset',
            loading: false,
          });
          message.error('Failed to delete asset');
          return false;
        }
      },

      // ========================================================================
      // CUSTOM OPERATION ACTIONS
      // ========================================================================

      assignAsset: async (id: string, data: AssetAssignRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.assign(id, data);

          set(state => ({
            assets: state.assets.map(a =>
              a.id === id ? response : a
            ),
            selectedAsset: state.selectedAsset?.id === id ? response : state.selectedAsset,
            loading: false,
          }));

          message.success(`Asset assigned to ${response.assigned_to_name} successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to assign asset:', error);
          set({
            error: error.message || 'Failed to assign asset',
            loading: false,
          });
          message.error('Failed to assign asset');
          return null;
        }
      },

      returnAsset: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.returnAsset(id);

          set(state => ({
            assets: state.assets.map(a =>
              a.id === id ? response : a
            ),
            selectedAsset: state.selectedAsset?.id === id ? response : state.selectedAsset,
            loading: false,
          }));

          message.success('Asset returned successfully');
          return response;
        } catch (error: any) {
          console.error('Failed to return asset:', error);
          set({
            error: error.message || 'Failed to return asset',
            loading: false,
          });
          message.error('Failed to return asset');
          return null;
        }
      },

      markAssetLost: async (id: string, notes?: string) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.markLost(id, notes);

          set(state => ({
            assets: state.assets.map(a =>
              a.id === id ? response : a
            ),
            selectedAsset: state.selectedAsset?.id === id ? response : state.selectedAsset,
            loading: false,
          }));

          message.warning('Asset marked as lost');
          return response;
        } catch (error: any) {
          console.error('Failed to mark asset as lost:', error);
          set({
            error: error.message || 'Failed to mark asset as lost',
            loading: false,
          });
          message.error('Failed to mark asset as lost');
          return null;
        }
      },

      updateAssetCondition: async (id: string, data: AssetConditionUpdateRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.updateCondition(id, data);

          set(state => ({
            assets: state.assets.map(a =>
              a.id === id ? response : a
            ),
            selectedAsset: state.selectedAsset?.id === id ? response : state.selectedAsset,
            loading: false,
          }));

          message.success('Asset condition updated successfully');
          return response;
        } catch (error: any) {
          console.error('Failed to update asset condition:', error);
          set({
            error: error.message || 'Failed to update asset condition',
            loading: false,
          });
          message.error('Failed to update asset condition');
          return null;
        }
      },

      // ========================================================================
      // DATA RETRIEVAL ACTIONS
      // ========================================================================

      fetchStatistics: async () => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.statistics();

          set({
            statistics: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch asset statistics:', error);
          set({
            error: error.message || 'Failed to fetch asset statistics',
            loading: false,
          });
          message.error('Failed to load asset statistics');
        }
      },

      fetchWarrantyExpiring: async (days = 30) => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.warrantyExpiring(days);

          set({
            warrantyExpiringAssets: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch warranty expiring assets:', error);
          set({
            error: error.message || 'Failed to fetch warranty expiring assets',
            loading: false,
          });
          message.error('Failed to load warranty expiring assets');
        }
      },

      fetchAvailableAssets: async () => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.availableAssets();

          set({
            availableAssets: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch available assets:', error);
          set({
            error: error.message || 'Failed to fetch available assets',
            loading: false,
          });
          message.error('Failed to load available assets');
        }
      },

      fetchMyAssets: async () => {
        set({ loading: true, error: null });

        try {
          const response = await assetApi.myAssets();

          set({
            myAssets: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch my assets:', error);
          set({
            error: error.message || 'Failed to fetch my assets',
            loading: false,
          });
          message.error('Failed to load your assets');
        }
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      clearError: () => set({ error: null }),

      clearSelectedAsset: () => set({ selectedAsset: null }),
    }),
    {
      name: 'asset-storage',
      partialize: (state) => ({
        assets: state.assets,
        statistics: state.statistics,
      }),
    }
  )
);
