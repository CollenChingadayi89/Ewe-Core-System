/**
 * Vehicle Store - Zustand state management for fleet/vehicle management
 * Integrates with real API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vehicleApi } from '../services/api/vehicles';
import type {
  VehicleResponse,
  VehicleCreateRequest,
  VehicleFilters,
} from '../services/api/vehicles';
import { message } from 'antd';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface VehicleState {
  // State
  vehicles: VehicleResponse[];
  selectedVehicle: VehicleResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions - Standard CRUD
  fetchVehicles: (filters?: VehicleFilters) => Promise<void>;
  fetchVehicleById: (id: string) => Promise<void>;
  createVehicle: (data: VehicleCreateRequest) => Promise<VehicleResponse | null>;
  updateVehicle: (id: string, data: Partial<VehicleCreateRequest>) => Promise<VehicleResponse | null>;
  deleteVehicle: (id: string) => Promise<boolean>;

  // Utility
  clearError: () => void;
  clearSelectedVehicle: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useVehicleStore = create<VehicleState>()(
  persist(
    (set, get) => ({
      // Initial State
      vehicles: [],
      selectedVehicle: null,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // STANDARD CRUD ACTIONS
      // ========================================================================

      fetchVehicles: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await vehicleApi.list({
            page: filters.page || 1,
            page_size: filters.page_size || 50,
            search: filters.search,
            vehicle_type: filters.vehicle_type,
            fuel_type: filters.fuel_type,
            ownership_type: filters.ownership_type,
            status: filters.status,
            condition: filters.condition,
            assigned_to: filters.assigned_to,
            ordering: filters.ordering || '-created_at',
          });

          set({
            vehicles: response.results,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / (filters.page_size || 50)),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch vehicles:', error);
          set({
            error: error.message || 'Failed to fetch vehicles',
            loading: false,
            vehicles: [],
          });
          message.error('Failed to load vehicles');
        }
      },

      fetchVehicleById: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await vehicleApi.retrieve(id);

          set({
            selectedVehicle: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch vehicle details:', error);
          set({
            error: error.message || 'Failed to fetch vehicle details',
            loading: false,
          });
          message.error('Failed to load vehicle details');
        }
      },

      createVehicle: async (data: VehicleCreateRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await vehicleApi.create(data);

          set(state => ({
            vehicles: [response, ...state.vehicles],
            loading: false,
          }));

          message.success(`Vehicle "${response.registration_number}" created successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to create vehicle:', error);
          set({
            error: error.message || 'Failed to create vehicle',
            loading: false,
          });
          message.error('Failed to create vehicle');
          return null;
        }
      },

      updateVehicle: async (id: string, data: Partial<VehicleCreateRequest>) => {
        set({ loading: true, error: null });

        try {
          const response = await vehicleApi.partialUpdate(id, data);

          set(state => ({
            vehicles: state.vehicles.map(v =>
              v.id === id ? response : v
            ),
            selectedVehicle: state.selectedVehicle?.id === id ? response : state.selectedVehicle,
            loading: false,
          }));

          message.success(`Vehicle "${response.registration_number}" updated successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to update vehicle:', error);
          set({
            error: error.message || 'Failed to update vehicle',
            loading: false,
          });
          message.error('Failed to update vehicle');
          return null;
        }
      },

      deleteVehicle: async (id: string) => {
        set({ loading: true, error: null });

        try {
          await vehicleApi.delete(id);

          set(state => ({
            vehicles: state.vehicles.filter(v => v.id !== id),
            loading: false,
          }));

          message.success('Vehicle deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete vehicle:', error);
          set({
            error: error.message || 'Failed to delete vehicle',
            loading: false,
          });
          message.error('Failed to delete vehicle');
          return false;
        }
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      clearError: () => set({ error: null }),

      clearSelectedVehicle: () => set({ selectedVehicle: null }),
    }),
    {
      name: 'vehicle-storage',
      partialize: (state) => ({
        vehicles: state.vehicles,
      }),
    }
  )
);
