import { create } from 'zustand';
import { mockPayables, mockPayableRequests, mockClients } from '../mock/payables';
import type { Payable, PayableRequest } from '../types/index';

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

interface PayablesState {
  payables: Payable[];
  payableRequests: PayableRequest[];
  clients: typeof mockClients;
  loading: boolean;

  // Actions
  fetchPayables: () => void;
  fetchPayableRequests: () => void;
  submitPayable: (userId: string, userName: string, data: PayableFormData) => Promise<void>;
  approvePayable: (payableId: string, userId: string, userName: string, comment?: string) => Promise<void>;
  rejectPayable: (payableId: string, userId: string, userName: string, comment: string) => Promise<void>;
  markAsPaid: (payableId: string, userId: string, userName: string) => Promise<void>;
  updatePayableStatus: (payableId: string, status: Payable['status']) => Promise<void>;
  deletePayable: (payableId: string) => Promise<void>;
  getPayableById: (payableId: string) => Payable | undefined;
}

export const usePayablesStore = create<PayablesState>((set, get) => ({
  payables: [],
  payableRequests: [],
  clients: mockClients,
  loading: false,

  fetchPayables: () => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      set({
        payables: mockPayables,
        loading: false
      });
    }, 300);
  },

  fetchPayableRequests: () => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      set({
        payableRequests: mockPayableRequests,
        loading: false
      });
    }, 300);
  },

  submitPayable: async (userId: string, userName: string, data: PayableFormData) => {
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
  },

  approvePayable: async (payableId: string, userId: string, userName: string, comment?: string) => {
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
  },

  rejectPayable: async (payableId: string, userId: string, userName: string, comment: string) => {
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
  },

  markAsPaid: async (payableId: string, userId: string, userName: string) => {
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
  },

  updatePayableStatus: async (payableId: string, status: Payable['status']) => {
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
  },

  deletePayable: async (payableId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    set(state => ({
      payables: state.payables.filter(p => p.id !== payableId),
    }));
  },

  getPayableById: (payableId: string) => {
    return get().payables.find(p => p.id === payableId);
  },
}));
