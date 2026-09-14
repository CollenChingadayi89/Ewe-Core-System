import { create } from 'zustand';
import { mockReceivables, mockReceivableRequests, mockReceivableCustomers } from '../mock/receivables';
import type { Receivable, ReceivableRequest, ReceivableCustomer, ReceivableCategory } from '../types/index';

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

  // Actions
  fetchReceivables: () => void;
  fetchReceivableRequests: () => void;
  submitReceivable: (userId: string, userName: string, data: ReceivableFormData) => Promise<void>;
  approveReceivable: (receivableId: string, userId: string, userName: string, comment?: string) => Promise<void>;
  rejectReceivable: (receivableId: string, userId: string, userName: string, comment: string) => Promise<void>;
  markAsPaid: (receivableId: string, userId: string, userName: string) => Promise<void>;
  recordPayment: (receivableId: string, userId: string, userName: string, payment: PaymentData) => Promise<void>;
  updateReceivableStatus: (receivableId: string, status: Receivable['status']) => Promise<void>;
  deleteReceivable: (receivableId: string) => Promise<void>;
  getReceivableById: (receivableId: string) => Receivable | undefined;
  getCustomerById: (customerId: string) => ReceivableCustomer | undefined;
}

export const useReceivablesStore = create<ReceivablesState>((set, get) => ({
  receivables: [],
  receivableRequests: [],
  customers: mockReceivableCustomers,
  loading: false,

  fetchReceivables: () => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      set({
        receivables: mockReceivables,
        loading: false
      });
    }, 300);
  },

  fetchReceivableRequests: () => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      set({
        receivableRequests: mockReceivableRequests,
        loading: false
      });
    }, 300);
  },

  submitReceivable: async (userId: string, userName: string, data: ReceivableFormData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const newReceivable: Receivable = {
      id: `RCV-2026-${String(get().receivables.length + 1).padStart(3, '0')}`,
      ...data,
      status: 'pending',
      amountPaid: 0,
      amountOutstanding: data.amount,
      createdBy: userId,
      createdByName: userName,
      createdAt: now,
      updatedAt: now,
    };

    // Create approval request
    const newRequest: ReceivableRequest = {
      id: `RCVREQ-${String(get().receivableRequests.length + 1).padStart(3, '0')}`,
      type: 'receivable',
      requestorId: userId,
      requestorName: userName,
      createdAt: now,
      updatedAt: now,
      status: 'pending',
      currentApproverId: 'USR-003', // Finance Manager (David Kamau)
      priority: data.priority,
      amount: data.amount,
      data: {
        memberId: data.memberId,
        memberName: data.memberName,
        memberNumber: data.memberNumber,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        category: data.category,
        categoryDisplay: data.categoryDisplay,
        referenceNumber: data.referenceNumber,
        invoiceDate: data.invoiceDate,
        amount: data.amount,
        currency: data.currency,
        dueDate: data.dueDate,
        expectedDate: data.expectedDate,
        department: data.department,
        description: data.description,
        paymentMethod: data.paymentMethod,
        installmentNumber: data.installmentNumber,
        totalInstallments: data.totalInstallments,
        loanAccountNumber: data.loanAccountNumber,
        shareCertificateNumber: data.shareCertificateNumber,
        attachments: data.attachments,
        notes: data.notes,
      },
      approvalChain: [
        {
          id: `STEP-${newReceivable.id}-1`,
          approverId: 'USR-003',
          approverName: 'David Kamau',
          status: 'pending',
          order: 1,
        },
        {
          id: `STEP-${newReceivable.id}-2`,
          approverId: 'USR-001',
          approverName: 'Margaret Njeri',
          status: 'pending',
          order: 2,
        },
      ],
    };

    set(state => ({
      receivables: [...state.receivables, newReceivable],
      receivableRequests: [...state.receivableRequests, newRequest],
    }));
  },

  approveReceivable: async (receivableId: string, userId: string, userName: string, comment?: string) => {
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
      receivables: state.receivables.map(r =>
        r.id === receivableId
          ? {
              ...r,
              status: 'approved',
              approvedBy: userName,
              approvedAt: now,
              updatedAt: now,
            }
          : r
      ),
      receivableRequests: state.receivableRequests.map(req =>
        req.id === `REQ-${receivableId}` || req.id === `RCVREQ-${receivableId.split('-')[2]}`
          ? {
              ...req,
              status: 'approved',
              updatedAt: now,
            }
          : req
      ),
    }));
  },

  rejectReceivable: async (receivableId: string, userId: string, userName: string, comment: string) => {
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
      receivables: state.receivables.map(r =>
        r.id === receivableId
          ? {
              ...r,
              status: 'rejected',
              updatedAt: now,
              notes: r.notes ? `${r.notes}\n\nRejection reason: ${comment}` : `Rejection reason: ${comment}`,
            }
          : r
      ),
      receivableRequests: state.receivableRequests.map(req =>
        req.id === `REQ-${receivableId}` || req.id === `RCVREQ-${receivableId.split('-')[2]}`
          ? {
              ...req,
              status: 'rejected',
              updatedAt: now,
            }
          : req
      ),
    }));
  },

  markAsPaid: async (receivableId: string, userId: string, userName: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const receivable = get().receivables.find(r => r.id === receivableId);
    if (!receivable) return;

    set(state => ({
      receivables: state.receivables.map(r =>
        r.id === receivableId
          ? {
              ...r,
              status: 'paid',
              amountPaid: r.amount,
              amountOutstanding: 0,
              paidBy: userName,
              paidAt: now,
              lastPaymentDate: now,
              updatedAt: now,
            }
          : r
      ),
    }));
  },

  recordPayment: async (receivableId: string, userId: string, userName: string, payment: PaymentData) => {
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
      receivables: state.receivables.map(r => {
        if (r.id === receivableId) {
          const currentPaid = r.amountPaid || 0;
          const newAmountPaid = currentPaid + payment.amount;
          const newOutstanding = r.amount - newAmountPaid;
          const isFullyPaid = newOutstanding <= 0;

          return {
            ...r,
            status: isFullyPaid ? 'paid' : 'partially-paid',
            amountPaid: newAmountPaid,
            amountOutstanding: newOutstanding > 0 ? newOutstanding : 0,
            lastPaymentDate: payment.paymentDate,
            paymentMethod: payment.paymentMethod,
            paidBy: isFullyPaid ? userName : r.paidBy,
            paidAt: isFullyPaid ? now : r.paidAt,
            updatedAt: now,
            notes: r.notes
              ? `${r.notes}\n\nPayment recorded: ZWG ${payment.amount.toLocaleString()} on ${payment.paymentDate}${payment.notes ? ` - ${payment.notes}` : ''}`
              : `Payment recorded: ZWG ${payment.amount.toLocaleString()} on ${payment.paymentDate}${payment.notes ? ` - ${payment.notes}` : ''}`,
          };
        }
        return r;
      }),
    }));
  },

  updateReceivableStatus: async (receivableId: string, status: Receivable['status']) => {
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
      receivables: state.receivables.map(r =>
        r.id === receivableId
          ? {
              ...r,
              status,
              updatedAt: now,
            }
          : r
      ),
    }));
  },

  deleteReceivable: async (receivableId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    set(state => ({
      receivables: state.receivables.filter(r => r.id !== receivableId),
      receivableRequests: state.receivableRequests.filter(
        req => req.id !== `REQ-${receivableId}` && req.id !== `RCVREQ-${receivableId.split('-')[2]}`
      ),
    }));
  },

  getReceivableById: (receivableId: string) => {
    return get().receivables.find(r => r.id === receivableId);
  },

  getCustomerById: (customerId: string) => {
    return get().customers.find(c => c.id === customerId);
  },
}));
