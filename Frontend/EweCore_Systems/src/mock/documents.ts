import type { Document, DocumentCategory, DocumentVersion } from '../types/index';

// Document category labels and mappings
export const documentCategoryLabels: Record<DocumentCategory, string> = {
  policy: 'Policy',
  sop: 'SOP (Standard Operating Procedure)',
  form: 'Form',
  contract: 'Contract',
  report: 'Report',
  'training-material': 'Training Material',
  other: 'Other',
};

export const documentCategoryColors: Record<DocumentCategory, string> = {
  policy: '#3B82F6',
  sop: '#00d084',
  form: '#8B5CF6',
  contract: '#F59E0B',
  report: '#10B981',
  'training-material': '#6366F1',
  other: '#6B7280',
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

// Helper function to get file type from filename
export const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'docx';
    case 'xls':
    case 'xlsx':
      return 'xlsx';
    case 'ppt':
    case 'pptx':
      return 'pptx';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return 'image';
    default:
      return 'other';
  }
};

export const mockDocuments: Document[] = [
  // HR Department - Policies
  {
    id: 'DOC001',
    title: 'Employee Leave Policy 2024',
    description: 'Comprehensive leave policy including annual, sick, maternity, and compassionate leave guidelines.',
    category: 'policy',
    fileUrl: '/documents/hr/leave-policy-2024.pdf',
    fileName: 'leave-policy-2024.pdf',
    fileType: 'pdf',
    fileSize: 2456789,
    accessLevel: 'organization',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP001',
    uploadedByName: 'Collen Chingadayi',
    uploadedAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
    status: 'approved',
    currentVersion: 2,
    versions: [
      {
        id: 'VER001-1',
        version: 1,
        fileUrl: '/documents/hr/leave-policy-2023.pdf',
        fileSize: 2234567,
        uploadedBy: 'EMP001',
        uploadedByName: 'Collen Chingadayi',
        uploadedAt: '2023-01-10T10:00:00Z',
        changeNotes: 'Initial version for 2023',
      },
      {
        id: 'VER001-2',
        version: 2,
        fileUrl: '/documents/hr/leave-policy-2024.pdf',
        fileSize: 2456789,
        uploadedBy: 'EMP001',
        uploadedByName: 'Collen Chingadayi',
        uploadedAt: '2024-01-15T09:30:00Z',
        changeNotes: 'Updated for 2024 with revised maternity leave provisions',
      },
    ],
    tags: ['policy', 'hr', 'leave', 'benefits'],
    downloadCount: 245,
    viewCount: 567,
  },
  {
    id: 'DOC002',
    title: 'Code of Conduct',
    description: 'SACCO staff code of conduct and ethical guidelines.',
    category: 'policy',
    fileUrl: '/documents/hr/code-of-conduct.pdf',
    fileName: 'code-of-conduct.pdf',
    fileType: 'pdf',
    fileSize: 1567890,
    accessLevel: 'organization',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP001',
    uploadedByName: 'Collen Chingadayi',
    uploadedAt: '2023-06-20T14:00:00Z',
    updatedAt: '2023-06-20T14:00:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER002-1',
        version: 1,
        fileUrl: '/documents/hr/code-of-conduct.pdf',
        fileSize: 1567890,
        uploadedBy: 'EMP001',
        uploadedByName: 'Collen Chingadayi',
        uploadedAt: '2023-06-20T14:00:00Z',
      },
    ],
    tags: ['policy', 'ethics', 'conduct'],
    downloadCount: 189,
    viewCount: 423,
  },
  {
    id: 'DOC003',
    title: 'Remote Work Policy',
    description: 'Guidelines for remote and hybrid work arrangements.',
    category: 'policy',
    fileUrl: '/documents/hr/remote-work-policy.pdf',
    fileName: 'remote-work-policy.pdf',
    fileType: 'pdf',
    fileSize: 987654,
    accessLevel: 'organization',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP002',
    uploadedByName: 'Peter Omondi',
    uploadedAt: '2024-02-01T11:20:00Z',
    updatedAt: '2024-02-01T11:20:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER003-1',
        version: 1,
        fileUrl: '/documents/hr/remote-work-policy.pdf',
        fileSize: 987654,
        uploadedBy: 'EMP002',
        uploadedByName: 'Peter Omondi',
        uploadedAt: '2024-02-01T11:20:00Z',
      },
    ],
    tags: ['policy', 'remote', 'flexibility'],
    downloadCount: 134,
    viewCount: 289,
  },

  // HR Department - SOPs
  {
    id: 'DOC004',
    title: 'Employee Onboarding SOP',
    description: 'Step-by-step process for onboarding new employees.',
    category: 'sop',
    fileUrl: '/documents/hr/onboarding-sop.pdf',
    fileName: 'onboarding-sop.pdf',
    fileType: 'pdf',
    fileSize: 3456789,
    accessLevel: 'department',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP002',
    uploadedByName: 'Peter Omondi',
    uploadedAt: '2023-09-10T08:45:00Z',
    updatedAt: '2024-01-20T10:15:00Z',
    status: 'approved',
    currentVersion: 2,
    versions: [
      {
        id: 'VER004-1',
        version: 1,
        fileUrl: '/documents/hr/onboarding-sop-v1.pdf',
        fileSize: 3234567,
        uploadedBy: 'EMP002',
        uploadedByName: 'Peter Omondi',
        uploadedAt: '2023-09-10T08:45:00Z',
      },
      {
        id: 'VER004-2',
        version: 2,
        fileUrl: '/documents/hr/onboarding-sop.pdf',
        fileSize: 3456789,
        uploadedBy: 'EMP002',
        uploadedByName: 'Peter Omondi',
        uploadedAt: '2024-01-20T10:15:00Z',
        changeNotes: 'Added digital onboarding checklist',
      },
    ],
    tags: ['sop', 'hr', 'onboarding', 'recruitment'],
    downloadCount: 87,
    viewCount: 156,
  },
  {
    id: 'DOC005',
    title: 'Performance Review SOP',
    description: 'Annual and quarterly performance review procedures.',
    category: 'sop',
    fileUrl: '/documents/hr/performance-review-sop.pdf',
    fileName: 'performance-review-sop.pdf',
    fileType: 'pdf',
    fileSize: 2123456,
    accessLevel: 'department',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP001',
    uploadedByName: 'Collen Chingadayi',
    uploadedAt: '2023-11-05T13:30:00Z',
    updatedAt: '2023-11-05T13:30:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER005-1',
        version: 1,
        fileUrl: '/documents/hr/performance-review-sop.pdf',
        fileSize: 2123456,
        uploadedBy: 'EMP001',
        uploadedByName: 'Collen Chingadayi',
        uploadedAt: '2023-11-05T13:30:00Z',
      },
    ],
    tags: ['sop', 'performance', 'review'],
    downloadCount: 112,
    viewCount: 234,
  },

  // HR Department - Forms
  {
    id: 'DOC006',
    title: 'Leave Application Form',
    description: 'Official leave request form for all employees.',
    category: 'form',
    fileUrl: '/documents/hr/leave-application-form.docx',
    fileName: 'leave-application-form.docx',
    fileType: 'docx',
    fileSize: 345678,
    accessLevel: 'organization',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP002',
    uploadedByName: 'Peter Omondi',
    uploadedAt: '2023-05-15T09:00:00Z',
    updatedAt: '2023-05-15T09:00:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER006-1',
        version: 1,
        fileUrl: '/documents/hr/leave-application-form.docx',
        fileSize: 345678,
        uploadedBy: 'EMP002',
        uploadedByName: 'Peter Omondi',
        uploadedAt: '2023-05-15T09:00:00Z',
      },
    ],
    tags: ['form', 'leave', 'hr'],
    downloadCount: 456,
    viewCount: 789,
  },
  {
    id: 'DOC007',
    title: 'Reimbursement Claim Form',
    description: 'Employee expense reimbursement claim form.',
    category: 'form',
    fileUrl: '/documents/finance/reimbursement-form.xlsx',
    fileName: 'reimbursement-form.xlsx',
    fileType: 'xlsx',
    fileSize: 234567,
    accessLevel: 'organization',
    department: 'Finance',
    departmentName: 'Finance',
    uploadedBy: 'EMP010',
    uploadedByName: 'David Kamau',
    uploadedAt: '2023-07-22T10:30:00Z',
    updatedAt: '2023-07-22T10:30:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER007-1',
        version: 1,
        fileUrl: '/documents/finance/reimbursement-form.xlsx',
        fileSize: 234567,
        uploadedBy: 'EMP010',
        uploadedByName: 'David Kamau',
        uploadedAt: '2023-07-22T10:30:00Z',
      },
    ],
    tags: ['form', 'finance', 'reimbursement'],
    downloadCount: 312,
    viewCount: 567,
  },

  // Finance Department - Policies
  {
    id: 'DOC008',
    title: 'Financial Management Policy',
    description: 'Comprehensive financial management and control policy.',
    category: 'policy',
    fileUrl: '/documents/finance/financial-management-policy.pdf',
    fileName: 'financial-management-policy.pdf',
    fileType: 'pdf',
    fileSize: 4567890,
    accessLevel: 'organization',
    department: 'Finance',
    departmentName: 'Finance',
    uploadedBy: 'EMP010',
    uploadedByName: 'David Kamau',
    uploadedAt: '2023-03-10T14:20:00Z',
    updatedAt: '2024-03-10T09:45:00Z',
    status: 'approved',
    currentVersion: 2,
    versions: [
      {
        id: 'VER008-1',
        version: 1,
        fileUrl: '/documents/finance/financial-management-policy-2023.pdf',
        fileSize: 4234567,
        uploadedBy: 'EMP010',
        uploadedByName: 'David Kamau',
        uploadedAt: '2023-03-10T14:20:00Z',
      },
      {
        id: 'VER008-2',
        version: 2,
        fileUrl: '/documents/finance/financial-management-policy.pdf',
        fileSize: 4567890,
        uploadedBy: 'EMP010',
        uploadedByName: 'David Kamau',
        uploadedAt: '2024-03-10T09:45:00Z',
        changeNotes: 'Updated with new IFRS standards',
      },
    ],
    tags: ['policy', 'finance', 'management', 'control'],
    downloadCount: 198,
    viewCount: 367,
  },
  {
    id: 'DOC009',
    title: 'Petty Cash Management Policy',
    description: 'Guidelines for petty cash handling and reconciliation.',
    category: 'policy',
    fileUrl: '/documents/finance/petty-cash-policy.pdf',
    fileName: 'petty-cash-policy.pdf',
    fileType: 'pdf',
    fileSize: 876543,
    accessLevel: 'organization',
    department: 'Finance',
    departmentName: 'Finance',
    uploadedBy: 'EMP011',
    uploadedByName: 'Sarah Mwangi',
    uploadedAt: '2023-08-14T11:00:00Z',
    updatedAt: '2023-08-14T11:00:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER009-1',
        version: 1,
        fileUrl: '/documents/finance/petty-cash-policy.pdf',
        fileSize: 876543,
        uploadedBy: 'EMP011',
        uploadedByName: 'Sarah Mwangi',
        uploadedAt: '2023-08-14T11:00:00Z',
      },
    ],
    tags: ['policy', 'finance', 'petty-cash'],
    downloadCount: 167,
    viewCount: 298,
  },

  // Finance Department - SOPs
  {
    id: 'DOC010',
    title: 'Month-End Close SOP',
    description: 'Step-by-step procedure for monthly financial closing.',
    category: 'sop',
    fileUrl: '/documents/finance/month-end-close-sop.pdf',
    fileName: 'month-end-close-sop.pdf',
    fileType: 'pdf',
    fileSize: 2345678,
    accessLevel: 'department',
    department: 'Finance',
    departmentName: 'Finance',
    uploadedBy: 'EMP010',
    uploadedByName: 'David Kamau',
    uploadedAt: '2023-04-18T16:00:00Z',
    updatedAt: '2023-04-18T16:00:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER010-1',
        version: 1,
        fileUrl: '/documents/finance/month-end-close-sop.pdf',
        fileSize: 2345678,
        uploadedBy: 'EMP010',
        uploadedByName: 'David Kamau',
        uploadedAt: '2023-04-18T16:00:00Z',
      },
    ],
    tags: ['sop', 'finance', 'accounting', 'month-end'],
    downloadCount: 93,
    viewCount: 178,
  },

  // IT Department - Policies
  {
    id: 'DOC011',
    title: 'Information Security Policy',
    description: 'IT security policies, procedures, and best practices.',
    category: 'policy',
    fileUrl: '/documents/it/information-security-policy.pdf',
    fileName: 'information-security-policy.pdf',
    fileType: 'pdf',
    fileSize: 3234567,
    accessLevel: 'organization',
    department: 'IT',
    departmentName: 'IT',
    uploadedBy: 'EMP030',
    uploadedByName: 'Michael Otieno',
    uploadedAt: '2023-02-28T10:00:00Z',
    updatedAt: '2023-02-28T10:00:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER011-1',
        version: 1,
        fileUrl: '/documents/it/information-security-policy.pdf',
        fileSize: 3234567,
        uploadedBy: 'EMP030',
        uploadedByName: 'Michael Otieno',
        uploadedAt: '2023-02-28T10:00:00Z',
      },
    ],
    tags: ['policy', 'it', 'security', 'cybersecurity'],
    downloadCount: 223,
    viewCount: 445,
  },
  {
    id: 'DOC012',
    title: 'Acceptable Use Policy',
    description: 'Guidelines for acceptable use of SACCO IT resources.',
    category: 'policy',
    fileUrl: '/documents/it/acceptable-use-policy.pdf',
    fileName: 'acceptable-use-policy.pdf',
    fileType: 'pdf',
    fileSize: 1234567,
    accessLevel: 'organization',
    department: 'IT',
    departmentName: 'IT',
    uploadedBy: 'EMP030',
    uploadedByName: 'Michael Otieno',
    uploadedAt: '2023-03-15T13:45:00Z',
    updatedAt: '2023-03-15T13:45:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER012-1',
        version: 1,
        fileUrl: '/documents/it/acceptable-use-policy.pdf',
        fileSize: 1234567,
        uploadedBy: 'EMP030',
        uploadedByName: 'Michael Otieno',
        uploadedAt: '2023-03-15T13:45:00Z',
      },
    ],
    tags: ['policy', 'it', 'usage'],
    downloadCount: 267,
    viewCount: 489,
  },

  // IT Department - SOPs
  {
    id: 'DOC013',
    title: 'System Backup and Recovery SOP',
    description: 'Procedures for data backup and disaster recovery.',
    category: 'sop',
    fileUrl: '/documents/it/backup-recovery-sop.pdf',
    fileName: 'backup-recovery-sop.pdf',
    fileType: 'pdf',
    fileSize: 2876543,
    accessLevel: 'department',
    department: 'IT',
    departmentName: 'IT',
    uploadedBy: 'EMP031',
    uploadedByName: 'James Kimani',
    uploadedAt: '2023-06-12T09:30:00Z',
    updatedAt: '2023-06-12T09:30:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER013-1',
        version: 1,
        fileUrl: '/documents/it/backup-recovery-sop.pdf',
        fileSize: 2876543,
        uploadedBy: 'EMP031',
        uploadedByName: 'James Kimani',
        uploadedAt: '2023-06-12T09:30:00Z',
      },
    ],
    tags: ['sop', 'it', 'backup', 'disaster-recovery'],
    downloadCount: 54,
    viewCount: 98,
  },

  // Training Materials
  {
    id: 'DOC014',
    title: 'New Employee Orientation Guide',
    description: 'Comprehensive orientation guide for new staff members.',
    category: 'training-material',
    fileUrl: '/documents/training/new-employee-orientation.pptx',
    fileName: 'new-employee-orientation.pptx',
    fileType: 'pptx',
    fileSize: 5678901,
    accessLevel: 'organization',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP001',
    uploadedByName: 'Collen Chingadayi',
    uploadedAt: '2023-09-20T14:30:00Z',
    updatedAt: '2023-09-20T14:30:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER014-1',
        version: 1,
        fileUrl: '/documents/training/new-employee-orientation.pptx',
        fileSize: 5678901,
        uploadedBy: 'EMP001',
        uploadedByName: 'Collen Chingadayi',
        uploadedAt: '2023-09-20T14:30:00Z',
      },
    ],
    tags: ['training', 'orientation', 'onboarding'],
    downloadCount: 78,
    viewCount: 145,
  },
  {
    id: 'DOC015',
    title: 'Customer Service Training Manual',
    description: 'Training manual for customer-facing staff.',
    category: 'training-material',
    fileUrl: '/documents/training/customer-service-manual.pdf',
    fileName: 'customer-service-manual.pdf',
    fileType: 'pdf',
    fileSize: 4321098,
    accessLevel: 'organization',
    department: 'Operations',
    departmentName: 'Operations',
    uploadedBy: 'EMP020',
    uploadedByName: 'Grace Wanjiru',
    uploadedAt: '2023-10-08T11:15:00Z',
    updatedAt: '2023-10-08T11:15:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER015-1',
        version: 1,
        fileUrl: '/documents/training/customer-service-manual.pdf',
        fileSize: 4321098,
        uploadedBy: 'EMP020',
        uploadedByName: 'Grace Wanjiru',
        uploadedAt: '2023-10-08T11:15:00Z',
      },
    ],
    tags: ['training', 'customer-service', 'operations'],
    downloadCount: 102,
    viewCount: 198,
  },

  // Pending Approval Documents
  {
    id: 'DOC016',
    title: 'Updated Procurement Policy',
    description: 'Revised procurement procedures with new vendor evaluation criteria.',
    category: 'policy',
    fileUrl: '/documents/finance/procurement-policy-2024.pdf',
    fileName: 'procurement-policy-2024.pdf',
    fileType: 'pdf',
    fileSize: 3567890,
    accessLevel: 'organization',
    department: 'Finance',
    departmentName: 'Finance',
    uploadedBy: 'EMP011',
    uploadedByName: 'Sarah Mwangi',
    uploadedAt: '2024-03-18T10:00:00Z',
    updatedAt: '2024-03-18T10:00:00Z',
    status: 'pending',
    currentVersion: 1,
    versions: [
      {
        id: 'VER016-1',
        version: 1,
        fileUrl: '/documents/finance/procurement-policy-2024.pdf',
        fileSize: 3567890,
        uploadedBy: 'EMP011',
        uploadedByName: 'Sarah Mwangi',
        uploadedAt: '2024-03-18T10:00:00Z',
      },
    ],
    tags: ['policy', 'finance', 'procurement'],
    downloadCount: 0,
    viewCount: 12,
  },
  {
    id: 'DOC017',
    title: 'IT Incident Response Plan',
    description: 'Detailed plan for responding to IT security incidents.',
    category: 'sop',
    fileUrl: '/documents/it/incident-response-plan.pdf',
    fileName: 'incident-response-plan.pdf',
    fileType: 'pdf',
    fileSize: 2987654,
    accessLevel: 'department',
    department: 'IT',
    departmentName: 'IT',
    uploadedBy: 'EMP031',
    uploadedByName: 'James Kimani',
    uploadedAt: '2024-03-20T15:30:00Z',
    updatedAt: '2024-03-20T15:30:00Z',
    status: 'pending',
    currentVersion: 1,
    versions: [
      {
        id: 'VER017-1',
        version: 1,
        fileUrl: '/documents/it/incident-response-plan.pdf',
        fileSize: 2987654,
        uploadedBy: 'EMP031',
        uploadedByName: 'James Kimani',
        uploadedAt: '2024-03-20T15:30:00Z',
      },
    ],
    tags: ['sop', 'it', 'security', 'incident-response'],
    downloadCount: 0,
    viewCount: 8,
  },
  {
    id: 'DOC018',
    title: 'Work From Home Request Form',
    description: 'Official form for requesting work from home arrangements.',
    category: 'form',
    fileUrl: '/documents/hr/wfh-request-form.docx',
    fileName: 'wfh-request-form.docx',
    fileType: 'docx',
    fileSize: 456789,
    accessLevel: 'organization',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP002',
    uploadedByName: 'Peter Omondi',
    uploadedAt: '2024-03-21T09:15:00Z',
    updatedAt: '2024-03-21T09:15:00Z',
    status: 'pending',
    currentVersion: 1,
    versions: [
      {
        id: 'VER018-1',
        version: 1,
        fileUrl: '/documents/hr/wfh-request-form.docx',
        fileSize: 456789,
        uploadedBy: 'EMP002',
        uploadedByName: 'Peter Omondi',
        uploadedAt: '2024-03-21T09:15:00Z',
      },
    ],
    tags: ['form', 'hr', 'remote-work'],
    downloadCount: 0,
    viewCount: 5,
  },

  // Contracts
  {
    id: 'DOC019',
    title: 'Vendor Service Agreement Template',
    description: 'Standard template for vendor service contracts.',
    category: 'contract',
    fileUrl: '/documents/legal/vendor-service-agreement-template.docx',
    fileName: 'vendor-service-agreement-template.docx',
    fileType: 'docx',
    fileSize: 678901,
    accessLevel: 'department',
    department: 'Finance',
    departmentName: 'Finance',
    uploadedBy: 'EMP010',
    uploadedByName: 'David Kamau',
    uploadedAt: '2023-07-05T13:20:00Z',
    updatedAt: '2023-07-05T13:20:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER019-1',
        version: 1,
        fileUrl: '/documents/legal/vendor-service-agreement-template.docx',
        fileSize: 678901,
        uploadedBy: 'EMP010',
        uploadedByName: 'David Kamau',
        uploadedAt: '2023-07-05T13:20:00Z',
      },
    ],
    tags: ['contract', 'template', 'vendor'],
    downloadCount: 45,
    viewCount: 89,
  },
  {
    id: 'DOC020',
    title: 'Employment Contract Template',
    description: 'Standard employment contract for new hires.',
    category: 'contract',
    fileUrl: '/documents/hr/employment-contract-template.docx',
    fileName: 'employment-contract-template.docx',
    fileType: 'docx',
    fileSize: 789012,
    accessLevel: 'department',
    department: 'Human Resources',
    departmentName: 'Human Resources',
    uploadedBy: 'EMP001',
    uploadedByName: 'Collen Chingadayi',
    uploadedAt: '2023-04-12T10:45:00Z',
    updatedAt: '2023-04-12T10:45:00Z',
    status: 'approved',
    currentVersion: 1,
    versions: [
      {
        id: 'VER020-1',
        version: 1,
        fileUrl: '/documents/hr/employment-contract-template.docx',
        fileSize: 789012,
        uploadedBy: 'EMP001',
        uploadedByName: 'Collen Chingadayi',
        uploadedAt: '2023-04-12T10:45:00Z',
      },
    ],
    tags: ['contract', 'employment', 'hr'],
    downloadCount: 67,
    viewCount: 123,
  },
];

// Helper functions
export const getDocumentById = (id: string): Document | undefined => {
  return mockDocuments.find((doc) => doc.id === id);
};

export const getDocumentsByDepartment = (department: string): Document[] => {
  return mockDocuments.filter((doc) => doc.department === department);
};

export const getDocumentsByCategory = (category: DocumentCategory): Document[] => {
  return mockDocuments.filter((doc) => doc.category === category);
};

export const getDocumentsByStatus = (status: string): Document[] => {
  return mockDocuments.filter((doc) => doc.status === status);
};

export const getDocumentsByAccessLevel = (accessLevel: string): Document[] => {
  return mockDocuments.filter((doc) => doc.accessLevel === accessLevel);
};

export const getPendingDocuments = (): Document[] => {
  return mockDocuments.filter((doc) => doc.status === 'pending');
};

export const getApprovedDocuments = (): Document[] => {
  return mockDocuments.filter((doc) => doc.status === 'approved');
};

export const getUserDocuments = (userId: string): Document[] => {
  return mockDocuments.filter((doc) => doc.uploadedBy === userId);
};

export const searchDocuments = (query: string): Document[] => {
  const lowerQuery = query.toLowerCase();
  return mockDocuments.filter(
    (doc) =>
      doc.title.toLowerCase().includes(lowerQuery) ||
      doc.description?.toLowerCase().includes(lowerQuery) ||
      doc.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};
