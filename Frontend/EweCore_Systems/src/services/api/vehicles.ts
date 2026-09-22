/**
 * Vehicle API Service
 * Handles fleet/vehicle management
 */

import { apiClient } from './client';
import type { PaginatedResponse } from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface VehicleResponse {
  id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vin: string | null;
  color: string | null;
  vehicle_type: string;
  vehicle_type_display: string;
  fuel_type: string;
  fuel_type_display: string;
  ownership_type: string;
  ownership_type_display: string;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assignment_date: string | null;
  assignment_type: string | null;
  assignment_type_display: string | null;
  current_mileage: number;
  mileage_last_updated: string | null;
  last_service_date: string | null;
  last_service_mileage: number | null;
  next_service_date: string | null;
  next_service_mileage: number | null;
  service_interval_km: number;
  insurance_company: string | null;
  insurance_policy_number: string | null;
  insurance_expiry_date: string | null;
  insurance_premium: number | null;
  license_disk_expiry: string | null;
  status: string;
  status_display: string;
  condition: string;
  condition_display: string;
  is_service_due: boolean;
  is_insurance_expired: boolean;
  is_license_expired: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreateRequest {
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  color?: string;
  vehicle_type: string;
  fuel_type: string;
  ownership_type?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  current_mileage?: number;
  service_interval_km?: number;
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_expiry_date?: string;
  insurance_premium?: number;
  license_disk_expiry?: string;
  status?: string;
  condition?: string;
  notes?: string;
}

export interface VehicleFilters {
  page?: number;
  page_size?: number;
  search?: string;
  vehicle_type?: string;
  fuel_type?: string;
  ownership_type?: string;
  status?: string;
  condition?: string;
  assigned_to?: string;
  ordering?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const vehicleApi = {
  /**
   * List vehicles with optional filtering
   */
  list: async (filters?: VehicleFilters): Promise<PaginatedResponse<VehicleResponse>> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.page_size) params.append('page_size', filters.page_size.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.vehicle_type) params.append('vehicle_type', filters.vehicle_type);
    if (filters?.fuel_type) params.append('fuel_type', filters.fuel_type);
    if (filters?.ownership_type) params.append('ownership_type', filters.ownership_type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.condition) params.append('condition', filters.condition);
    if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters?.ordering) params.append('ordering', filters.ordering);

    const response = await apiClient.get(`/vehicles/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single vehicle by ID
   */
  retrieve: async (id: string): Promise<VehicleResponse> => {
    const response = await apiClient.get(`/vehicles/${id}/`);
    return response.data;
  },

  /**
   * Create new vehicle
   */
  create: async (data: VehicleCreateRequest): Promise<VehicleResponse> => {
    const response = await apiClient.post('/vehicles/', data);
    return response.data;
  },

  /**
   * Update existing vehicle
   */
  update: async (id: string, data: Partial<VehicleCreateRequest>): Promise<VehicleResponse> => {
    const response = await apiClient.put(`/vehicles/${id}/`, data);
    return response.data;
  },

  /**
   * Partially update vehicle
   */
  partialUpdate: async (id: string, data: Partial<VehicleCreateRequest>): Promise<VehicleResponse> => {
    const response = await apiClient.patch(`/vehicles/${id}/`, data);
    return response.data;
  },

  /**
   * Delete vehicle
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/vehicles/${id}/`);
  },
};
