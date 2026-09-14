import { create } from 'zustand';
import type { ApprovalRequest, ApprovalStatus } from '../types/index';
import { mockLeaveRequests } from '../mock/leaves';

interface ApprovalState {
  requests: ApprovalRequest[];
  pendingCount: number;
  loading: boolean;
  fetchApprovals: (approverId: string) => void;
  approveRequest: (requestId: string, comment?: string) => Promise<void>;
  rejectRequest: (requestId: string, comment: string) => Promise<void>;
  getRequestById: (requestId: string) => ApprovalRequest | undefined;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  requests: [],
  pendingCount: 0,
  loading: false,

  fetchApprovals: (approverId: string) => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      const userRequests = mockLeaveRequests.filter((request) =>
        request.approvalChain.some(
          (step) => step.approverId === approverId && step.status === 'pending'
        )
      );

      const pendingCount = userRequests.filter(r => r.status === 'pending').length;

      set({ requests: userRequests, pendingCount, loading: false });
    }, 300);
  },

  approveRequest: async (requestId: string, comment?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    set((state) => ({
      requests: state.requests.map((request) => {
        if (request.id === requestId) {
          return {
            ...request,
            status: 'approved' as ApprovalStatus,
            updatedAt: new Date().toISOString(),
            approvalChain: request.approvalChain.map((step) =>
              step.status === 'pending'
                ? {
                    ...step,
                    status: 'approved' as ApprovalStatus,
                    comment,
                    timestamp: new Date().toISOString(),
                  }
                : step
            ),
          };
        }
        return request;
      }),
      pendingCount: state.pendingCount - 1,
    }));
  },

  rejectRequest: async (requestId: string, comment: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    set((state) => ({
      requests: state.requests.map((request) => {
        if (request.id === requestId) {
          return {
            ...request,
            status: 'rejected' as ApprovalStatus,
            updatedAt: new Date().toISOString(),
            approvalChain: request.approvalChain.map((step) =>
              step.status === 'pending'
                ? {
                    ...step,
                    status: 'rejected' as ApprovalStatus,
                    comment,
                    timestamp: new Date().toISOString(),
                  }
                : step
            ),
          };
        }
        return request;
      }),
      pendingCount: state.pendingCount - 1,
    }));
  },

  getRequestById: (requestId: string) => {
    return get().requests.find((r) => r.id === requestId);
  },
}));
