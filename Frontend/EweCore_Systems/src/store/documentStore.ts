/**
 * Document Store - Zustand state management for document management
 * Integrates with real API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { documentApi, documentCategoryApi } from '../services/api/documents';
import type {
  DocumentListResponse,
  DocumentDetailResponse,
  DocumentCreateRequest,
  DocumentFilters,
  DocumentCategoryResponse,
} from '../services/api/documents';
import { message } from 'antd';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface DocumentState {
  // State
  documents: DocumentListResponse[];
  selectedDocument: DocumentDetailResponse | null;
  categories: DocumentCategoryResponse[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Actions - Standard CRUD
  fetchDocuments: (filters?: DocumentFilters) => Promise<void>;
  fetchDocumentById: (id: string) => Promise<void>;
  createDocument: (data: DocumentCreateRequest) => Promise<DocumentDetailResponse | null>;
  updateDocument: (id: string, data: Partial<DocumentCreateRequest>) => Promise<DocumentDetailResponse | null>;
  deleteDocument: (id: string) => Promise<boolean>;

  // Actions - Categories
  fetchCategories: () => Promise<void>;

  // Utility
  clearError: () => void;
  clearSelectedDocument: () => void;
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      // Initial State
      documents: [],
      selectedDocument: null,
      categories: [],
      loading: false,
      uploading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,

      // ========================================================================
      // STANDARD CRUD ACTIONS
      // ========================================================================

      fetchDocuments: async (filters = {}) => {
        set({ loading: true, error: null });

        try {
          const response = await documentApi.list({
            page: filters.page || 1,
            page_size: filters.page_size || 50,
            search: filters.search,
            status: filters.status,
            category: filters.category,
            access_level: filters.access_level,
            uploaded_by: filters.uploaded_by,
            is_latest_version: filters.is_latest_version !== undefined ? filters.is_latest_version : true,
            ordering: filters.ordering || '-upload_date',
          });

          set({
            documents: response.results,
            loading: false,
            currentPage: filters.page || 1,
            totalPages: Math.ceil(response.count / (filters.page_size || 50)),
            totalCount: response.count,
          });
        } catch (error: any) {
          console.error('Failed to fetch documents:', error);
          set({
            error: error.message || 'Failed to fetch documents',
            loading: false,
            documents: [],
          });
          message.error('Failed to load documents');
        }
      },

      fetchDocumentById: async (id: string) => {
        set({ loading: true, error: null });

        try {
          const response = await documentApi.retrieve(id);

          set({
            selectedDocument: response,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch document details:', error);
          set({
            error: error.message || 'Failed to fetch document details',
            loading: false,
          });
          message.error('Failed to load document details');
        }
      },

      createDocument: async (data: DocumentCreateRequest) => {
        set({ uploading: true, error: null });

        try {
          const response = await documentApi.create(data);

          set(state => ({
            documents: [response, ...state.documents],
            uploading: false,
          }));

          message.success(`Document "${response.document_number}" created successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to create document:', error);
          set({
            error: error.message || 'Failed to create document',
            uploading: false,
          });
          message.error('Failed to create document');
          return null;
        }
      },

      updateDocument: async (id: string, data: Partial<DocumentCreateRequest>) => {
        set({ loading: true, error: null });

        try {
          const response = await documentApi.partialUpdate(id, data);

          set(state => ({
            documents: state.documents.map(d =>
              d.id === id ? response : d
            ),
            selectedDocument: state.selectedDocument?.id === id ? response : state.selectedDocument,
            loading: false,
          }));

          message.success(`Document "${response.document_number}" updated successfully`);
          return response;
        } catch (error: any) {
          console.error('Failed to update document:', error);
          set({
            error: error.message || 'Failed to update document',
            loading: false,
          });
          message.error('Failed to update document');
          return null;
        }
      },

      deleteDocument: async (id: string) => {
        set({ loading: true, error: null });

        try {
          await documentApi.delete(id);

          set(state => ({
            documents: state.documents.filter(d => d.id !== id),
            loading: false,
          }));

          message.success('Document deleted successfully');
          return true;
        } catch (error: any) {
          console.error('Failed to delete document:', error);
          set({
            error: error.message || 'Failed to delete document',
            loading: false,
          });
          message.error('Failed to delete document');
          return false;
        }
      },

      // ========================================================================
      // CATEGORY ACTIONS
      // ========================================================================

      fetchCategories: async () => {
        set({ loading: true, error: null });

        try {
          const response = await documentCategoryApi.list();

          set({
            categories: response.results,
            loading: false,
          });
        } catch (error: any) {
          console.error('Failed to fetch document categories:', error);
          set({
            error: error.message || 'Failed to fetch document categories',
            loading: false,
            categories: [],
          });
          message.error('Failed to load document categories');
        }
      },

      // ========================================================================
      // UTILITY ACTIONS
      // ========================================================================

      clearError: () => set({ error: null }),

      clearSelectedDocument: () => set({ selectedDocument: null }),
    }),
    {
      name: 'document-storage',
      partialize: (state) => ({
        documents: state.documents,
        categories: state.categories,
      }),
    }
  )
);
