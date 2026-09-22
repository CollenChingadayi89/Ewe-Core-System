import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { receivableApi, receivablePaymentApi } from '../services/api/receivables';
import type {
  ReceivableListResponse,
  ReceivableDetailResponse,
  ReceivableCreateRequest,
  RecordPaymentRequest,
} from '../services/api/receivables';
import type { Receivable, ReceivableRequest, ReceivableCustomer, ReceivableCategory } from '../types/index';
import { mockReceivableCustomers } from '../mock/receivables';

// Check if mock mode is enabled
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

interface ReceivableFormData {
  memberId: string;
  memberName: string;
  memberNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  category: ReceivableCategory;
  categoryDisplay: string;
  referenceNumber: string;
  invoiceDate: string;
  amount: number;
  currency: string;
  dueDate: string;
  expectedDate: string;
  department: string;
  description: string;
  paymentMethod?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  loanAccountNumber?: string;
  shareCertificateNumber?: string;
  attachments?: string[];
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

interface PaymentData {
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
}

interface ReceivablesState {
  receivables: Receivable[];
  receivableRequests: ReceivableRequest[];
  customers: ReceivableCustomer[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions
  fetchReceivables: (filters?: {
    page?: number;
    search?: string;
    member?: string;
    category?: string;
    status?: string;
    priority?: string;
  }) => Promise<void>;
  fetchReceivableRequests: () => Promise<void>;
  submitReceivable: (userId: string, userName: string, data: ReceivableFormData) => Promise<void>;
  approveReceivable: (receivableId: string, userId: string, userName: string, comment?: string) => Promise<void>;
  rejectReceivable: (receivableId: string, userId: string, userName: string, comment: string) => Promise<void>;
  markAsPaid: (receivableId: string, userId: string, userName: string) => Promise<void>;
  recordPayment: (receivableId: string, userId: string, userName: string, payment: PaymentData) => Promise<void>;
  updateReceivableStatus: (receivableId: string, status: Receivable['status']) => Promise<void>;
  deleteReceivable: (receivableId: string) => Promise<void>;
  getReceivableById: (receivableId: string) => Receivable | undefined;
  getCustomerById: (customerId: string) => ReceivableCustomer | undefined;
  clearError: () => void;
}

/**
 * Map API response to frontend Receivable type
 */
function mapApiToReceivable(api: ReceivableListResponse | ReceivableDetailResponse): Receivable {
  const isDetail = 'member_details' in api;

  return {
    id: api.id,
    memberId: api.member,
    memberName: isDetail ? api.member_details.full_name : api.member_name,
    memberNumber: isDetail ? api.member_details.member_number : api.member_number,
    contactPerson: isDetail ? api.member_details.full_name : api.member_name,
    phone: isDetail ? api.member_details.phone : '',
    email: isDetail ? api.member_details.email : '',
    category: api.category as ReceivableCategory,
    categoryDisplay: api.category_display,
    referenceNumber: api.receivable_number,
    invoiceDate: api.transaction_date,
    amount: parseFloat(api.amount),
    currency: api.currency,
    dueDate: api.due_date,
    expectedDate: api.collection_date || api.due_date,
    department: '', // Not in API response
    description: isDetail ? api.description : '',
    status: api.status as Receivable['status'],
    priority: api.priority as 'low' | 'medium' | 'high',
    paymentMethod: isDetail ? api.payment_method || undefined : undefined,
    amountPaid: parseFloat(api.amount_paid),
    amountOutstanding: parseFloat(api.outstanding_balance),
    installmentNumber: isDetail ? api.installment_number || undefined : undefined,
    totalInstallments: isDetail ? api.total_installments || undefined : undefined,
    loanAccountNumber: isDetail ? api.loan_account_number || undefined : undefined,
    shareCertificateNumber: isDetail ? api.share_certificate_number || undefined : undefined,
    attachments: [],
    notes: isDetail ? api.notes || undefined : undefined,
    createdBy: api.submitted_by,
    createdByName: isDetail ? api.submitted_by_details.full_name : api.submitted_by_name,
    createdAt: formatDate(api.created_at),
    updatedAt: formatDate(api.updated_at),
    approvedBy: api.approved_by_name || undefined,
    approvedAt: api.approved_by_name ? formatDate(api.created_at) : undefined,
    paidBy: api.status === 'paid' ? 'System' : undefined,
    paidAt: api.status === 'paid' ? formatDate(api.updated_at) : undefined,
    lastPaymentDate: api.amount_paid > 0 ? formatDate(api.updated_at) : undefined,
    agingDays: api.is_overdue ? calculateAgingDays(api.due_date) : 0,
  };
}

/**
 * Convert API date to display format
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculate aging days from due date
 */
function calculateAgingDays(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Map frontend form data to API request
 */
function mapFormDataToApiRequest(
  userId: string,
  data: ReceivableFormData
): ReceivableCreateRequest {
  return {
    member: data.memberId,
    category: data.category,
    amount: data.amount.toString(),
    currency: data.currency,
    transaction_date: data.invoiceDate,
    due_date: data.dueDate,
    collection_date: data.expectedDate,
    description: data.description,
    notes: data.notes,
    loan_account_number: data.loanAccountNumber,
    installment_number: data.installmentNumber,
    total_installments: data.totalInstallments,
    principal_amount: data.installmentNumber && data.totalInstallments
      ? (data.amount * 0.9).toString() // Estimate 90% principal
      : undefined,
    interest_amount: data.installmentNumber && data.totalInstallments
      ? (data.amount * 0.1).toString() // Estimate 10% interest
      : undefined,
    share_certificate_number: data.shareCertificateNumber,
    number_of_shares: data.category === 'share-purchase'
      ? Math.floor(data.amount / 100) // Estimate share price of 100
      : undefined,
    share_price: data.category === 'share-purchase' ? '100' : undefined,
    is_recurring: data.category.includes('registration') ? false : true,
    payment_method: data.paymentMethod,
    priority: data.priority,
    submitted_by: userId,
  };
}

export const useReceivablesStore = create<ReceivablesState>()(
  persist(
    (set, get) => ({
      receivables: [],
      receivableRequests: [],
      customers: mockReceivableCustomers, // Keep mock customers for now
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      fetchReceivables: async (filters = {}) => {
        if (USE_MOCK) {
          // Use mock data in development
          const { mockReceivables } = await import('../mock/receivables');
          set({
            receivables: mockReceivables,
            loading: false,
            error: null,
            currentPage: 1,
            totalPages: 1,
            totalCount: mockReceivables.length,
          });
          return;
        }

        set({ loading: true, error: null });
        try {
          const response = await receivableApi.list({
            page: filters.page || 1,
            search: filters.search,
            member: filters.member,
            category: filters.category,
            status: filters.status,
            priority: filters.priority,
          });

          const receivables = response.results.map(mapApiToReceivable);

          set({
            receivables,
            loading: false,
            error: null,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / 50), // PAGE_SIZE = 50
            totalCount: response.count,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch receivables',
            loading: false,
          });
        }
      },

      fetchReceivableRequests: async () => {
        // For now, use mock data - this would integrate with approval workflow API
        const { mockReceivableRequests } = await import('../mock/receivables');
        set({
          receivableRequests: mockReceivableRequests,
        });
      },

      submitReceivable: async (userId: string, userName: string, data: ReceivableFormData) => {
        if (USE_MOCK) {
          // Mock implementation
          const { mockReceivables } = await import('../mock/receivables');
          await new Promise(resolve => setTimeout(resolve, 500));

          const newReceivable: Receivable = {
            id: `RCV-2026-${String(mockReceivables.length + 1).padStart(3, '0')}`,
            ...data,
            status: 'pending',
            amountPaid: 0,
            amountOutstanding: data.amount,
            createdBy: userId,
            createdByName: userName,
            createdAt: formatDate(new Date().toISOString()),
            updatedAt: formatDate(new Date().toISOString()),
          };

          set(state => ({
            receivables: [...state.receivables, newReceivable],
          }));
          return;
        }

        set({ loading: true, error: null });
        try {
          const apiRequest = mapFormDataToApiRequest(userId, data);
          const created = await receivableApi.create(apiRequest);
          const newReceivable = mapApiToReceivable(created);

          set(state => ({
            receivables: [...state.receivables, newReceivable],
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create receivable',
            loading: false,
          });
          throw error;
        }
      },

      approveReceivable: async (receivableId: string, userId: string, userName: string, comment?: string) => {
        set({ loading: true, error: null });
        try {
          const updated = await receivableApi.approve(receivableId, { notes: comment });
          const updatedReceivable = mapApiToReceivable(updated);

          set(state => ({
            receivables: state.receivables.map(r =>
              r.id === receivableId ? updatedReceivable : r
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to approve receivable',
            loading: false,
          });
          throw error;
        }
      },

      rejectReceivable: async (receivableId: string, userId: string, userName: string, comment: string) => {
        set({ loading: true, error: null });
        try {
          const updated = await receivableApi.reject(receivableId, { reason: comment });
          const updatedReceivable = mapApiToReceivable(updated);

          set(state => ({
            receivables: state.receivables.map(r =>
              r.id === receivableId ? updatedReceivable : r
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to reject receivable',
            loading: false,
          });
          throw error;
        }
      },

      markAsPaid: async (receivableId: string, userId: string, userName: string) => {
        set({ loading: true, error: null });
        try {
          const updated = await receivableApi.markPaid(receivableId, {
            payment_date: new Date().toISOString().split('T')[0],
            payment_method: 'Cash',
            notes: `Marked as paid by ${userName}`,
          });
          const updatedReceivable = mapApiToReceivable(updated);

          set(state => ({
            receivables: state.receivables.map(r =>
              r.id === receivableId ? updatedReceivable : r
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to mark as paid',
            loading: false,
          });
          throw error;
        }
      },

      recordPayment: async (receivableId: string, userId: string, userName: string, payment: PaymentData) => {
        set({ loading: true, error: null });
        try {
          const paymentRequest: RecordPaymentRequest = {
            payment_date: payment.paymentDate,
            amount_paid: payment.amount.toString(),
            payment_method: payment.paymentMethod,
            reference_number: payment.reference,
            notes: payment.notes,
          };

          const updated = await receivableApi.recordPayment(receivableId, paymentRequest);
          const updatedReceivable = mapApiToReceivable(updated);

          set(state => ({
            receivables: state.receivables.map(r =>
              r.id === receivableId ? updatedReceivable : r
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to record payment',
            loading: false,
          });
          throw error;
        }
      },

      updateReceivableStatus: async (receivableId: string, status: Receivable['status']) => {
        // This would use a partial update endpoint
        set({ loading: true, error: null });
        try {
          const updated = await receivableApi.partialUpdate(receivableId, { status } as any);
          const updatedReceivable = mapApiToReceivable(updated);

          set(state => ({
            receivables: state.receivables.map(r =>
              r.id === receivableId ? updatedReceivable : r
            ),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update status',
            loading: false,
          });
          throw error;
        }
      },

      deleteReceivable: async (receivableId: string) => {
        set({ loading: true, error: null });
        try {
          await receivableApi.delete(receivableId);

          set(state => ({
            receivables: state.receivables.filter(r => r.id !== receivableId),
            loading: false,
            error: null,
          }));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete receivable',
            loading: false,
          });
          throw error;
        }
      },

      getReceivableById: (receivableId: string) => {
        return get().receivables.find(r => r.id === receivableId);
      },

      getCustomerById: (customerId: string) => {
        return get().customers.find(c => c.id === customerId);
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'receivables-storage',
      partialize: (state) => ({
        // Only persist data, not loading/error states
        receivables: state.receivables,
        customers: state.customers,
      }),
    }
  )
);
