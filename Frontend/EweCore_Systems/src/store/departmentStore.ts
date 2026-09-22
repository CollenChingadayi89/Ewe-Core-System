/**
 * Department Store - Zustand state management for departments
 * Integrates with real API with mock data fallback
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { departmentApi, designationApi } from '../services/api/departments';
import type {
  DepartmentListResponse,
  DepartmentDetailResponse,
  DepartmentCreateRequest,
  DesignationListResponse,
  DesignationDetailResponse,
  DesignationCreateRequest,
} from '../services/api/departments';
import { message } from 'antd';

// Check if mock data is enabled
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

// ============================================================================
// TYPES
// ============================================================================

export interface Department {
  id: string;
  code: string;
  name: string;
  description: string | null;
  managerId: string | null;
  managerName: string | null;
  parentDepartmentId: string | null;
  parentDepartmentName: string | null;
  employeeCount: number;
  subDepartmentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentDetail extends Department {
  managerDetails: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    designation: string | null;
  } | null;
  subDepartments: {
    id: string;
    code: string;
    name: string;
    employeeCount: number;
  }[];
  designations: {
    id: string;
    code: string;
    title: string;
    employeeCount: number;
  }[];
}

export interface Designation {
  id: string;
  code: string;
  title: string;
  departmentId: string;
  departmentName: string;
  level: string | null;
  grade: string | null;
  description: string | null;
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// HELPER FUNCTIONS - API to Frontend Mapping
// ============================================================================

const mapApiToDepartment = (api: DepartmentListResponse): Department => ({
  id: api.id,
  code: api.code,
  name: api.name,
  description: api.description,
  managerId: api.manager,
  managerName: api.manager_name,
  parentDepartmentId: api.parent_department,
  parentDepartmentName: api.parent_department_name,
  employeeCount: api.employee_count,
  subDepartmentCount: api.sub_department_count,
  isActive: api.is_active,
  createdAt: api.created_at,
  updatedAt: api.updated_at,
});

const mapApiToDepartmentDetail = (api: DepartmentDetailResponse): DepartmentDetail => ({
  ...mapApiToDepartment(api),
  managerDetails: api.manager_details ? {
    id: api.manager_details.id,
    employeeNumber: api.manager_details.employee_number,
    firstName: api.manager_details.first_name,
    lastName: api.manager_details.last_name,
    designation: api.manager_details.designation,
  } : null,
  subDepartments: api.sub_departments.map(sub => ({
    id: sub.id,
    code: sub.code,
    name: sub.name,
    employeeCount: sub.employee_count,
  })),
  designations: api.designations.map(desig => ({
    id: desig.id,
    code: desig.code,
    title: desig.title,
    employeeCount: desig.employee_count,
  })),
});

const mapApiToDesignation = (api: DesignationListResponse): Designation => ({
  id: api.id,
  code: api.code,
  title: api.title,
  departmentId: api.department,
  departmentName: api.department_name,
  level: api.level,
  grade: api.grade,
  description: api.description,
  employeeCount: api.employee_count,
  isActive: api.is_active,
  createdAt: api.created_at,
  updatedAt: api.updated_at,
});

const mapDepartmentToApi = (dept: Partial<Department>): Partial<DepartmentCreateRequest> => ({
  code: dept.code,
  name: dept.name,
  description: dept.description || undefined,
  manager: dept.managerId || undefined,
  parent_department: dept.parentDepartmentId || undefined,
  is_active: dept.isActive,
});

const mapDesignationToApi = (desig: Partial<Designation>): Partial<DesignationCreateRequest> => ({
  code: desig.code,
  title: desig.title,
  department: desig.departmentId,
  level: desig.level || undefined,
  grade: desig.grade || undefined,
  description: desig.description || undefined,
  is_active: desig.isActive,
});

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface DepartmentState {
  // State
  departments: Department[];
  designations: Designation[];
  selectedDepartment: DepartmentDetail | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Department Actions
  fetchDepartments: (filters?: { search?: string; is_active?: boolean; ordering?: string; page?: number }) => Promise<void>;
  fetchDepartmentById: (id: string) => Promise<void>;
  createDepartment: (data: Partial<Department>) => Promise<Department | null>;
  updateDepartment: (id: string, data: Partial<Department>) => Promise<Department | null>;
  deleteDepartment: (id: string) => Promise<boolean>;

  // Designation Actions
  fetchDesignations: (filters?: { search?: string; is_active?: boolean; department?: string; page?: number }) => Promise<void>;
  createDesignation: (data: Partial<Designation>) => Promise<Designation | null>;
  updateDesignation: (id: string, data: Partial<Designation>) => Promise<Designation | null>;
  deleteDesignation: (id: string) => Promise<boolean>;

  // Utility
  clearError: () => void;
  clearSelectedDepartment: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useDepartmentStore = create<DepartmentState>()(
  persist(
    (set, get) => ({
      // Initial State
      departments: [],
      designations: [],
      selectedDepartment: null,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // DEPARTMENT ACTIONS
      // ========================================================================

      fetchDepartments: async (filters = {}) => {
        if (USE_MOCK) {
          const { mockDepartments } = await import('../mock/departments');
          set({ departments: mockDepartments, loading: false });
          return;
        }

        set({ loading: true, error: null });

        try {
          const response = await departmentApi.list({
            page: filters.page || 1,
            search: filters.search,
            is_active: filters.is_active,
            ordering: filters.ordering || 'name',
          });

          const departments = response.results.map(mapApiToDepartment);

          set({
            departments,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / 50),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch departments:', error);
          set({
            error: error.message || 'Failed to fetch departments',
            loading: false,
            departments: [],
          });
          message.error('Failed to load departments');
        }
      },

      fetchDepartmentById: async (id: string) => {
        if (USE_MOCK) {
          const { mockDepartments } = await import('../mock/departments');
          const dept = mockDepartments.find(d => d.id === id);
          if (dept) {
            set({ selectedDepartment: dept as any, loading: false });
          }
          return;
        }

        set({ loading: true, error: null });

        try {
          const response = await departmentApi.retrieve(id);
          const department = mapApiToDepartmentDetail(response);

          set({
            selectedDepartment: department,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch department details:', error);
          set({
            error: error.message || 'Failed to fetch department details',
            loading: false,
          });
          message.error('Failed to load department details');
        }
      },

      createDepartment: async (data: Partial<Department>) => {
        if (USE_MOCK) {
          const newDept: Department = {
            id: `dept-${Date.now()}`,
            code: data.code || '',
            name: data.name || '',
            description: data.description || null,
            managerId: data.managerId || null,
            managerName: null,
            parentDepartmentId: data.parentDepartmentId || null,
            parentDepartmentName: null,
            employeeCount: 0,
            subDepartmentCount: 0,
            isActive: data.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set(state => ({ departments: [...state.departments, newDept] }));
          message.success('Department created successfully (mock mode)');
          return newDept;
        }

        set({ loading: true, error: null });

        try {
          const apiData = mapDepartmentToApi(data) as DepartmentCreateRequest;
          const response = await departmentApi.create(apiData);
          const newDepartment = mapApiToDepartmentDetail(response);

          set(state => ({
            departments: [...state.departments, newDepartment],
            loading: false,
          }));

          message.success(`Department "${newDepartment.name}" created successfully`);
          return newDepartment;
        } catch (error: any) {
          console.error('Failed to create department:', error);
          set({
            error: error.message || 'Failed to create department',
            loading: false,
          });
          message.error('Failed to create department');
          return null;
        }
      },

      updateDepartment: async (id: string, data: Partial<Department>) => {
        if (USE_MOCK) {
          set(state => ({
            departments: state.departments.map(d =>
              d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
            ),
          }));
          message.success('Department updated successfully (mock mode)');
          return { ...data, id } as Department;
        }

        set({ loading: true, error: null });

        try {
          const apiData = mapDepartmentToApi(data) as DepartmentCreateRequest;
          const response = await departmentApi.update(id, apiData);
          const updatedDepartment = mapApiToDepartmentDetail(response);

          set(state => ({
            departments: state.departments.map(d =>
              d.id === id ? updatedDepartment : d
            ),
            selectedDepartment: state.selectedDepartment?.id === id ? updatedDepartment : state.selectedDepartment,
            loading: false,
          }));

          message.success(`Department "${updatedDepartment.name}" updated successfully`);
          return updatedDepartment;
        } catch (error: any) {
          console.error('Failed to update department:', error);
          set({
            error: error.message || 'Failed to update department',
            loading: false,
          });
          message.error('Failed to update department');
          return null;
        }
      },

      deleteDepartment: async (id: string) => {
        if (USE_MOCK) {
          set(state => ({
            departments: state.departments.filter(d => d.id !== id),
          }));
          message.success('Department deleted successfully (mock mode)');
          return true;
        }

        set({ loading: true, error: null });

        try {
          await departmentApi.delete(id);

          set(state => ({
            departments: state.departments.filter(d => d.id !== id),
            loading: false,
          }));

          message.success('Department deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete department:', error);
          set({
            error: error.message || 'Failed to delete department',
            loading: false,
          });
          message.error('Failed to delete department');
          return false;
        }
      },

      // ========================================================================
      // DESIGNATION ACTIONS
      // ========================================================================

      fetchDesignations: async (filters = {}) => {
        if (USE_MOCK) {
          const { mockDesignations } = await import('../mock/departments');
          set({ designations: mockDesignations, loading: false });
          return;
        }

        set({ loading: true, error: null });

        try {
          const response = await designationApi.list({
            page: filters.page || 1,
            search: filters.search,
            is_active: filters.is_active,
            department: filters.department,
            ordering: 'title',
          });

          const designations = response.results.map(mapApiToDesignation);

          set({
            designations,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch designations:', error);
          set({
            error: error.message || 'Failed to fetch designations',
            loading: false,
            designations: [],
          });
          message.error('Failed to load designations');
        }
      },

      createDesignation: async (data: Partial<Designation>) => {
        if (USE_MOCK) {
          const newDesig: Designation = {
            id: `desig-${Date.now()}`,
            code: data.code || '',
            title: data.title || '',
            departmentId: data.departmentId || '',
            departmentName: data.departmentName || '',
            level: data.level || null,
            grade: data.grade || null,
            description: data.description || null,
            employeeCount: 0,
            isActive: data.isActive ?? true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set(state => ({ designations: [...state.designations, newDesig] }));
          message.success('Designation created successfully (mock mode)');
          return newDesig;
        }

        set({ loading: true, error: null });

        try {
          const apiData = mapDesignationToApi(data) as DesignationCreateRequest;
          const response = await designationApi.create(apiData);
          const newDesignation = mapApiToDesignation(response as any);

          set(state => ({
            designations: [...state.designations, newDesignation],
            loading: false,
          }));

          message.success(`Designation "${newDesignation.title}" created successfully`);
          return newDesignation;
        } catch (error: any) {
          console.error('Failed to create designation:', error);
          set({
            error: error.message || 'Failed to create designation',
            loading: false,
          });
          message.error('Failed to create designation');
          return null;
        }
      },

      updateDesignation: async (id: string, data: Partial<Designation>) => {
        if (USE_MOCK) {
          set(state => ({
            designations: state.designations.map(d =>
              d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
            ),
          }));
          message.success('Designation updated successfully (mock mode)');
          return { ...data, id } as Designation;
        }

        set({ loading: true, error: null });

        try {
          const apiData = mapDesignationToApi(data) as DesignationCreateRequest;
          const response = await designationApi.update(id, apiData);
          const updatedDesignation = mapApiToDesignation(response as any);

          set(state => ({
            designations: state.designations.map(d =>
              d.id === id ? updatedDesignation : d
            ),
            loading: false,
          }));

          message.success(`Designation "${updatedDesignation.title}" updated successfully`);
          return updatedDesignation;
        } catch (error: any) {
          console.error('Failed to update designation:', error);
          set({
            error: error.message || 'Failed to update designation',
            loading: false,
          });
          message.error('Failed to update designation');
          return null;
        }
      },

      deleteDesignation: async (id: string) => {
        if (USE_MOCK) {
          set(state => ({
            designations: state.designations.filter(d => d.id !== id),
          }));
          message.success('Designation deleted successfully (mock mode)');
          return true;
        }

        set({ loading: true, error: null });

        try {
          await designationApi.delete(id);

          set(state => ({
            designations: state.designations.filter(d => d.id !== id),
            loading: false,
          }));

          message.success('Designation deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete designation:', error);
          set({
            error: error.message || 'Failed to delete designation',
            loading: false,
          });
          message.error('Failed to delete designation');
          return false;
        }
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      clearError: () => set({ error: null }),

      clearSelectedDepartment: () => set({ selectedDepartment: null }),
    }),
    {
      name: 'department-storage',
      partialize: (state) => ({
        departments: state.departments,
        designations: state.designations,
      }),
    }
  )
);
