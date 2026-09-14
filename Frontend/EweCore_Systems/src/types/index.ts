// Core types for EWE Core system

export type UserRole = 'employee' | 'manager' | 'hr_manager' | 'finance_manager' | 'ceo' | 'admin';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type RequestType = 'leave' | 'expense' | 'petty-cash' | 'procurement' | 'asset' | 'onboarding' | 'offboarding' | 'payable' | 'receivable' | 'document';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  reportsTo?: string;
  avatar?: string;
  phone?: string;
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId: string;
  parentId?: string;
  employeeCount: number;
}

export interface ApprovalStep {
  id: string;
  approverId: string;
  approverName: string;
  status: ApprovalStatus;
  comment?: string;
  timestamp?: string;
  order: number;
}

export interface ApprovalRequest {
  id: string;
  type: RequestType;
  requestorId: string;
  requestorName: string;
  createdAt: string;
  updatedAt: string;
  status: ApprovalStatus;
  currentApproverId?: string;
  approvalChain: ApprovalStep[];
  priority: 'low' | 'medium' | 'high';
  amount?: number;
  data: any;
}

// Leave Management - Re-export from leave-ledger module
export type {
  LeaveTransaction,
  LeaveTransactionType,
  LeaveBalance,
  LeaveTypeName,
  SpecialLeaveTrigger,
  AccrualMethod,
  LeavePayStatus,
  LeavePolicy,
  EligibilityRule,
  EligibilityRuleType,
  ApprovalStage as LeaveApprovalStage,
  ApprovalFlow,
  PublicHoliday,
  LeaveYearType,
  LeaveYearConfig,
  ShutdownPeriod,
  LeaveSystemSettings,
  LeaveAdjustment,
  EmployeeWorkSchedule,
  LeaveDocument,
  LeaveRequestStatus,
  LeaveValidationResult,
} from './leave-ledger';

// Legacy compatibility - keeping old names as aliases
export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'compassionate' | 'unpaid' | 'special' | 'study';

// Enhanced LeaveRequest with full support for ledger-based system
export interface LeaveRequest extends ApprovalRequest {
  data: {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    workingDaysCount?: number; // Calculated working days (excludes weekends/holidays per leave type)
    reason: string;
    specialLeaveTrigger?: string; // For special leave - one of 6 statutory triggers
    attachments?: string[]; // URLs to supporting documents
    handoverNotes?: string;
    isEmergencyLeave?: boolean; // True if notified after-the-fact (sick, bereavement, etc.)
    documentationProvided?: boolean; // Track if required documents are attached
    balanceBeforeRequest?: number; // Available balance when request was submitted
    balanceAfterRequest?: number; // Available balance if approved
  };
}

export interface ExpenseRequest extends ApprovalRequest {
  data: {
    category: string;
    items: ExpenseItem[];
    totalAmount: number;
    purpose: string;
    receipts: string[];
  };
}

export interface ExpenseItem {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  receiptUrl?: string;
}

export interface PettyCashRequest extends ApprovalRequest {
  data: {
    purpose: string;
    amount: number;
    departmentId: string;
    expectedReturnDate: string;
    reconciled: boolean;
    receipts?: string[];
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: 'approval' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface DashboardStats {
  pendingApprovals: number;
  leaveBalance: number;
  upcomingLeaves: number;
  pendingExpenses: number;
  teamSize?: number;
}

export interface CalendarEvent {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType | 'holiday';
  startDate: string;
  endDate: string;
  status: ApprovalStatus;
  color?: string;
}

export type PayableStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'paid' | 'overdue' | 'cancelled';

export interface Payable {
  id: string;
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
  collectionDate: string; // Date when client will come to collect
  department: string;
  description: string;
  status: PayableStatus;
  priority: 'low' | 'medium' | 'high';
  paymentMethod?: string;
  attachments?: string[];
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
}

export interface PayableRequest extends ApprovalRequest {
  data: {
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
  };
}

// Receivables Types (Money coming into SACCO)
export type ReceivableStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'scheduled' | 'partially-paid' | 'paid' | 'overdue' | 'defaulted' | 'written-off' | 'cancelled' | 'disputed';

export type ReceivableCategory =
  | 'ewe-cub'                    // Children's savings program
  | 'loan-0-percent'             // 0% interest emergency loans
  | 'loan-10-percent'            // 10% interest standard loans
  | 'mukando'                    // Traditional savings group
  | 'student-sacco'              // Student education fund
  | 'share-purchase'             // Member share capital
  | 'registration-ewe-cub'       // Registration fee for Ewe Cub
  | 'registration-loan-0'        // Registration fee for 0% loan service
  | 'registration-loan-10'       // Registration fee for 10% loan service
  | 'registration-mukando'       // Registration fee for Mukando
  | 'registration-student'       // Registration fee for Student SACCO
  | 'membership-fee'             // Annual/monthly membership dues
  | 'service-charge'             // Transaction/service fees
  | 'dividend-collection'        // Member dividend payments
  | 'other';                     // Other income

export interface Receivable {
  id: string;
  memberId: string;
  memberName: string;
  memberNumber?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  category: ReceivableCategory;
  categoryDisplay: string;        // User-friendly category name
  referenceNumber: string;        // Invoice/Receipt/Transaction number
  invoiceDate: string;
  amount: number;
  currency: string;
  dueDate: string;
  expectedDate: string;           // Expected payment/collection date
  department: string;
  description: string;
  status: ReceivableStatus;
  priority: 'low' | 'medium' | 'high';
  paymentMethod?: string;
  amountPaid?: number;            // Track partial payments
  amountOutstanding?: number;     // Remaining balance
  installmentNumber?: number;     // For loan repayments (e.g., 3/12)
  totalInstallments?: number;
  loanAccountNumber?: string;     // For loan-related receivables
  shareCertificateNumber?: string; // For share purchases
  attachments?: string[];
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  lastPaymentDate?: string;
  agingDays?: number;             // Days overdue (if applicable)
}

export interface ReceivableRequest extends ApprovalRequest {
  data: {
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
  };
}

export interface ReceivableCustomer {
  id: string;
  memberNumber: string;
  name: string;
  email: string;
  phone: string;
  accountStatus: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  services: ReceivableCategory[];  // Services member is enrolled in
  totalOutstanding: number;         // Total amount owed across all services
  creditScore?: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
}

// Document Management Types
export type DocumentCategory = 'policy' | 'sop' | 'form' | 'contract' | 'report' | 'training-material' | 'other';
export type DocumentAccessLevel = 'department' | 'organization';
export type DocumentFileType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'image' | 'other';

export interface DocumentVersion {
  id: string;
  version: number;
  fileUrl: string;
  fileSize: number;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  changeNotes?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  fileUrl: string;
  fileName: string;
  fileType: DocumentFileType;
  fileSize: number; // in bytes
  accessLevel: DocumentAccessLevel;
  department: string;
  departmentName: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  updatedAt: string;
  status: ApprovalStatus;
  currentVersion: number;
  versions: DocumentVersion[];
  tags?: string[];
  downloadCount: number;
  viewCount: number;
}

export interface DocumentRequest extends ApprovalRequest {
  data: {
    title: string;
    description?: string;
    category: DocumentCategory;
    fileUrl: string;
    fileName: string;
    fileType: DocumentFileType;
    fileSize: number;
    accessLevel: DocumentAccessLevel;
    department: string;
    tags?: string[];
  };
}

// Reports & Analytics Types
export type ReportType =
  | 'attendance'
  | 'leave'
  | 'employee'
  | 'expenses'
  | 'invoices'
  | 'payments'
  | 'payslip'
  | 'daily'
  | 'assets'
  | 'fleet'
  | 'procurement'
  | 'payables'
  | 'budget'
  | 'members'
  | 'custom';

export type ExportFormat = 'excel' | 'pdf' | 'csv';

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'donut';

export interface ChartData {
  [key: string]: string | number;
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  data: ChartData[];
  xAxisKey: string;
  yAxisKey: string | string[];
  colors?: string[];
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  department?: string;
  employee?: string;
  category?: string;
  status?: string;
  customFilters?: { [key: string]: any };
}

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  generatedBy: string;
  generatedByName: string;
  generatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  filters: ReportFilter;
  summary: {
    [key: string]: string | number;
  };
  charts: ChartConfig[];
  tableData: any[];
  status: 'draft' | 'generated' | 'scheduled';
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  icon: string;
  category: 'hr' | 'finance' | 'general';
  defaultFilters?: ReportFilter;
  requiredFilters: string[];
}

// Detailed Report Record Types

export interface AssetReportRecord {
  assetId: string;
  assetName: string;
  category: string;
  make: string;
  model: string;
  quantity: number;
  serialNumber?: string;
  assignedTo: string;
  assignedToId: string;
  assignedDepartment: string;
  assignedPosition: string;
  purchaseDate: string;
  purchaseValue: number; // ZWG
  currentValue: number; // ZWG
  depreciationRate: number;
  accumulatedDepreciation: number; // ZWG
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  status: 'Active' | 'Inactive' | 'Under Maintenance' | 'Disposed';
  location: string;
  warrantyEndDate: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  supplier: string;
}

export interface FleetReportRecord {
  vehicleId: string;
  vehicleName: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  type: string;
  fuelType: string;
  assignedDriver: string;
  assignedDriverId: string;
  driverDepartment: string;
  driverPosition: string;
  currentMileage: number;
  fuelConsumption: number; // L/100km
  fuelCostThisMonth: number; // ZWG
  fuelCostYTD: number; // ZWG
  lastServiceDate: string;
  lastServiceCost: number; // ZWG
  nextServiceDue: string;
  totalMaintenanceCostYTD: number; // ZWG
  insuranceExpiry: string;
  insurancePremium: number; // ZWG
  status: 'Active' | 'Maintenance' | 'Inactive';
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  purchaseDate: string;
  purchaseValue: number; // ZWG
  currentValue: number; // ZWG
  location: string;
}

export interface InvoiceReportRecord {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  issuedDate: string;
  clientId: string;
  clientName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  subtotal: number; // ZWG
  taxAmount: number; // ZWG
  discount: number; // ZWG
  totalAmount: number; // ZWG
  amountPaid: number; // ZWG
  amountOutstanding: number; // ZWG
  status: 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';
  paymentStatus: 'Unpaid' | 'Partially Paid' | 'Paid';
  daysOverdue: number;
  paymentTerms: string;
  paymentMethod?: string;
  paymentDate?: string;
  createdBy: string;
  createdByName: string;
  createdByDepartment: string;
  itemCount: number;
}

export interface ExpenseReportRecord {
  expenseId: string;
  date: string;
  submittedDate: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  category: string;
  subcategory?: string;
  description: string;
  amount: number; // ZWG
  taxAmount: number; // ZWG
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
  paymentType: string;
  approvedBy?: string;
  approverName?: string;
  approvedDate?: string;
  paidDate?: string;
  rejectionReason?: string;
  hasReceipt: boolean;
  budgetCategory?: string;
  budgetAllocated?: number; // ZWG
  budgetSpent?: number; // ZWG
  percentOfBudget?: number;
  daysPending: number;
}

export interface PayrollReportRecord {
  payrollId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  month: string;
  year: number;
  payPeriod: string;
  payDate: string;
  basicSalary: number; // ZWG
  housingAllowance: number; // ZWG
  transportAllowance: number; // ZWG
  mealAllowance: number; // ZWG
  performanceBonus: number; // ZWG
  overtimePay: number; // ZWG
  grossSalary: number; // ZWG
  incomeTax: number; // ZWG
  pensionContribution: number; // ZWG
  nhif: number; // ZWG
  nssf: number; // ZWG
  saccoContribution: number; // ZWG
  loanRepayment: number; // ZWG
  totalDeductions: number; // ZWG
  netSalary: number; // ZWG
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Cheque' | 'Mobile Money';
  bankName: string;
  paymentStatus: 'Pending' | 'Processed' | 'Paid' | 'Failed';
}

export interface EmployeeReportRecord {
  employeeId: string;
  employeeName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: UserRole;
  employmentType: 'Permanent' | 'Contract' | 'Probation' | 'Intern';
  employmentStatus: 'Active' | 'Inactive' | 'On Leave' | 'Terminated';
  joinDate: string;
  tenure: number; // years
  reportsTo?: string;
  reportsToName?: string;
  directReports?: number;
  salary?: number; // ZWG
  payGrade?: string;
  lastAppraisalDate?: string;
  performanceRating?: 'Outstanding' | 'Exceeds' | 'Meets' | 'Needs Improvement';
  workLocation?: 'Office' | 'Remote' | 'Hybrid';
}

export interface AttendanceReportRecord {
  attendanceId: string;
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  checkIn: string | null;
  checkOut: string | null;
  status: 'present' | 'absent' | 'late' | 'permission' | 'on-leave' | 'holiday';
  lateMinutes: number;
  overtimeMinutes: number;
  totalHours: number;
  productionHours: number;
  breakMinutes: number;
  remarks?: string;
}

export interface LeaveReportRecord {
  leaveId: string;
  requestDate: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: ApprovalStatus;
  approverName?: string;
  approvedDate?: string;
  rejectionReason?: string;
  remainingBalance?: number;
}

export interface MemberReportRecord {
  memberId: string;
  memberNumber: string;
  name: string;
  email: string;
  phone: string;
  accountStatus: 'Active' | 'Inactive' | 'Suspended' | 'Closed';
  joinDate: string;
  branch: string;
  sharesOwned: number;
  shareValue: number; // ZWG
  totalShareValue: number; // ZWG
  savingsBalance: number; // ZWG
  activeLoans: number;
  outstandingLoanBalance: number; // ZWG
  monthlyInstallment: number; // ZWG
  loanStatus: 'Current' | 'Arrears' | 'Defaulted' | 'No Loan';
  lastDividend: number; // ZWG
  occupation: string;
  employer: string;
}

export interface BudgetReportRecord {
  budgetId: string;
  department: string;
  category: string;
  subcategory: string;
  month: string;
  year: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  allocatedBudget: number; // ZWG
  revisedBudget: number; // ZWG
  actualSpending: number; // ZWG
  committedSpending: number; // ZWG
  variance: number; // ZWG
  variancePercentage: number;
  status: 'Under Budget' | 'On Track' | 'Over Budget' | 'Critical';
  utilizationPercentage: number;
  forecastedSpending: number; // ZWG
  remainingBudget: number; // ZWG
}
