/**
 * Payables Store — money going OUT of the SACCO to vendors and members.
 *
 * Holds API records as returned by the backend. Approval and payment are driven by the
 * payable approval workflow: approve/reject act on the payable's linked approval request,
 * and "mark paid" is done by the workflow's Pay-stage assignee.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { vendorApi, payableApi } from '../services/api/payables';
import type {
  VendorListResponse,
  VendorCreateRequest,
  VendorDetailResponse,
  PayableListResponse,
  PayableCreateRequest,
  MarkPaidRequest,
} from '../services/api/payables';
import { approvalRequestApi } from '../services/api/approval';

/**
 * Upper bound on pages fetched (API pages are 50 rows), so the dashboard totals cover
 * all payables without unbounded requests.
 */
const MAX_PAGES = 20;

interface PayablesState {
  payables: PayableListResponse[];
  vendors: VendorListResponse[];
  loading: boolean;
  error: string | null;

  fetchPayables: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  /** Creates a vendor (any employee may) and refreshes the vendor list. */
  addVendor: (data: VendorCreateRequest) => Promise<VendorDetailResponse>;
  /** Re-fetches one payable (e.g. after a workflow action) and replaces it in the list. */
  refreshPayable: (payableId: string) => Promise<void>;
  submitPayable: (data: PayableCreateRequest) => Promise<PayableListResponse>;
  approvePayable: (payable: PayableListResponse, comments?: string) => Promise<void>;
  rejectPayable: (payable: PayableListResponse, comments: string) => Promise<void>;
  markAsPaid: (payableId: string, data: MarkPaidRequest) => Promise<void>;
  deletePayable: (payableId: string) => Promise<void>;
}

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const usePayablesStore = create<PayablesState>()(
  persist(
    (set, get) => ({
      payables: [],
      vendors: [],
      loading: false,
      error: null,

      fetchPayables: async () => {
        set({ loading: true, error: null });
        try {
          const payables: PayableListResponse[] = [];
          for (let page = 1; page <= MAX_PAGES; page++) {
            const response = await payableApi.list({ page });
            payables.push(...response.results);
            if (!response.next) break;
          }
          set({ payables, loading: false });
        } catch (error) {
          set({ error: errorMessage(error, 'Failed to fetch payables'), loading: false });
        }
      },

      fetchVendors: async () => {
        try {
          const response = await vendorApi.list({ is_active: true });
          set({ vendors: response.results });
        } catch (error) {
          set({ error: errorMessage(error, 'Failed to fetch vendors') });
        }
      },

      addVendor: async (data: VendorCreateRequest) => {
        const created = await vendorApi.create(data);
        await get().fetchVendors();
        return created;
      },

      refreshPayable: async (payableId: string) => {
        const updated = await payableApi.retrieve(payableId);
        set(state => ({
          payables: state.payables.map(p => (p.id === payableId ? updated : p)),
        }));
      },

      submitPayable: async (data: PayableCreateRequest) => {
        const created = await payableApi.create(data);
        set(state => ({ payables: [created, ...state.payables] }));
        return created;
      },

      approvePayable: async (payable: PayableListResponse, comments = '') => {
        if (!payable.approval) throw new Error('This payable has no approval request.');
        await approvalRequestApi.approve(payable.approval.id, { comments });
        await get().refreshPayable(payable.id);
      },

      rejectPayable: async (payable: PayableListResponse, comments: string) => {
        if (!payable.approval) throw new Error('This payable has no approval request.');
        await approvalRequestApi.reject(payable.approval.id, { comments });
        await get().refreshPayable(payable.id);
      },

      markAsPaid: async (payableId: string, data: MarkPaidRequest) => {
        const updated = await payableApi.markPaid(payableId, data);
        set(state => ({
          payables: state.payables.map(p => (p.id === payableId ? updated : p)),
        }));
      },

      deletePayable: async (payableId: string) => {
        await payableApi.delete(payableId);
        set(state => ({ payables: state.payables.filter(p => p.id !== payableId) }));
      },
    }),
    {
      name: 'payables-storage',
      // v2: payables are no longer persisted (they include per-user approval state);
      // discard anything stored in the old shape.
      version: 2,
      migrate: () => ({ vendors: [] }),
      partialize: (state) => ({ vendors: state.vendors }),
    }
  )
);
