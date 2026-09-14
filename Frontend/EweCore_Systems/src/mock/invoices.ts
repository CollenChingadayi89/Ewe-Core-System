export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  clientRole: string;
  companyName: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Sent' | 'Partially Paid';
  createdDate: string;
  dueDate: string;
  issuedDate: string;
  items: InvoiceItem[];
  notes?: string;
  paymentTerms?: string;
  tax?: number;
  discount?: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const mockInvoices: Invoice[] = [
  {
    id: 'Inv-001',
    clientId: 'CLT001',
    clientName: 'Michael Walker',
    clientRole: 'CEO',
    companyName: 'BrightWave Innovations',
    amount: 3000,
    status: 'Paid',
    createdDate: '2024-01-14',
    dueDate: '2024-01-15',
    issuedDate: '2024-01-14',
    items: [
      {
        description: 'Financial Advisory Services',
        quantity: 1,
        unitPrice: 3000,
        total: 3000,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-002',
    clientId: 'CLT002',
    clientName: 'Sophie Headrick',
    clientRole: 'Manager',
    companyName: 'Stellar Dynamics',
    amount: 2500,
    status: 'Sent',
    createdDate: '2024-01-21',
    dueDate: '2024-01-25',
    issuedDate: '2024-01-21',
    items: [
      {
        description: 'Loan Processing Services',
        quantity: 1,
        unitPrice: 2500,
        total: 2500,
      },
    ],
    paymentTerms: 'Net 15',
  },
  {
    id: 'Inv-003',
    clientId: 'CLT003',
    clientName: 'Cameron Drake',
    clientRole: 'Director',
    companyName: 'Quantum Nexus',
    amount: 2800,
    status: 'Partially Paid',
    createdDate: '2024-02-20',
    dueDate: '2024-02-22',
    issuedDate: '2024-02-20',
    items: [
      {
        description: 'SACCO Membership Services',
        quantity: 1,
        unitPrice: 2800,
        total: 2800,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-004',
    clientId: 'CLT004',
    clientName: 'Doris Crowley',
    clientRole: 'Consultant',
    companyName: 'EcoVision Enterprises',
    amount: 3300,
    status: 'Sent',
    createdDate: '2024-03-15',
    dueDate: '2024-03-17',
    issuedDate: '2024-03-15',
    items: [
      {
        description: 'Business Consultation',
        quantity: 1,
        unitPrice: 3300,
        total: 3300,
      },
    ],
    paymentTerms: 'Net 15',
  },
  {
    id: 'Inv-005',
    clientId: 'CLT005',
    clientName: 'Thomas Bordelon',
    clientRole: 'Manager',
    companyName: 'Aurora Technologies',
    amount: 3600,
    status: 'Paid',
    createdDate: '2024-04-12',
    dueDate: '2024-04-16',
    issuedDate: '2024-04-12',
    items: [
      {
        description: 'Investment Advisory',
        quantity: 1,
        unitPrice: 3600,
        total: 3600,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-006',
    clientId: 'CLT006',
    clientName: 'Kathleen Gutierrez',
    clientRole: 'Director',
    companyName: 'BlueSky Ventures',
    amount: 2000,
    status: 'Partially Paid',
    createdDate: '2024-05-20',
    dueDate: '2024-05-21',
    issuedDate: '2024-05-20',
    items: [
      {
        description: 'Financial Planning Services',
        quantity: 1,
        unitPrice: 2000,
        total: 2000,
      },
    ],
    paymentTerms: 'Net 15',
  },
  {
    id: 'Inv-007',
    clientId: 'CLT007',
    clientName: 'Bruce Wright',
    clientRole: 'CEO',
    companyName: 'TerraFusion Energy',
    amount: 3400,
    status: 'Sent',
    createdDate: '2024-07-06',
    dueDate: '2024-07-06',
    issuedDate: '2024-07-06',
    items: [
      {
        description: 'Corporate Banking Services',
        quantity: 1,
        unitPrice: 3400,
        total: 3400,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-008',
    clientId: 'CLT008',
    clientName: 'Estelle Morgan',
    clientRole: 'Manager',
    companyName: 'UrbanPulse Design',
    amount: 4000,
    status: 'Paid',
    createdDate: '2024-09-02',
    dueDate: '2024-09-04',
    issuedDate: '2024-09-02',
    items: [
      {
        description: 'Business Loan Services',
        quantity: 1,
        unitPrice: 4000,
        total: 4000,
      },
    ],
    paymentTerms: 'Net 15',
  },
  {
    id: 'Inv-009',
    clientId: 'CLT009',
    clientName: 'Stephen Dias',
    clientRole: 'CEO',
    companyName: 'Nimbus Networks',
    amount: 4500,
    status: 'Partially Paid',
    createdDate: '2024-11-15',
    dueDate: '2024-11-15',
    issuedDate: '2024-11-15',
    items: [
      {
        description: 'Financial Management Services',
        quantity: 1,
        unitPrice: 4500,
        total: 4500,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-010',
    clientId: 'CLT010',
    clientName: 'Angela Thomas',
    clientRole: 'Consultant',
    companyName: 'Epicurean Delights',
    amount: 3800,
    status: 'Paid',
    createdDate: '2024-12-10',
    dueDate: '2024-12-11',
    issuedDate: '2024-12-10',
    items: [
      {
        description: 'Treasury Services',
        quantity: 1,
        unitPrice: 3800,
        total: 3800,
      },
    ],
    paymentTerms: 'Net 15',
  },
  {
    id: 'Inv-011',
    clientId: 'CLT011',
    clientName: 'Sarah Mitchell',
    clientRole: 'Director',
    companyName: 'Global Tech Solutions',
    amount: 5200,
    status: 'Pending',
    createdDate: '2026-08-15',
    dueDate: '2026-09-15',
    issuedDate: '2026-08-15',
    items: [
      {
        description: 'IT Infrastructure Consultation',
        quantity: 1,
        unitPrice: 5200,
        total: 5200,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-012',
    clientId: 'CLT012',
    clientName: 'David Ochieng',
    clientRole: 'Manager',
    companyName: 'Savannah Logistics',
    amount: 2750,
    status: 'Overdue',
    createdDate: '2026-07-10',
    dueDate: '2026-08-10',
    issuedDate: '2026-07-10',
    items: [
      {
        description: 'Supply Chain Optimization',
        quantity: 1,
        unitPrice: 2750,
        total: 2750,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-013',
    clientId: 'CLT013',
    clientName: 'Collen Wambui',
    clientRole: 'CEO',
    companyName: 'Heritage Agribusiness',
    amount: 6800,
    status: 'Draft',
    createdDate: '2026-09-01',
    dueDate: '2026-10-01',
    issuedDate: '2026-09-01',
    items: [
      {
        description: 'Agricultural Finance Advisory',
        quantity: 1,
        unitPrice: 6800,
        total: 6800,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-014',
    clientId: 'CLT014',
    clientName: 'Peter Kimani',
    clientRole: 'CFO',
    companyName: 'Nairobi Real Estate',
    amount: 8500,
    status: 'Paid',
    createdDate: '2026-08-20',
    dueDate: '2026-09-20',
    issuedDate: '2026-08-20',
    items: [
      {
        description: 'Real Estate Investment Services',
        quantity: 1,
        unitPrice: 8500,
        total: 8500,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-015',
    clientId: 'CLT015',
    clientName: 'Mary Akinyi',
    clientRole: 'Director',
    companyName: 'Coastal Trading Co',
    amount: 4200,
    status: 'Sent',
    createdDate: '2026-09-03',
    dueDate: '2026-10-03',
    issuedDate: '2026-09-03',
    items: [
      {
        description: 'Trade Finance Services',
        quantity: 1,
        unitPrice: 4200,
        total: 4200,
      },
    ],
    paymentTerms: 'Net 30',
  },
  {
    id: 'Inv-016',
    clientId: 'CLT016',
    clientName: 'James Mwangi',
    clientRole: 'Manager',
    companyName: 'Summit Insurance',
    amount: 3900,
    status: 'Partially Paid',
    createdDate: '2026-08-25',
    dueDate: '2026-09-25',
    issuedDate: '2026-08-25',
    items: [
      {
        description: 'Risk Management Consultation',
        quantity: 1,
        unitPrice: 3900,
        total: 3900,
      },
    ],
    paymentTerms: 'Net 30',
  },
];

export const invoiceStats = {
  total: mockInvoices.length,
  paid: mockInvoices.filter((inv) => inv.status === 'Paid').length,
  pending: mockInvoices.filter((inv) => inv.status === 'Pending').length,
  overdue: mockInvoices.filter((inv) => inv.status === 'Overdue').length,
  draft: mockInvoices.filter((inv) => inv.status === 'Draft').length,
  sent: mockInvoices.filter((inv) => inv.status === 'Sent').length,
  partiallyPaid: mockInvoices.filter((inv) => inv.status === 'Partially Paid').length,
  totalAmount: mockInvoices.reduce((sum, inv) => sum + inv.amount, 0),
  paidAmount: mockInvoices
    .filter((inv) => inv.status === 'Paid')
    .reduce((sum, inv) => sum + inv.amount, 0),
  pendingAmount: mockInvoices
    .filter((inv) => inv.status === 'Pending' || inv.status === 'Sent')
    .reduce((sum, inv) => sum + inv.amount, 0),
  overdueAmount: mockInvoices
    .filter((inv) => inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.amount, 0),
};
