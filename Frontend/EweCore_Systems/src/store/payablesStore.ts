import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vendorApi, payableApi } from '../services/api/payables';
import type {
  VendorListResponse,
  VendorDetailResponse,
  PayableListResponse,
  PayableDetailResponse,
  PayableCreateRequest,
  MarkPaidRequest,
} from '../services/api/payables';
import type { Payable, PayableRequest } from '../types/index';

// Toggle between mock and real API
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

interface PayableFormData {
  clientId: string;
  clientName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  currency: string;
  dueDate: string;
  collectionDate: string;
  department: string;
  description: string;
  paymentMethod?: string;
  attachments?: string[];
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

interface Vendor {
  id: string;
  vendorCode: string;
  companyName: string;
  contactPerson: string | null;
  email: string;
  phone: string;
  vendorType: string;
  vendorTypeDisplay: string;
  paymentTerms: string | null;
  isActive: boolean;
  payablesCount: number;
  totalOutstanding: number;
  createdAt: string;
  updatedAt: string;
}

interface PayablesState {
  payables: Payable[];
  payableRequests: PayableRequest[];
  vendors: Vendor[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions
  fetchPayables: (filters?: {
    page?: number;
    search?: string;
    vendor?: string;
    category?: string;
    status?: string;
    priority?: string;
  }) => Promise<void>;
  fetchPayableRequests: () => void;
  fetchVendors: (filters?: {
    page?: number;
    search?: string;
    vendor_type?: string;
    is_active?: boolean;
  }) => Promise<void>;
  submitPayable: (userId: string, userName: string, data: PayableFormData) => Promise<void>;
  approvePayable: (payableId: string, userId: string, userName: string, comment?: string) => Promise<void>;
  rejectPayable: (payableId: string, userId: string, userName: string, comment: string) => Promise<void>;
  markAsPaid: (payableId: string, userId: string, userName: string, data?: MarkPaidRequest) => Promise<void>;
  updatePayableStatus: (payableId: string, status: Payable['status']) => Promise<void>;
  deletePayable: (payableId: string) => Promise<void>;
  getPayableById: (payableId: string) => Payable | undefined;
  clearError: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format ISO date string to DD/MM/YYYY format
 */
function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

/**
 * Calculate aging days from due date
 */
function calculateAgingDays(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Map API vendor response to frontend Vendor type
 */
function mapApiToVendor(api: VendorListResponse): Vendor {
  return {
    id: api.id,
    vendorCode: api.vendor_code,
    companyName: api.company_name,
    contactPerson: api.contact_person,
    email: api.email,
    phone: api.phone,
    vendorType: api.vendor_type,
    vendorTypeDisplay: api.vendor_type_display,
    paymentTerms: api.payment_terms,
    isActive: api.is_active,
    payablesCount: api.payables_count,
    totalOutstanding: api.total_outstanding,
    createdAt: formatDate(api.created_at),
    updatedAt: formatDate(api.updated_at),
  };
}

/**
 * Map API payable response to frontend Payable type
 */
function mapApiToPayable(api: PayableListResponse | PayableDetailResponse): Payable {
  const isDetail = 'vendor_details' in api;

  return {
    id: api.id,
    clientId: api.vendor,
    clientName: isDetail ? api.vendor_details.company_name : api.vendor_name,
    contactPerson: isDetail ? api.vendor_details.contact_person || undefined : undefined,
    phone: isDetail ? api.vendor_details.phone : undefined,
    email: isDetail ? api.vendor_details.email : undefined,
    invoiceNumber: api.invoice_number || '',
    invoiceDate: formatDate(api.invoice_date),
    amount: parseFloat(api.amount),
    currency: api.currency,
    dueDate: formatDate(api.due_date),
    collectionDate: api.collection_date ? formatDate(api.collection_date) : '',
    department: '', // Not in API response
    description: isDetail ? api.description : '',
    status: api.status as Payable['status'],
    priority: api.priority as 'low' | 'medium' | 'high',
    paymentMethod: isDetail ? api.payment_method || undefined : undefined,
    attachments: isDetail ? api.attachments : undefined,
    notes: isDetail ? api.notes || undefined : undefined,
    createdBy: isDetail ? api.submitted_by : api.submitted_by,
    createdByName: isDetail ? api.submitted_by_details.full_name : api.submitted_by_name,
    createdAt: formatDate(api.created_at),
    updatedAt: formatDate(api.updated_at),
    approvedBy: isDetail && api.approved_date ?
      (api.approval_chain.find(a => a.approved_at)?.approver_name) : undefined,
    approvedAt: isDetail && api.approved_date ? formatDate(api.approved_date) : undefined,
    paidBy: undefined, // Would need to track separately
    paidAt: isDetail && api.paid_date ? formatDate(api.paid_date) : undefined,
  };
}

/**
 * Map form data to API request format
 */
function mapFormDataToApiRequest(userId: string, data: PayableFormData): PayableCreateRequest {
  return {
    vendor: data.clientId,
    invoice_number: data.invoiceNumber,
    description: data.description,
    category: 'supplies', // Default category - could be made configurable
    amount: data.amount.toString(),
    currency: data.currency || 'ZWG',
    tax_amount: '0', // Could calculate from amount
    invoice_date: data.invoiceDate,
    due_date: data.dueDate,
    collection_date: data.collectionDate,
    payment_method: data.paymentMethod,
    priority: data.priority,
    attachments: data.attachments,
    notes: data.notes,
    submitted_by: userId,
  };
}

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const usePayablesStore = create<PayablesState>()(
  persist(
    (set, get) => ({
      payables: [],
      payableRequests: [],
      vendors: [],
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // FETCH PAYABLES
      // ========================================================================
      fetchPayables: async (filters = {}) => {
        if (USE_MOCK) {
          const { mockPayables } = await import('../mock/payables');
          set({
            payables: mockPayables,
            loading: false,
            error: null,
            currentPage: 1,
            totalPages: 1,
            totalCount: mockPayables.length,
          });
          return;
        }

        set({ loading: true, error: null });
        try {
          const response = await payableApi.list({
            page: filters.page || 1,
            search: filters.search,
            vendor: filters.vendor,
            category: filters.category,
            status: filters.status,
            priority: filters.priority,
          });

          const payables = response.results.map(mapApiToPayable);

          set({
            payables,
            loading: false,
            error: null,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / 50), // PAGE_SIZE = 50
            totalCount: response.count,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch payables',
            loading: false,
          });
        }
      },

      // ========================================================================
      // FETCH PAYABLE REQUESTS
      // ========================================================================
      fetchPayableRequests: () => {
        if (USE_MOCK) {
          import('../mock/payables').then(({ mockPayableRequests }) => {
            set({
              payableRequests: mockPayableRequests,
              loading: false,
            });
          });
          return;
        }

        // In real implementation, this would fetch from approvals endpoint
        // For now, we extract from payables
        const requests: PayableRequest[] = [];
        set({ payableRequests: requests });
      },

      // ========================================================================
      // FETCH VENDORS
      // ========================================================================
      fetchVendors: async (filters = {}) => {
        if (USE_MOCK) {
          const { mockClients } = await import('../mock/payables');
          set({
            vendors: mockClients as unknown as Vendor[],
            loading: false,
            error: null,
          });
          return;
        }

        set({ loading: true, error: null });
        try {
          const response = await vendorApi.list({
            page: filters.page || 1,
            search: filters.search,
            vendor_type: filters.vendor_type,
            is_active: filters.is_active,
          });

          const vendors = response.results.map(mapApiToVendor);

          set({
            vendors,
            loading: false,
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch vendors',
            loading: false,
          });
        }
      },

      // ========================================================================
      // SUBMIT PAYABLE
      // ========================================================================
      submitPayable: async (userId: string, userName: string, data: PayableFormData) => {
        if (USE_MOCK) {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));

          const newPayable: Payable = {
            id: `PAY-2026-${String(get().payables.length + 1).padStart(3, '0')}`,
            ...data,
            status: 'pending',
            createdBy: userId,
            createdByName: userName,
            createdAt: new Date().toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            updatedAt: new Date().toLocaleString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
          };

          // Create approval request
          const newRequest: PayableRequest = {
            id: `PAYREQ-${String(get().payableRequests.length + 1).padStart(3, '0')}`,
            type: 'payable',
            requestorId: userId,
            requestorName: userName,
            createdAt: newPayable.createdAt,
            updatedAt: newPayable.updatedAt,
            status: 'pending',
            currentApproverId: 'USR-003', // Finance Manager (David Kamau)
            priority: data.priority,
            amount: data.amount,
            data: {
              clientId: data.clientId,
              clientName: data.clientName,
              contactPerson: data.contactPerson,
              phone: data.phone,
              email: data.email,
              invoiceNumber: data.invoiceNumber,
              invoiceDate: data.invoiceDate,
              amount: data.amount,
              currency: data.currency,
              dueDate: data.dueDate,
              collectionDate: data.collectionDate,
              department: data.department,
              description: data.description,
              paymentMethod: data.paymentMethod,
              attachments: data.attachments,
              notes: data.notes,
            },
            approvalChain: [
              {
                id: `STEP-${newPayable.id}-1`,
                approverId: 'USR-003',
                approverName: 'David Kamau',
                status: 'pending',
                order: 1,
              },
              {
                id: `STEP-${newPayable.id}-2`,
                approverId: 'USR-001',
                approverName: 'Margaret Njeri',
                status: 'pending',
                order: 2,
              },
            ],
          };

          set(state => ({
            payables: [...state.payables, newPayable],
            payableRequests: [...state.payableRequests, newRequest],
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          const apiRequest = mapFormDataToApiRequest(userId, data);
          const created = await payableApi.create(apiRequest);
          const newPayable = mapApiToPayable(created);

          set(state => ({
            payables: [...state.payables, newPayable],
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create payable',
            loading: false,
          });
          throw error;
        }
      },

      // ========================================================================
      // APPROVE PAYABLE
      // ========================================================================
      approvePayable: async (payableId: string, userId: string, userName: string, comment?: string) => {
        if (USE_MOCK) {
          await new Promise(resolve => setTimeout(resolve, 500));

          const now = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          set(state => ({
            payables: state.payables.map(p =>
              p.id === payableId
                ? {
                    ...p,
                    status: 'approved',
                    approvedBy: userName,
                    approvedAt: now,
                    updatedAt: now,
                  }
                : p
            ),
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          const updated = await payableApi.approve(payableId, { notes: comment });
          const updatedPayable = mapApiToPayable(updated);

          set(state => ({
            payables: state.payables.map(p =>
              p.id === payableId ? updatedPayable : p
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to approve payable',
            loading: false,
          });
          throw error;
        }
      },

      // ========================================================================
      // REJECT PAYABLE
      // ========================================================================
      rejectPayable: async (payableId: string, userId: string, userName: string, comment: string) => {
        if (USE_MOCK) {
          await new Promise(resolve => setTimeout(resolve, 500));

          const now = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          set(state => ({
            payables: state.payables.map(p =>
              p.id === payableId
                ? {
                    ...p,
                    status: 'rejected',
                    updatedAt: now,
                  }
                : p
            ),
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          const updated = await payableApi.reject(payableId, { reason: comment });
          const updatedPayable = mapApiToPayable(updated);

          set(state => ({
            payables: state.payables.map(p =>
              p.id === payableId ? updatedPayable : p
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to reject payable',
            loading: false,
          });
          throw error;
        }
      },

      // ========================================================================
      // MARK AS PAID
      // ========================================================================
      markAsPaid: async (payableId: string, userId: string, userName: string, data?: MarkPaidRequest) => {
        if (USE_MOCK) {
          await new Promise(resolve => setTimeout(resolve, 500));

          const now = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          set(state => ({
            payables: state.payables.map(p =>
              p.id === payableId
                ? {
                    ...p,
                    status: 'paid',
                    paidBy: userName,
                    paidAt: now,
                    updatedAt: now,
                  }
                : p
            ),
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          const updated = await payableApi.markPaid(payableId, data);
          const updatedPayable = mapApiToPayable(updated);

          set(state => ({
            payables: state.payables.map(p =>
              p.id === payableId ? updatedPayable : p
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to mark payable as paid',
            loading: false,
          });
          throw error;
        }
      },

      // ========================================================================
      // UPDATE PAYABLE STATUS
      // ========================================================================
      updatePayableStatus: async (payableId: string, status: Payable['status']) => {
        if (USE_MOCK) {
          await new Promise(resolve => setTimeout(resolve, 500));

          const now = new Date().toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          set(state => ({
            payables: state.payables.map(p =>
              p.id === payableId
                ? {
                    ...p,
                    status,
                    updatedAt: now,
                  }
                : p
            ),
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          await payableApi.partialUpdate(payableId, {
            // Status updates are typically done through custom actions
            // This is a placeholder for partial updates
          });

          // Refetch to get latest data
          await get().fetchPayables({ page: get().currentPage });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update payable status',
            loading: false,
          });
          throw error;
        }
      },

      // ========================================================================
      // DELETE PAYABLE
      // ========================================================================
      deletePayable: async (payableId: string) => {
        if (USE_MOCK) {
          await new Promise(resolve => setTimeout(resolve, 500));

          set(state => ({
            payables: state.payables.filter(p => p.id !== payableId),
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          await payableApi.delete(payableId);

          set(state => ({
            payables: state.payables.filter(p => p.id !== payableId),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete payable',
            loading: false,
          });
          throw error;
        }
      },

      // ========================================================================
      // GET PAYABLE BY ID
      // ========================================================================
      getPayableById: (payableId: string) => {
        return get().payables.find(p => p.id === payableId);
      },

      // ========================================================================
      // CLEAR ERROR
      // ========================================================================
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'payables-storage',
      partialize: (state) => ({
        // Only persist data, not transient loading/error states
        payables: state.payables,
        vendors: state.vendors,
      }),
    }
  )
);
