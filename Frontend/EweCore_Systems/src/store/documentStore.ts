import { create } from 'zustand';
import type {
  Document,
  DocumentRequest,
  DocumentCategory,
  DocumentAccessLevel,
  ApprovalStatus,
} from '../types/index';
import {
  mockDocuments,
  getDocumentById,
  getDocumentsByDepartment,
  getDocumentsByCategory,
  getPendingDocuments,
  getUserDocuments,
} from '../mock/documents';

interface DocumentUploadData {
  title: string;
  description?: string;
  category: DocumentCategory;
  file: File;
  accessLevel: DocumentAccessLevel;
  tags?: string[];
}

interface DocumentUpdateData {
  title?: string;
  description?: string;
  category?: DocumentCategory;
  tags?: string[];
}

interface DocumentState {
  documents: Document[];
  selectedDocument: Document | null;
  loading: boolean;
  uploading: boolean;

  // Actions
  fetchDocuments: (userId?: string, userDepartment?: string) => void;
  fetchDocument: (id: string) => void;
  uploadDocument: (
    userId: string,
    userName: string,
    userDepartment: string,
    data: DocumentUploadData
  ) => Promise<void>;
  updateDocument: (documentId: string, data: DocumentUpdateData) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  approveDocument: (documentId: string, approverId: string, approverName: string) => Promise<void>;
  rejectDocument: (
    documentId: string,
    approverId: string,
    approverName: string,
    reason: string
  ) => Promise<void>;
  downloadDocument: (documentId: string) => void;
  uploadNewVersion: (
    documentId: string,
    file: File,
    userId: string,
    userName: string,
    changeNotes?: string
  ) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  selectedDocument: null,
  loading: false,
  uploading: false,

  fetchDocuments: (userId?: string, userDepartment?: string) => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      let filteredDocs = [...mockDocuments];

      // Filter documents based on user access
      if (userDepartment) {
        filteredDocs = filteredDocs.filter(
          (doc) =>
            // Show approved organization-wide documents
            (doc.accessLevel === 'organization' && doc.status === 'approved') ||
            // Show all documents from user's department (including pending if they uploaded)
            (doc.department === userDepartment &&
              (doc.status === 'approved' || doc.uploadedBy === userId))
        );
      }

      set({ documents: filteredDocs, loading: false });
    }, 300);
  },

  fetchDocument: (id: string) => {
    set({ loading: true });

    // Simulate API call
    setTimeout(() => {
      const document = getDocumentById(id);

      // Increment view count
      if (document) {
        document.viewCount += 1;
      }

      set({ selectedDocument: document || null, loading: false });
    }, 200);
  },

  uploadDocument: async (userId, userName, userDepartment, data) => {
    set({ uploading: true });

    // Simulate file upload API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, file would be uploaded to cloud storage and URL returned
    const mockFileUrl = `/documents/${userDepartment.toLowerCase()}/${data.file.name}`;

    const newDocument: Document = {
      id: `DOC${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category,
      fileUrl: mockFileUrl,
      fileName: data.file.name,
      fileType: data.file.type.includes('pdf')
        ? 'pdf'
        : data.file.type.includes('word')
        ? 'docx'
        : data.file.type.includes('sheet')
        ? 'xlsx'
        : data.file.type.includes('presentation')
        ? 'pptx'
        : data.file.type.includes('image')
        ? 'image'
        : 'other',
      fileSize: data.file.size,
      accessLevel: data.accessLevel,
      department: userDepartment,
      departmentName: userDepartment,
      uploadedBy: userId,
      uploadedByName: userName,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending', // Requires approval
      currentVersion: 1,
      versions: [
        {
          id: `VER${Date.now()}-1`,
          version: 1,
          fileUrl: mockFileUrl,
          fileSize: data.file.size,
          uploadedBy: userId,
          uploadedByName: userName,
          uploadedAt: new Date().toISOString(),
        },
      ],
      tags: data.tags || [],
      downloadCount: 0,
      viewCount: 0,
    };

    set((state) => ({
      documents: [newDocument, ...state.documents],
      uploading: false,
    }));
  },

  updateDocument: async (documentId, data) => {
    set({ loading: true });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : doc
      ),
      loading: false,
    }));

    // Update selected document if it's the one being updated
    const { selectedDocument } = get();
    if (selectedDocument?.id === documentId) {
      set((state) => ({
        selectedDocument: state.documents.find((doc) => doc.id === documentId) || null,
      }));
    }
  },

  deleteDocument: async (documentId) => {
    set({ loading: true });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    set((state) => ({
      documents: state.documents.filter((doc) => doc.id !== documentId),
      loading: false,
      selectedDocument: state.selectedDocument?.id === documentId ? null : state.selectedDocument,
    }));
  },

  approveDocument: async (documentId, approverId, approverName) => {
    set({ loading: true });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              status: 'approved' as ApprovalStatus,
              updatedAt: new Date().toISOString(),
            }
          : doc
      ),
      loading: false,
    }));

    // Update selected document if it's the one being approved
    const { selectedDocument } = get();
    if (selectedDocument?.id === documentId) {
      set((state) => ({
        selectedDocument: state.documents.find((doc) => doc.id === documentId) || null,
      }));
    }
  },

  rejectDocument: async (documentId, approverId, approverName, reason) => {
    set({ loading: true });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              status: 'rejected' as ApprovalStatus,
              updatedAt: new Date().toISOString(),
            }
          : doc
      ),
      loading: false,
    }));

    // Update selected document if it's the one being rejected
    const { selectedDocument } = get();
    if (selectedDocument?.id === documentId) {
      set((state) => ({
        selectedDocument: state.documents.find((doc) => doc.id === documentId) || null,
      }));
    }
  },

  downloadDocument: (documentId) => {
    // Increment download count
    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              downloadCount: doc.downloadCount + 1,
            }
          : doc
      ),
    }));

    // In a real app, this would trigger actual file download
    const document = get().documents.find((doc) => doc.id === documentId);
    if (document) {
      console.log(`Downloading: ${document.fileName} from ${document.fileUrl}`);
      // window.open(document.fileUrl, '_blank');
    }
  },

  uploadNewVersion: async (documentId, file, userId, userName, changeNotes) => {
    set({ uploading: true });

    // Simulate file upload API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const document = get().documents.find((doc) => doc.id === documentId);
    if (!document) {
      set({ uploading: false });
      return;
    }

    const newVersion = document.currentVersion + 1;
    const mockFileUrl = `/documents/${document.department.toLowerCase()}/v${newVersion}-${file.name}`;

    const newVersionData = {
      id: `VER${Date.now()}-${newVersion}`,
      version: newVersion,
      fileUrl: mockFileUrl,
      fileSize: file.size,
      uploadedBy: userId,
      uploadedByName: userName,
      uploadedAt: new Date().toISOString(),
      changeNotes,
    };

    set((state) => ({
      documents: state.documents.map((doc) =>
        doc.id === documentId
          ? {
              ...doc,
              currentVersion: newVersion,
              fileUrl: mockFileUrl,
              fileName: file.name,
              fileSize: file.size,
              versions: [...doc.versions, newVersionData],
              updatedAt: new Date().toISOString(),
              status: 'pending' as ApprovalStatus, // New version requires approval
            }
          : doc
      ),
      uploading: false,
    }));

    // Update selected document if it's the one being updated
    const { selectedDocument } = get();
    if (selectedDocument?.id === documentId) {
      set((state) => ({
        selectedDocument: state.documents.find((doc) => doc.id === documentId) || null,
      }));
    }
  },
}));
