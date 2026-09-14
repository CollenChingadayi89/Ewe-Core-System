import type {
  Report,
  ReportTemplate,
  ReportType,
  ChartData,
  AssetReportRecord,
  FleetReportRecord,
  InvoiceReportRecord,
  ExpenseReportRecord,
  PayrollReportRecord,
  EmployeeReportRecord,
  AttendanceReportRecord,
  LeaveReportRecord,
  MemberReportRecord,
  BudgetReportRecord,
} from '../types/index';
import { subDays, format, differenceInDays, differenceInYears } from 'date-fns';
import { mockAssets } from './assets';
import { mockVehicles } from './fleet';
import { mockInvoices } from './invoices';
import { mockExpenses } from './expenses';
import { mockPayrollRecords } from './payroll';
import { mockEmployees, getEmployeeById } from './employees';
import { mockAttendanceRecords } from './attendance';
import { mockLeaveRequests } from './leaves';
import { mockMembers } from './members';
import { mockBudgetAllocations } from './budget';

// Report category colors
export const reportCategoryColors = {
  hr: '#3B82F6',
  finance: '#00d084',
  general: '#8B5CF6',
  operations: '#F59E0B',
};

// ============================================================================
// REPORT TEMPLATES
// ============================================================================

export const mockReportTemplates: ReportTemplate[] = [
  // HR Reports
  {
    id: 'TPL001',
    name: 'Employee Headcount Report',
    type: 'employee',
    description: 'Complete employee roster with demographics, positions, tenure, and performance data',
    icon: 'TeamOutlined',
    category: 'hr',
    requiredFilters: [],
  },
  {
    id: 'TPL002',
    name: 'Attendance Report',
    type: 'attendance',
    description: 'Daily attendance tracking with check-in/out times, late arrivals, and overtime hours',
    icon: 'ClockCircleOutlined',
    category: 'hr',
    requiredFilters: ['startDate', 'endDate'],
  },
  {
    id: 'TPL003',
    name: 'Leave Report',
    type: 'leave',
    description: 'Leave requests with approval status, balances, and utilization by type and department',
    icon: 'CalendarOutlined',
    category: 'hr',
    requiredFilters: ['startDate', 'endDate'],
  },
  {
    id: 'TPL004',
    name: 'Payroll Report',
    type: 'payslip',
    description: 'Salary breakdown with earnings, deductions, and net pay by employee and department',
    icon: 'WalletOutlined',
    category: 'hr',
    requiredFilters: ['startDate', 'endDate'],
  },

  // Finance Reports
  {
    id: 'TPL005',
    name: 'Expenses Report',
    type: 'expenses',
    description: 'Detailed expense transactions with budget tracking, categories, and approval status',
    icon: 'DollarOutlined',
    category: 'finance',
    requiredFilters: ['startDate', 'endDate'],
  },
  {
    id: 'TPL006',
    name: 'Invoice Report',
    type: 'invoices',
    description: 'Invoice tracking with client details, payment status, aging analysis, and revenue metrics',
    icon: 'FileTextOutlined',
    category: 'finance',
    requiredFilters: ['startDate', 'endDate'],
  },
  {
    id: 'TPL007',
    name: 'Budget Variance Report',
    type: 'budget',
    description: 'Budget vs actual spending analysis by department and category with variance tracking',
    icon: 'FundProjectionScreenOutlined',
    category: 'finance',
    requiredFilters: [],
  },
  {
    id: 'TPL008',
    name: 'SACCO Members Report',
    type: 'members',
    description: 'Member accounts with shares, savings, loans, and dividend information by branch',
    icon: 'UsergroupAddOutlined',
    category: 'finance',
    requiredFilters: [],
  },

  // Operations Reports
  {
    id: 'TPL009',
    name: 'Asset Register Report',
    type: 'assets',
    description: 'Complete asset inventory with depreciation, maintenance schedules, and assignment details',
    icon: 'AppstoreOutlined',
    category: 'general',
    requiredFilters: [],
  },
  {
    id: 'TPL010',
    name: 'Fleet Utilization Report',
    type: 'fleet',
    description: 'Vehicle tracking with fuel costs, maintenance schedules, mileage, and driver assignments',
    icon: 'CarOutlined',
    category: 'general',
    requiredFilters: [],
  },
];

// ============================================================================
// DATA GENERATOR FUNCTIONS
// ============================================================================

// Generate Asset Report Data
const generateAssetReportData = (): AssetReportRecord[] => {
  return mockAssets.map(asset => ({
    assetId: asset.id,
    assetName: asset.name,
    category: asset.category,
    make: asset.make,
    model: asset.model,
    quantity: asset.quantity,
    serialNumber: asset.serialNumber,
    assignedTo: asset.assignedTo,
    assignedToId: asset.assignedToId,
    assignedDepartment: asset.assignedDepartment,
    assignedPosition: asset.assignedPosition,
    purchaseDate: asset.purchaseDate,
    purchaseValue: asset.value,
    currentValue: asset.currentValue || asset.value,
    depreciationRate: asset.depreciationRate || 0,
    accumulatedDepreciation: asset.value - (asset.currentValue || asset.value),
    condition: asset.condition || 'Good',
    status: asset.status,
    location: asset.location || 'Office',
    warrantyEndDate: asset.warrantyEndDate,
    lastMaintenanceDate: asset.lastMaintenanceDate,
    nextMaintenanceDate: asset.nextMaintenanceDate,
    supplier: asset.supplier || 'N/A',
  }));
};

// Generate Fleet Report Data
const generateFleetReportData = (): FleetReportRecord[] => {
  return mockVehicles.map(vehicle => {
    const employee = vehicle.assignedDriverId ? getEmployeeById(vehicle.assignedDriverId) : null;

    return {
      vehicleId: vehicle.id,
      vehicleName: vehicle.vehicleName,
      make: vehicle.model.split(' ')[0], // Extract make from model
      model: vehicle.model,
      year: vehicle.yearOfManufacture,
      licensePlate: vehicle.licensePlate,
      type: vehicle.type,
      fuelType: vehicle.engineCapacity?.includes('Electric') ? 'Electric' : vehicle.engineCapacity?.includes('Diesel') ? 'Diesel' : 'Petrol',
      assignedDriver: vehicle.assignedDriver,
      assignedDriverId: vehicle.assignedDriverId || 'N/A',
      driverDepartment: employee?.department || 'N/A',
      driverPosition: employee?.position || 'N/A',
      currentMileage: vehicle.currentMileage,
      fuelConsumption: vehicle.fuelConsumption,
      fuelCostThisMonth: vehicle.fuelCostThisMonth,
      fuelCostYTD: vehicle.fuelCostThisMonth * 9, // Approx 9 months
      lastServiceDate: vehicle.lastServiceDate,
      lastServiceCost: 15000 + Math.floor(Math.random() * 20000), // ZWG 15k-35k
      nextServiceDue: vehicle.nextServiceDue,
      totalMaintenanceCostYTD: (15000 + Math.floor(Math.random() * 20000)) * 3, // 3 services
      insuranceExpiry: vehicle.insuranceExpiry,
      insurancePremium: 25000 + Math.floor(Math.random() * 30000), // ZWG 25k-55k
      status: vehicle.status,
      condition: vehicle.condition,
      purchaseDate: vehicle.purchaseDate,
      purchaseValue: 1500000 + Math.floor(Math.random() * 2000000), // ZWG 1.5M-3.5M
      currentValue: Math.floor((1500000 + Math.floor(Math.random() * 2000000)) * 0.6), // 60% of purchase
      location: employee?.department || 'Parking Lot',
    };
  });
};

// Generate Invoice Report Data
const generateInvoiceReportData = (): InvoiceReportRecord[] => {
  return mockInvoices.map(invoice => {
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    const daysOverdue = invoice.status === 'Overdue' ? Math.max(0, differenceInDays(today, dueDate)) : 0;

    const subtotal = invoice.amount / 1.16; // Assuming 16% tax
    const taxAmount = invoice.tax || (invoice.amount - subtotal);
    const discount = invoice.discount || 0;

    // Simulate payment details
    const amountPaid = invoice.status === 'Paid' ? invoice.amount :
                       invoice.status === 'Partially Paid' ? Math.floor(invoice.amount * 0.6) : 0;
    const amountOutstanding = invoice.amount - amountPaid;

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.id,
      invoiceDate: invoice.createdDate,
      dueDate: invoice.dueDate,
      issuedDate: invoice.issuedDate,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      companyName: invoice.companyName,
      contactPerson: invoice.clientName,
      phone: `+263 ${Math.floor(Math.random() * 900 + 700)} ${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      email: `${invoice.clientName.toLowerCase().replace(/\s+/g, '.')}@${invoice.companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      subtotal,
      taxAmount,
      discount,
      totalAmount: invoice.amount,
      amountPaid,
      amountOutstanding,
      status: invoice.status === 'Pending' ? 'Sent' : invoice.status as 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled',
      paymentStatus: invoice.status === 'Paid' ? 'Paid' : invoice.status === 'Partially Paid' ? 'Partially Paid' : 'Unpaid',
      daysOverdue,
      paymentTerms: invoice.paymentTerms || 'Net 30',
      paymentMethod: invoice.status === 'Paid' ? 'Bank Transfer' : undefined,
      paymentDate: invoice.status === 'Paid' ? format(new Date(invoice.dueDate), 'yyyy-MM-dd') : undefined,
      createdBy: 'EMP010', // David Kamau (Finance Manager)
      createdByName: 'David Kamau',
      createdByDepartment: 'Finance',
      itemCount: invoice.items?.length || 1,
    };
  });
};

// Generate Expense Report Data
const generateExpenseReportData = (): ExpenseReportRecord[] => {
  return mockExpenses.map(expense => {
    const submittedDate = new Date(expense.submittedDate);
    const today = new Date();
    const daysPending = expense.status === 'Pending' ? differenceInDays(today, submittedDate) : 0;

    return {
      expenseId: expense.id,
      date: expense.date,
      submittedDate: expense.submittedDate,
      employeeId: expense.employeeId,
      employeeName: expense.employeeName,
      department: expense.department,
      position: getEmployeeById(expense.employeeId)?.position || 'N/A',
      category: expense.category,
      subcategory: undefined,
      description: expense.description,
      amount: expense.amount,
      taxAmount: Math.floor(expense.amount * 0.16), // 16% VAT
      status: expense.status,
      paymentType: expense.paymentType,
      approvedBy: expense.approvedBy,
      approverName: expense.approvedBy || undefined,
      approvedDate: expense.approvedDate,
      paidDate: expense.status === 'Paid' ? expense.approvedDate : undefined,
      rejectionReason: expense.rejectionReason,
      hasReceipt: !!expense.receiptUrl,
      budgetCategory: expense.category,
      budgetAllocated: 50000 + Math.floor(Math.random() * 100000), // ZWG 50k-150k
      budgetSpent: undefined,
      percentOfBudget: undefined,
      daysPending,
    };
  });
};

// Generate Payroll Report Data
const generatePayrollReportData = (): PayrollReportRecord[] => {
  return mockPayrollRecords.map(record => ({
    payrollId: record.id,
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    department: record.department,
    position: record.position,
    month: record.month,
    year: record.year,
    payPeriod: record.payPeriod,
    payDate: record.payDate,
    basicSalary: record.basicSalary,
    housingAllowance: record.housingAllowance,
    transportAllowance: record.transportAllowance,
    mealAllowance: record.mealAllowance,
    performanceBonus: record.performanceBonus,
    overtimePay: record.overtimePay,
    grossSalary: record.grossSalary,
    incomeTax: record.incomeTax,
    pensionContribution: record.pensionContribution,
    nhif: record.nhif,
    nssf: record.nssf,
    saccoContribution: record.saccoContribution,
    loanRepayment: record.loanRepayment,
    totalDeductions: record.totalDeductions,
    netSalary: record.netSalary,
    paymentMethod: record.paymentMethod,
    bankName: record.bankName,
    paymentStatus: record.paymentStatus,
  }));
};

// Generate Employee Report Data
const generateEmployeeReportData = (): EmployeeReportRecord[] => {
  return mockEmployees.map(emp => {
    const joinDate = new Date(emp.joinDate);
    const today = new Date();
    const tenure = differenceInYears(today, joinDate);
    const manager = emp.reportsTo ? getEmployeeById(emp.reportsTo) : undefined;
    const directReports = mockEmployees.filter(e => e.reportsTo === emp.id).length;

    // Map to employment type based on pattern
    const empIndex = parseInt(emp.id.replace('EMP', ''));
    const employmentType = empIndex % 10 === 0 ? 'Intern' :
                          empIndex % 8 === 0 ? 'Probation' :
                          empIndex % 5 === 0 ? 'Contract' : 'Permanent';

    return {
      employeeId: emp.id,
      employeeName: emp.name,
      email: emp.email,
      phone: emp.phone || 'N/A',
      department: emp.department,
      position: emp.position,
      role: emp.role,
      employmentType,
      employmentStatus: emp.status === 'active' ? 'Active' : 'Inactive',
      joinDate: emp.joinDate,
      tenure,
      reportsTo: emp.reportsTo,
      reportsToName: manager?.name,
      directReports,
      salary: undefined, // Privacy - not shown in employee report
      payGrade: emp.role.includes('manager') || emp.role === 'ceo' ? 'Senior' : 'Staff',
      lastAppraisalDate: '2026-06-30',
      performanceRating: Math.random() > 0.7 ? 'Outstanding' : Math.random() > 0.5 ? 'Exceeds' : 'Meets',
      workLocation: emp.department === 'IT' ? 'Hybrid' : 'Office',
    };
  });
};

// Generate Attendance Report Data (need to expand - currently only 1 employee)
const generateAttendanceReportData = (): AttendanceReportRecord[] => {
  // TODO: This needs to be expanded in attendance.ts to cover all employees
  // For now, return existing data
  return mockAttendanceRecords.map((record, index) => ({
    attendanceId: `ATT-${String(index + 1).padStart(4, '0')}`,
    date: record.date,
    employeeId: 'EMP001', // Currently only one employee in mock data
    employeeName: 'Collen Chingadayi',
    department: 'Human Resources',
    position: 'HR Manager',
    checkIn: record.checkIn || null,
    checkOut: record.checkOut || null,
    status: record.status as any,
    lateMinutes: record.lateMinutes,
    overtimeMinutes: record.overtimeMinutes,
    totalHours: record.totalHours,
    productionHours: record.productionHours,
    breakMinutes: record.breakMinutes || 0,
    remarks: record.status === 'late' ? 'Late arrival' : undefined,
  }));
};

// Generate Leave Report Data
const generateLeaveReportData = (): LeaveReportRecord[] => {
  return mockLeaveRequests.map(leave => {
    const employee = getEmployeeById(leave.requestorId);
    const approver = leave.approvalChain.find(step => step.status === 'approved' || step.status === 'rejected');

    return {
      leaveId: leave.id,
      requestDate: leave.createdAt,
      employeeId: leave.requestorId,
      employeeName: employee?.name || leave.requestorName,
      department: employee?.department || 'Unknown',
      position: employee?.position || 'Unknown',
      leaveType: leave.data.leaveType,
      startDate: leave.data.startDate,
      endDate: leave.data.endDate,
      totalDays: leave.data.days,
      reason: leave.data.reason,
      status: leave.status,
      approverName: approver?.approverName,
      approvedDate: approver?.timestamp,
      rejectionReason: approver?.status === 'rejected' ? approver.comment : undefined,
      remainingBalance: undefined, // Would come from balance data
    };
  });
};

// Generate Member Report Data
const generateMemberReportData = (): MemberReportRecord[] => {
  return mockMembers.map(member => ({
    memberId: member.id,
    memberNumber: member.memberNumber,
    name: member.name,
    email: member.email,
    phone: member.phone,
    accountStatus: member.accountStatus,
    joinDate: member.joinDate,
    branch: member.branch,
    sharesOwned: member.sharesOwned,
    shareValue: member.shareValue,
    totalShareValue: member.totalShareValue,
    savingsBalance: member.savingsBalance,
    activeLoans: member.activeLoans,
    outstandingLoanBalance: member.outstandingLoanBalance,
    monthlyInstallment: member.monthlyInstallment,
    loanStatus: member.loanStatus,
    lastDividend: member.lastDividend,
    occupation: member.occupation,
    employer: member.employer,
  }));
};

// Generate Budget Report Data
const generateBudgetReportData = (): BudgetReportRecord[] => {
  return mockBudgetAllocations.map(budget => ({
    budgetId: budget.id,
    department: budget.department,
    category: budget.category,
    subcategory: budget.subcategory,
    month: budget.month,
    year: budget.budgetYear,
    quarter: budget.quarter,
    allocatedBudget: budget.allocatedBudget,
    revisedBudget: budget.revisedBudget,
    actualSpending: budget.actualSpending,
    committedSpending: budget.committedSpending,
    variance: budget.variance,
    variancePercentage: budget.variancePercentage,
    status: budget.status,
    utilizationPercentage: budget.utilizationPercentage,
    forecastedSpending: budget.forecastedSpending,
    remainingBudget: budget.remainingBudget,
  }));
};

// ============================================================================
// MOCK REPORTS WITH DETAILED DATA
// ============================================================================

export const mockReports: Report[] = [
  // Asset Register Report
  {
    id: 'RPT001',
    name: 'Asset Register - September 2026',
    type: 'assets',
    description: 'Complete asset inventory with depreciation and maintenance details',
    generatedBy: 'EMP001',
    generatedByName: 'Collen Chingadayi',
    generatedAt: '2026-09-09T10:00:00Z',
    dateRange: { start: '2026-01-01', end: '2026-09-09' },
    filters: {},
    summary: {
      totalAssets: mockAssets.length,
      totalQuantity: mockAssets.reduce((sum, a) => sum + a.quantity, 0),
      totalValue: mockAssets.reduce((sum, a) => sum + a.value, 0),
      currentValue: mockAssets.reduce((sum, a) => sum + (a.currentValue || a.value), 0),
      activeAssets: mockAssets.filter(a => a.status === 'Active').length,
      underMaintenance: mockAssets.filter(a => a.status === 'Under Maintenance').length,
    },
    charts: [
      {
        type: 'pie',
        title: 'Assets by Category',
        data: [
          { category: 'IT Equipment', count: mockAssets.filter(a => a.category === 'IT Equipment').length },
          { category: 'Office Equipment', count: mockAssets.filter(a => a.category === 'Office Equipment').length },
          { category: 'Furniture', count: mockAssets.filter(a => a.category === 'Furniture').length },
          { category: 'Electronics', count: mockAssets.filter(a => a.category === 'Electronics').length },
          { category: 'HVAC', count: mockAssets.filter(a => a.category === 'HVAC').length },
        ],
        xAxisKey: 'category',
        yAxisKey: 'count',
        colors: ['#3B82F6', '#00d084', '#F59E0B', '#8B5CF6', '#10B981'],
      },
      {
        type: 'bar',
        title: 'Asset Value by Department',
        data: [
          { department: 'IT', value: mockAssets.filter(a => a.assignedDepartment === 'IT').reduce((sum, a) => sum + (a.currentValue || a.value), 0) },
          { department: 'Finance', value: mockAssets.filter(a => a.assignedDepartment === 'Finance').reduce((sum, a) => sum + (a.currentValue || a.value), 0) },
          { department: 'HR', value: mockAssets.filter(a => a.assignedDepartment === 'Human Resources').reduce((sum, a) => sum + (a.currentValue || a.value), 0) },
          { department: 'Operations', value: mockAssets.filter(a => a.assignedDepartment === 'Operations').reduce((sum, a) => sum + (a.currentValue || a.value), 0) },
          { department: 'Executive', value: mockAssets.filter(a => a.assignedDepartment === 'Executive').reduce((sum, a) => sum + (a.currentValue || a.value), 0) },
        ],
        xAxisKey: 'department',
        yAxisKey: 'value',
        colors: ['#00d084'],
      },
    ],
    tableData: generateAssetReportData(),
    status: 'generated',
  },

  // Fleet Utilization Report
  {
    id: 'RPT002',
    name: 'Fleet Utilization - September 2026',
    type: 'fleet',
    description: 'Vehicle usage, fuel costs, and maintenance tracking',
    generatedBy: 'EMP020',
    generatedByName: 'James Mwangi',
    generatedAt: '2026-09-09T11:00:00Z',
    dateRange: { start: '2026-01-01', end: '2026-09-09' },
    filters: {},
    summary: {
      totalVehicles: mockVehicles.length,
      activeVehicles: mockVehicles.filter(v => v.status === 'Active').length,
      totalFuelCostMonth: mockVehicles.reduce((sum, v) => sum + v.fuelCostThisMonth, 0),
      averageMileage: Math.round(mockVehicles.reduce((sum, v) => sum + v.currentMileage, 0) / mockVehicles.length),
    },
    charts: [
      {
        type: 'bar',
        title: 'Fuel Cost by Vehicle',
        data: mockVehicles.slice(0, 8).map(v => ({ vehicle: v.vehicleName, cost: v.fuelCostThisMonth })),
        xAxisKey: 'vehicle',
        yAxisKey: 'cost',
        colors: ['#00d084'],
      },
      {
        type: 'pie',
        title: 'Fleet by Type',
        data: [
          { type: 'Sedan', count: mockVehicles.filter(v => v.type === 'Sedan').length },
          { type: 'SUV', count: mockVehicles.filter(v => v.type === 'SUV').length },
          { type: 'Van', count: mockVehicles.filter(v => v.type === 'Van').length },
          { type: 'Truck', count: mockVehicles.filter(v => v.type === 'Truck').length },
        ],
        xAxisKey: 'type',
        yAxisKey: 'count',
        colors: ['#3B82F6', '#00d084', '#F59E0B', '#8B5CF6'],
      },
    ],
    tableData: generateFleetReportData(),
    status: 'generated',
  },

  // Invoice Report
  {
    id: 'RPT003',
    name: 'Invoice Report - Q3 2026',
    type: 'invoices',
    description: 'Invoice tracking with payment status and aging analysis',
    generatedBy: 'EMP010',
    generatedByName: 'David Kamau',
    generatedAt: '2026-09-09T12:00:00Z',
    dateRange: { start: '2026-07-01', end: '2026-09-30' },
    filters: { startDate: '2026-07-01', endDate: '2026-09-30' },
    summary: {
      totalInvoices: mockInvoices.length,
      totalRevenue: mockInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      paidAmount: mockInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0),
      outstandingAmount: mockInvoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.amount, 0),
    },
    charts: [
      {
        type: 'pie',
        title: 'Invoice Status Distribution',
        data: [
          { status: 'Paid', count: mockInvoices.filter(inv => inv.status === 'Paid').length },
          { status: 'Sent', count: mockInvoices.filter(inv => inv.status === 'Sent').length },
          { status: 'Overdue', count: mockInvoices.filter(inv => inv.status === 'Overdue').length },
          { status: 'Partially Paid', count: mockInvoices.filter(inv => inv.status === 'Partially Paid').length },
        ],
        xAxisKey: 'status',
        yAxisKey: 'count',
        colors: ['#10B981', '#3B82F6', '#EF4444', '#F59E0B'],
      },
    ],
    tableData: generateInvoiceReportData(),
    status: 'generated',
  },

  // Expense Report
  {
    id: 'RPT004',
    name: 'Expense Report - September 2026',
    type: 'expenses',
    description: 'Detailed expense tracking with budget analysis',
    generatedBy: 'EMP010',
    generatedByName: 'David Kamau',
    generatedAt: '2026-09-09T13:00:00Z',
    dateRange: { start: '2026-09-01', end: '2026-09-30' },
    filters: { startDate: '2026-09-01', endDate: '2026-09-30' },
    summary: {
      totalExpenses: mockExpenses.length,
      totalAmount: mockExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      approvedAmount: mockExpenses.filter(exp => exp.status === 'Approved').reduce((sum, exp) => sum + exp.amount, 0),
      pendingAmount: mockExpenses.filter(exp => exp.status === 'Pending').reduce((sum, exp) => sum + exp.amount, 0),
    },
    charts: [
      {
        type: 'bar',
        title: 'Expenses by Category',
        data: [
          { category: 'Meals & Entertainment', amount: mockExpenses.filter(e => e.category === 'Meals & Entertainment').reduce((sum, e) => sum + e.amount, 0) },
          { category: 'Transportation', amount: mockExpenses.filter(e => e.category === 'Transportation').reduce((sum, e) => sum + e.amount, 0) },
          { category: 'Office Supplies', amount: mockExpenses.filter(e => e.category === 'Office Supplies').reduce((sum, e) => sum + e.amount, 0) },
          { category: 'Software & Tools', amount: mockExpenses.filter(e => e.category === 'Software & Tools').reduce((sum, e) => sum + e.amount, 0) },
        ],
        xAxisKey: 'category',
        yAxisKey: 'amount',
        colors: ['#00d084'],
      },
    ],
    tableData: generateExpenseReportData(),
    status: 'generated',
  },

  // Payroll Report
  {
    id: 'RPT005',
    name: 'Payroll Report - September 2026',
    type: 'payslip',
    description: 'Salary breakdown for all employees',
    generatedBy: 'EMP001',
    generatedByName: 'Collen Chingadayi',
    generatedAt: '2026-09-09T14:00:00Z',
    dateRange: { start: '2026-09-01', end: '2026-09-30' },
    filters: { startDate: '2026-09-01', endDate: '2026-09-30' },
    summary: {
      totalEmployees: mockPayrollRecords.filter(p => p.month === 'September 2026').length,
      totalGrossSalary: mockPayrollRecords.filter(p => p.month === 'September 2026').reduce((sum, p) => sum + p.grossSalary, 0),
      totalDeductions: mockPayrollRecords.filter(p => p.month === 'September 2026').reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNetSalary: mockPayrollRecords.filter(p => p.month === 'September 2026').reduce((sum, p) => sum + p.netSalary, 0),
    },
    charts: [
      {
        type: 'bar',
        title: 'Payroll by Department',
        data: [
          { department: 'Executive', amount: mockPayrollRecords.filter(p => p.department === 'Executive' && p.month === 'September 2026').reduce((sum, p) => sum + p.netSalary, 0) },
          { department: 'Finance', amount: mockPayrollRecords.filter(p => p.department === 'Finance' && p.month === 'September 2026').reduce((sum, p) => sum + p.netSalary, 0) },
          { department: 'HR', amount: mockPayrollRecords.filter(p => p.department === 'Human Resources' && p.month === 'September 2026').reduce((sum, p) => sum + p.netSalary, 0) },
          { department: 'IT', amount: mockPayrollRecords.filter(p => p.department === 'IT' && p.month === 'September 2026').reduce((sum, p) => sum + p.netSalary, 0) },
        ],
        xAxisKey: 'department',
        yAxisKey: 'amount',
        colors: ['#00d084'],
      },
    ],
    tableData: mockPayrollRecords.filter(p => p.month === 'September 2026'),
    status: 'generated',
  },

  // Employee Report
  {
    id: 'RPT006',
    name: 'Employee Headcount Report - September 2026',
    type: 'employee',
    description: 'Complete employee roster with demographics',
    generatedBy: 'EMP001',
    generatedByName: 'Collen Chingadayi',
    generatedAt: '2026-09-09T15:00:00Z',
    dateRange: { start: '2026-09-01', end: '2026-09-09' },
    filters: {},
    summary: {
      totalEmployees: mockEmployees.length,
      activeEmployees: mockEmployees.filter(e => e.status === 'active').length,
      departments: new Set(mockEmployees.map(e => e.department)).size,
      averageTenure: Math.round(mockEmployees.reduce((sum, e) => sum + differenceInYears(new Date(), new Date(e.joinDate)), 0) / mockEmployees.length),
    },
    charts: [
      {
        type: 'pie',
        title: 'Employees by Department',
        data: [
          { department: 'Executive', count: mockEmployees.filter(e => e.department === 'Executive').length },
          { department: 'HR', count: mockEmployees.filter(e => e.department === 'Human Resources').length },
          { department: 'Finance', count: mockEmployees.filter(e => e.department === 'Finance').length },
          { department: 'Operations', count: mockEmployees.filter(e => e.department === 'Operations').length },
          { department: 'IT', count: mockEmployees.filter(e => e.department === 'IT').length },
          { department: 'Compliance', count: mockEmployees.filter(e => e.department === 'Compliance & Risk').length },
        ],
        xAxisKey: 'department',
        yAxisKey: 'count',
        colors: ['#3B82F6', '#00d084', '#F59E0B', '#8B5CF6', '#10B981', '#6B7280'],
      },
    ],
    tableData: generateEmployeeReportData(),
    status: 'generated',
  },

  // SACCO Members Report
  {
    id: 'RPT007',
    name: 'SACCO Members Report - September 2026',
    type: 'members',
    description: 'Member accounts with shares, savings, and loans',
    generatedBy: 'EMP010',
    generatedByName: 'David Kamau',
    generatedAt: '2026-09-09T16:00:00Z',
    dateRange: { start: '2026-01-01', end: '2026-09-09' },
    filters: {},
    summary: {
      totalMembers: mockMembers.length,
      activeMembers: mockMembers.filter(m => m.accountStatus === 'Active').length,
      totalShares: mockMembers.reduce((sum, m) => sum + m.sharesOwned, 0),
      totalSavings: mockMembers.reduce((sum, m) => sum + m.savingsBalance, 0),
      totalLoans: mockMembers.reduce((sum, m) => sum + m.outstandingLoanBalance, 0),
    },
    charts: [
      {
        type: 'bar',
        title: 'Members by Branch',
        data: [
          { branch: 'Nairobi Central', count: mockMembers.filter(m => m.branch === 'Nairobi Central').length },
          { branch: 'Westlands', count: mockMembers.filter(m => m.branch === 'Westlands').length },
          { branch: 'Mombasa', count: mockMembers.filter(m => m.branch === 'Mombasa').length },
          { branch: 'Kisumu', count: mockMembers.filter(m => m.branch === 'Kisumu').length },
          { branch: 'Nakuru', count: mockMembers.filter(m => m.branch === 'Nakuru').length },
        ],
        xAxisKey: 'branch',
        yAxisKey: 'count',
        colors: ['#00d084'],
      },
    ],
    tableData: generateMemberReportData(),
    status: 'generated',
  },

  // Budget Report
  {
    id: 'RPT008',
    name: 'Budget Variance Report - September 2026',
    type: 'budget',
    description: 'Budget vs actual spending by department',
    generatedBy: 'EMP010',
    generatedByName: 'David Kamau',
    generatedAt: '2026-09-09T17:00:00Z',
    dateRange: { start: '2026-09-01', end: '2026-09-30' },
    filters: {},
    summary: {
      totalBudget: mockBudgetAllocations.filter(b => b.month === 'September 2026').reduce((sum, b) => sum + b.allocatedBudget, 0),
      totalSpent: mockBudgetAllocations.filter(b => b.month === 'September 2026').reduce((sum, b) => sum + b.actualSpending, 0),
      totalVariance: mockBudgetAllocations.filter(b => b.month === 'September 2026').reduce((sum, b) => sum + b.variance, 0),
      overBudgetCount: mockBudgetAllocations.filter(b => b.month === 'September 2026' && (b.status === 'Over Budget' || b.status === 'Critical')).length,
    },
    charts: [
      {
        type: 'bar',
        title: 'Budget vs Actual by Department',
        data: [
          {
            department: 'Finance',
            budget: mockBudgetAllocations.filter(b => b.department === 'Finance' && b.month === 'September 2026').reduce((sum, b) => sum + b.allocatedBudget, 0),
            actual: mockBudgetAllocations.filter(b => b.department === 'Finance' && b.month === 'September 2026').reduce((sum, b) => sum + b.actualSpending, 0),
          },
          {
            department: 'HR',
            budget: mockBudgetAllocations.filter(b => b.department === 'Human Resources' && b.month === 'September 2026').reduce((sum, b) => sum + b.allocatedBudget, 0),
            actual: mockBudgetAllocations.filter(b => b.department === 'Human Resources' && b.month === 'September 2026').reduce((sum, b) => sum + b.actualSpending, 0),
          },
          {
            department: 'IT',
            budget: mockBudgetAllocations.filter(b => b.department === 'IT' && b.month === 'September 2026').reduce((sum, b) => sum + b.allocatedBudget, 0),
            actual: mockBudgetAllocations.filter(b => b.department === 'IT' && b.month === 'September 2026').reduce((sum, b) => sum + b.actualSpending, 0),
          },
        ],
        xAxisKey: 'department',
        yAxisKey: ['budget', 'actual'],
        colors: ['#3B82F6', '#00d084'],
      },
    ],
    tableData: mockBudgetAllocations.filter(b => b.month === 'September 2026'),
    status: 'generated',
  },
];

// Helper to get report by ID
export const getReportById = (id: string): Report | undefined => {
  return mockReports.find(r => r.id === id);
};

// Helper to get reports by type
export const getReportsByType = (type: ReportType): Report[] => {
  return mockReports.filter(r => r.type === type);
};

// Helper to get template by type
export const getReportTemplateByType = (type: ReportType): ReportTemplate | undefined => {
  return mockReportTemplates.find(t => t.type === type);
};
