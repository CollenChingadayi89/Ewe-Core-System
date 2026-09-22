import { create } from 'zustand';
import type { ApprovalRequest, ApprovalStatus } from '../types/index';
import { mockLeaveRequests } from '../mock/leaves';
import {
  approvalRequestApi,
  approvalWorkflowApi,
  type ApprovalRequestListResponse,
  type ApprovalRequestDetailResponse,
  type ApprovalWorkflowResponse,
} from '../services/api/approval';
import { message } from 'antd';

// Check if we should use mock data
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

interface ApprovalState {
  // State
  requests: ApprovalRequest[];
  workflows: Array<{
    id: string;
    workflowName: string;
    workflowType: string;
    description: string | null;
    isActive: boolean;
  }>;
  pendingCount: number;
  loading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions
  fetchApprovals: (approverId: string) => Promise<void>;
  fetchAllRequests: (filters?: {
    page?: number;
    status?: string;
    priority?: string;
    ordering?: string;
  }) => Promise<void>;
  fetchMyRequests: (requesterId: string, filters?: {
    page?: number;
    status?: string;
    ordering?: string;
  }) => Promise<void>;
  fetchWorkflows: (filters?: {
    workflowType?: string;
    isActive?: boolean;
  }) => Promise<void>;
  approveRequest: (requestId: string, comment?: string) => Promise<void>;
  rejectRequest: (requestId: string, comment: string) => Promise<void>;
  cancelRequest: (requestId: string, reason: string) => Promise<void>;
  getRequestById: (requestId: string) => ApprovalRequest | undefined;
  clearError: () => void;
}

// ============================================================================
// MAPPING FUNCTIONS - API to Frontend Types
// ============================================================================

const mapApiToApprovalRequest = (api: ApprovalRequestListResponse | ApprovalRequestDetailResponse): ApprovalRequest => {
  // Get approval steps from detailed response
  const detailResponse = api as ApprovalRequestDetailResponse;

  return {
    id: api.id,
    type: api.metadata?.type || 'other',
    requestorId: api.requester,
    requestorName: detailResponse.requester_details?.full_name || 'Unknown',
    status: api.status as ApprovalStatus,
    priority: api.priority,
    amount: api.amount ? parseFloat(api.amount) : undefined,
    createdAt: api.submitted_date,
    updatedAt: api.updated_at,
    dueDate: api.due_date || undefined,
    approvalChain: detailResponse.approval_steps?.map((step) => ({
      id: step.id.toString(),
      stage: step.stage_number,
      stageName: step.stage_name,
      approverId: step.approver,
      approverName: step.approver_name,
      status: step.status as ApprovalStatus,
      timestamp: step.decision_date || step.created_at,
      comment: step.comments || undefined,
    })) || [],
    data: {
      summary: api.request_summary,
      requestNumber: api.request_number,
      workflowId: api.workflow || undefined,
      contentType: api.content_type,
      objectId: api.object_id,
      rejectionReason: api.rejection_reason || undefined,
      ...api.metadata,
    },
  };
};

const mapApiToWorkflow = (api: ApprovalWorkflowResponse) => ({
  id: api.id,
  workflowName: api.workflow_name,
  workflowType: api.workflow_type,
  description: api.description,
  isActive: api.is_active,
});

// ============================================================================
// ZUSTAND STORE
// ============================================================================

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  // Initial State
  requests: [],
  workflows: [],
  pendingCount: 0,
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,

  // ========================================================================
  // FETCH APPROVALS (for specific approver)
  // ========================================================================
  fetchApprovals: async (approverId: string) => {
    if (USE_MOCK) {
      set({ loading: true });
      setTimeout(() => {
        const userRequests = mockLeaveRequests.filter((request) =>
          request.approvalChain.some(
            (step) => step.approverId === approverId && step.status === 'pending'
          )
        );

        const pendingCount = userRequests.filter((r) => r.status === 'pending').length;

        set({ requests: userRequests, pendingCount, loading: false });
      }, 300);
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await approvalRequestApi.list({
        current_approver: approverId,
        status: 'pending',
        ordering: '-submitted_date',
      });

      // Fetch detailed info for each request to get approval_steps
      const detailedRequests = await Promise.all(
        response.results.map((req) => approvalRequestApi.retrieve(req.id))
      );

      const requests = detailedRequests.map(mapApiToApprovalRequest);
      const pendingCount = requests.filter((r) => r.status === 'pending').length;

      set({
        requests,
        pendingCount,
        loading: false,
        totalPages: Math.ceil(response.count / 50),
        totalCount: response.count,
      });
    } catch (error: any) {
      console.error('Failed to fetch approvals:', error);
      set({
        error: error.message || 'Failed to fetch approvals',
        loading: false,
      });
      message.error('Failed to load approval requests');
    }
  },

  // ========================================================================
  // FETCH ALL REQUESTS (with pagination and filters)
  // ========================================================================
  fetchAllRequests: async (filters = {}) => {
    if (USE_MOCK) {
      set({ loading: true });
      setTimeout(() => {
        set({
          requests: [...mockLeaveRequests],
          loading: false,
          totalPages: 1,
          totalCount: mockLeaveRequests.length,
        });
      }, 300);
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await approvalRequestApi.list({
        page: filters.page || 1,
        status: filters.status,
        priority: filters.priority,
        ordering: filters.ordering || '-submitted_date',
      });

      // Fetch detailed info for each request
      const detailedRequests = await Promise.all(
        response.results.map((req) => approvalRequestApi.retrieve(req.id))
      );

      const requests = detailedRequests.map(mapApiToApprovalRequest);

      set({
        requests,
        loading: false,
        currentPage: filters.page || 1,
        totalPages: Math.ceil(response.count / 50),
        totalCount: response.count,
      });
    } catch (error: any) {
      console.error('Failed to fetch all requests:', error);
      set({
        error: error.message || 'Failed to fetch approval requests',
        loading: false,
      });
      message.error('Failed to load approval requests');
    }
  },

  // ========================================================================
  // FETCH MY REQUESTS (requests created by user)
  // ========================================================================
  fetchMyRequests: async (requesterId: string, filters = {}) => {
    if (USE_MOCK) {
      set({ loading: true });
      setTimeout(() => {
        const myRequests = mockLeaveRequests.filter((r) => r.requestorId === requesterId);
        set({
          requests: myRequests,
          loading: false,
          totalPages: 1,
          totalCount: myRequests.length,
        });
      }, 300);
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await approvalRequestApi.list({
        requester: requesterId,
        page: filters.page || 1,
        status: filters.status,
        ordering: filters.ordering || '-submitted_date',
      });

      // Fetch detailed info
      const detailedRequests = await Promise.all(
        response.results.map((req) => approvalRequestApi.retrieve(req.id))
      );

      const requests = detailedRequests.map(mapApiToApprovalRequest);

      set({
        requests,
        loading: false,
        currentPage: filters.page || 1,
        totalPages: Math.ceil(response.count / 50),
        totalCount: response.count,
      });
    } catch (error: any) {
      console.error('Failed to fetch my requests:', error);
      set({
        error: error.message || 'Failed to fetch your requests',
        loading: false,
      });
      message.error('Failed to load your requests');
    }
  },

  // ========================================================================
  // FETCH WORKFLOWS
  // ========================================================================
  fetchWorkflows: async (filters = {}) => {
    if (USE_MOCK) {
      set({
        workflows: [
          {
            id: '1',
            workflowName: 'Leave Approval Workflow',
            workflowType: 'leave',
            description: 'Standard leave approval process',
            isActive: true,
          },
          {
            id: '2',
            workflowName: 'Expense Approval Workflow',
            workflowType: 'expense',
            description: 'Expense reimbursement approval',
            isActive: true,
          },
        ],
      });
      return;
    }

    try {
      const response = await approvalWorkflowApi.list({
        workflow_type: filters.workflowType,
        is_active: filters.isActive,
      });

      const workflows = response.results.map(mapApiToWorkflow);

      set({ workflows });
    } catch (error: any) {
      console.error('Failed to fetch workflows:', error);
      message.error('Failed to load approval workflows');
    }
  },

  // ========================================================================
  // APPROVE REQUEST
  // ========================================================================
  approveRequest: async (requestId: string, comment?: string) => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));

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
      return;
    }

    try {
      const updatedRequest = await approvalRequestApi.approve(requestId, {
        comments: comment,
      });

      const mappedRequest = mapApiToApprovalRequest(updatedRequest);

      set((state) => ({
        requests: state.requests.map((r) => (r.id === requestId ? mappedRequest : r)),
        pendingCount: Math.max(0, state.pendingCount - 1),
      }));

      message.success('Request approved successfully');
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      message.error(error.message || 'Failed to approve request');
      throw error;
    }
  },

  // ========================================================================
  // REJECT REQUEST
  // ========================================================================
  rejectRequest: async (requestId: string, comment: string) => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));

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
      return;
    }

    try {
      const updatedRequest = await approvalRequestApi.reject(requestId, {
        comments: comment,
      });

      const mappedRequest = mapApiToApprovalRequest(updatedRequest);

      set((state) => ({
        requests: state.requests.map((r) => (r.id === requestId ? mappedRequest : r)),
        pendingCount: Math.max(0, state.pendingCount - 1),
      }));

      message.success('Request rejected');
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      message.error(error.message || 'Failed to reject request');
      throw error;
    }
  },

  // ========================================================================
  // CANCEL REQUEST
  // ========================================================================
  cancelRequest: async (requestId: string, reason: string) => {
    if (USE_MOCK) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      set((state) => ({
        requests: state.requests.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: 'cancelled' as ApprovalStatus,
                updatedAt: new Date().toISOString(),
                data: {
                  ...request.data,
                  cancellationReason: reason,
                },
              }
            : request
        ),
      }));
      return;
    }

    try {
      const updatedRequest = await approvalRequestApi.cancel(requestId, {
        reason,
      });

      const mappedRequest = mapApiToApprovalRequest(updatedRequest);

      set((state) => ({
        requests: state.requests.map((r) => (r.id === requestId ? mappedRequest : r)),
      }));

      message.success('Request cancelled successfully');
    } catch (error: any) {
      console.error('Failed to cancel request:', error);
      message.error(error.message || 'Failed to cancel request');
      throw error;
    }
  },

  // ========================================================================
  // GET REQUEST BY ID
  // ========================================================================
  getRequestById: (requestId: string) => {
    return get().requests.find((r) => r.id === requestId);
  },

  // ========================================================================
  // CLEAR ERROR
  // ========================================================================
  clearError: () => {
    set({ error: null });
  },
}));
