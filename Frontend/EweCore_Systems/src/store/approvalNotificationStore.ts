/**
 * Approval Notification Store
 * Manages approval-related notifications from the backend
 * Separate from the general notificationStore to handle approval-specific notifications
 */

import { create } from 'zustand';
import { notificationApi, type NotificationResponse } from '../services/api/approval';
import { message } from 'antd';

// Check if we should use mock data
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

export interface ApprovalNotification {
  id: string;
  type: 'approval_required' | 'approved' | 'rejected' | 'cancelled' | 'escalated' | 'stage_advanced' | 'request_created' | 'reminder';
  title: string;
  message: string;
  approvalRequestId: string | null;
  isRead: boolean;
  readAt: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl: string | null;
  createdAt: string;
}

interface ApprovalNotificationState {
  // State
  notifications: ApprovalNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalCount: number;
  hasMore: boolean;

  // Actions
  fetchNotifications: (filters?: {
    page?: number;
    isRead?: boolean;
    priority?: string;
  }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearError: () => void;

  // Polling
  startPolling: (intervalMs?: number) => void;
  stopPolling: () => void;
}

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

const mapApiToNotification = (api: NotificationResponse): ApprovalNotification => ({
  id: api.id,
  type: api.notification_type,
  title: api.title,
  message: api.message,
  approvalRequestId: api.approval_request,
  isRead: api.is_read,
  readAt: api.read_at,
  priority: api.priority,
  actionUrl: api.action_url,
  createdAt: api.created_at,
});

// ============================================================================
// MOCK DATA (for development without backend)
// ============================================================================

const mockNotifications: ApprovalNotification[] = [
  {
    id: '1',
    type: 'approval_required',
    title: 'New Approval Required: APR-2026-000042',
    message: 'You have a new Manager Approval request from John Kamau for Leave Request: Annual Leave - 5 days',
    approvalRequestId: 'req-1',
    isRead: false,
    readAt: null,
    priority: 'medium',
    actionUrl: '/approvals',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'approved',
    title: 'Request Approved: APR-2026-000041',
    message: 'Your leave request has been fully approved',
    approvalRequestId: 'req-2',
    isRead: false,
    readAt: null,
    priority: 'medium',
    actionUrl: '/approvals',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'stage_advanced',
    title: 'Approval Advanced to Next Stage',
    message: 'Your expense request has been advanced to Finance Manager approval',
    approvalRequestId: 'req-3',
    isRead: true,
    readAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'low',
    actionUrl: '/approvals',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ============================================================================
// ZUSTAND STORE
// ============================================================================

let pollingInterval: NodeJS.Timeout | null = null;

export const useApprovalNotificationStore = create<ApprovalNotificationState>((set, get) => ({
  // Initial State
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  currentPage: 1,
  totalCount: 0,
  hasMore: true,

  // ========================================================================
  // FETCH NOTIFICATIONS
  // ========================================================================
  fetchNotifications: async (filters = {}) => {
    if (USE_MOCK) {
      set({ loading: true });
      setTimeout(() => {
        const filtered = filters.isRead !== undefined
          ? mockNotifications.filter(n => n.isRead === filters.isRead)
          : mockNotifications;

        const unreadCount = mockNotifications.filter(n => !n.isRead).length;

        set({
          notifications: filtered,
          unreadCount,
          loading: false,
          totalCount: filtered.length,
          hasMore: false,
        });
      }, 300);
      return;
    }

    set({ loading: true, error: null });

    try {
      const response = await notificationApi.list({
        page: filters.page || 1,
        is_read: filters.isRead,
        priority: filters.priority,
        ordering: '-created_at',
      });

      const notifications = response.results.map(mapApiToNotification);

      // Also fetch unread count
      const countResponse = await notificationApi.getUnreadCount();

      set({
        notifications,
        unreadCount: countResponse.unread_count,
        loading: false,
        currentPage: filters.page || 1,
        totalCount: response.count,
        hasMore: response.next !== null,
      });
    } catch (error: any) {
      console.error('Failed to fetch approval notifications:', error);
      set({
        error: error.message || 'Failed to fetch notifications',
        loading: false,
      });
      // Don't show error message to avoid spamming user
    }
  },

  // ========================================================================
  // FETCH UNREAD COUNT (lightweight, for polling)
  // ========================================================================
  fetchUnreadCount: async () => {
    if (USE_MOCK) {
      const unreadCount = mockNotifications.filter(n => !n.isRead).length;
      set({ unreadCount });
      return;
    }

    try {
      const response = await notificationApi.getUnreadCount();
      set({ unreadCount: response.unread_count });
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
      // Silent fail for polling
    }
  },

  // ========================================================================
  // MARK AS READ
  // ========================================================================
  markAsRead: async (notificationId: string) => {
    if (USE_MOCK) {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      return;
    }

    try {
      await notificationApi.markAsRead(notificationId);

      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      message.error('Failed to mark notification as read');
    }
  },

  // ========================================================================
  // MARK ALL AS READ
  // ========================================================================
  markAllAsRead: async () => {
    if (USE_MOCK) {
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
      message.success('All notifications marked as read');
      return;
    }

    try {
      const response = await notificationApi.markAllAsRead();

      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));

      message.success(response.message || 'All notifications marked as read');
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
      message.error('Failed to mark all notifications as read');
    }
  },

  // ========================================================================
  // DELETE NOTIFICATION
  // ========================================================================
  deleteNotification: async (notificationId: string) => {
    if (USE_MOCK) {
      set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.isRead;

        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          totalCount: state.totalCount - 1,
        };
      });
      return;
    }

    try {
      await notificationApi.delete(notificationId);

      set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.isRead;

        return {
          notifications: state.notifications.filter((n) => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          totalCount: state.totalCount - 1,
        };
      });
    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      message.error('Failed to delete notification');
    }
  },

  // ========================================================================
  // START POLLING (for real-time updates)
  // ========================================================================
  startPolling: (intervalMs = 30000) => {
    // Stop existing polling if any
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Fetch initial count
    get().fetchUnreadCount();

    // Set up polling
    pollingInterval = setInterval(() => {
      get().fetchUnreadCount();
    }, intervalMs);
  },

  // ========================================================================
  // STOP POLLING
  // ========================================================================
  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  },

  // ========================================================================
  // CLEAR ERROR
  // ========================================================================
  clearError: () => {
    set({ error: null });
  },
}));
