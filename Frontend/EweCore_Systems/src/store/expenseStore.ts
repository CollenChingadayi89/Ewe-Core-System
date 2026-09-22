/**
 * Expense Store - Zustand state management for expense reimbursements
 * Integrates with real API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { expenseApi } from '../services/api/expenses';
import type {
  ExpenseListResponse,
  ExpenseDetailResponse,
  ExpenseCreateRequest,
  ExpenseFilters,
} from '../services/api/expenses';
import { message } from 'antd';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface ExpenseState {
  // State
  expenses: ExpenseListResponse[];
  selectedExpense: ExpenseDetailResponse | null;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions
  fetchExpenses: (filters?: ExpenseFilters) => Promise<void>;
  fetchExpenseById: (id: string) => Promise<void>;
  createExpense: (data: ExpenseCreateRequest) => Promise<ExpenseDetailResponse | null>;
  updateExpense: (id: string, data: Partial<ExpenseCreateRequest>) => Promise<ExpenseDetailResponse | null>;
  deleteExpense: (id: string) => Promise<boolean>;

  // Utility
  clearError: () => void;
  clearSelectedExpense: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useExpenseStore = create<ExpenseState>()(
  persist(
    (set, get) => ({
      // Initial State
      expenses: [],
      selectedExpense: null,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // EXPENSE ACTIONS
      // ========================================================================

      fetchExpenses: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await expenseApi.list({
            page: filters.page || 1,
            page_size: filters.page_size || 50,
            search: filters.search,
            status: filters.status,
            category: filters.category,
            employee: filters.employee,
            current_approver: filters.current_approver,
            priority: filters.priority,
            expense_date_after: filters.expense_date_after,
            expense_date_before: filters.expense_date_before,
            ordering: filters.ordering || '-created_at',
          });

          set({
            expenses: response.results,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / (filters.page_size || 50)),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch expenses:', error);
          set({
            error: error.message || 'Failed to fetch expenses',
            loading: false,
            expenses: [],
          });
          message.error('Failed to load expenses');
        }
      },

      fetchExpenseById: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await expenseApi.retrieve(id);

          set({
            selectedExpense: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch expense details:', error);
          set({
            error: error.message || 'Failed to fetch expense details',
            loading: false,
          });
          message.error('Failed to load expense details');
        }
      },

      createExpense: async (data: ExpenseCreateRequest) => {
        set({ loading: true, error: null });

        try {
          const response = await expenseApi.create(data);

          set(state => ({
            expenses: [response, ...state.expenses],
            loading: false,
          }));

          message.success(`Expense request "${response.expense_number}" created successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to create expense:', error);
          set({
            error: error.message || 'Failed to create expense',
            loading: false,
          });
          message.error('Failed to create expense request');
          return null;
        }
      },

      updateExpense: async (id: string, data: Partial<ExpenseCreateRequest>) => {
        set({ loading: true, error: null });

        try {
          const response = await expenseApi.partialUpdate(id, data);

          set(state => ({
            expenses: state.expenses.map(e =>
              e.id === id ? response : e
            ),
            selectedExpense: state.selectedExpense?.id === id ? response : state.selectedExpense,
            loading: false,
          }));

          message.success(`Expense "${response.expense_number}" updated successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to update expense:', error);
          set({
            error: error.message || 'Failed to update expense',
            loading: false,
          });
          message.error('Failed to update expense');
          return null;
        }
      },

      deleteExpense: async (id: string) => {
        set({ loading: true, error: null });

        try {
          await expenseApi.delete(id);

          set(state => ({
            expenses: state.expenses.filter(e => e.id !== id),
            loading: false,
          }));

          message.success('Expense deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete expense:', error);
          set({
            error: error.message || 'Failed to delete expense',
            loading: false,
          });
          message.error('Failed to delete expense');
          return false;
        }
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      clearError: () => set({ error: null }),

      clearSelectedExpense: () => set({ selectedExpense: null }),
    }),
    {
      name: 'expense-storage',
      partialize: (state) => ({
        expenses: state.expenses,
      }),
    }
  )
);
