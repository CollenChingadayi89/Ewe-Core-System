// Mock data for SACCO Admin Dashboard

export const mockDashboardStats = {
  attendanceOverview: {
    total: 120,
    present: 112,
  },
  pendingApprovals: {
    value: 15,
    change: 20.1,
    trend: 'up',
  },
  activeEmployees: {
    value: 154,
    change: 1.2,
    trend: 'up',
  },
  leaveRequestsThisMonth: {
    value: 28,
    change: 11.2,
    trend: 'down',
  },
  pettyCashDisbursed: {
    value: 145000,
    change: 18.2,
    trend: 'up',
  },
  expensesThisMonth: {
    value: 385000,
    change: 2.1,
    trend: 'up',
  },
  newEmployeesThisMonth: {
    value: 3,
    change: 2.1,
    trend: 'up',
  },
  pendingOnboarding: {
    value: 2,
    change: 0,
    trend: 'up',
  },
};

export const mockEmployeesByDepartment = [
  { department: 'Executive', count: 45, total: 154, color: '#00d084' },
  { department: 'Operations', count: 25, total: 154, color: '#00d084' },
  { department: 'Finance', count: 12, total: 154, color: '#00d084' },
  { department: 'IT', count: 10, total: 154, color: '#00d084' },
];

export const mockEmployeeStatus = {
  totalEmployees: 154,
  statuses: [
    { type: 'Permanent', count: 125, percentage: 81, color: '#ff6900' },
    { type: 'Contract', count: 18, percentage: 12, color: '#00d084' },
    { type: 'Probation', count: 8, percentage: 5, color: '#cf2e2e' },
    { type: 'Intern', count: 3, percentage: 2, color: '#9b51e0' },
  ],
};

export const mockAttendanceData = {
  total: 120,
  present: 112,
  permission: 3,
  late: 4,
  absent: 1,
  chartData: [
    { name: 'Present', value: 112, percentage: 93, color: '#00d084' },
    { name: 'Permission', value: 3, percentage: 3, color: '#0693e3' },
    { name: 'Late', value: 4, percentage: 3, color: '#ff6900' },
    { name: 'Absent', value: 1, percentage: 1, color: '#cf2e2e' },
  ],
};

export const mockClockInOut = [
  {
    id: 'EMP001',
    name: 'Collen Chingadayi',
    role: 'HR Manager',
    avatar: 'GW',
    clockIn: '08:15 AM',
    clockOut: '05:30 PM',
    production: '09:15 hrs',
    status: 'in',
  },
  {
    id: 'EMP010',
    name: 'David Kamoto',
    role: 'Finance Manager',
    avatar: 'DK',
    clockIn: '08:00 AM',
    clockOut: '05:45 PM',
    production: '09:45 hrs',
    status: 'in',
  },
  {
    id: 'EMP020',
    name: 'Sarah Chingwa',
    role: 'Operations Manager',
    avatar: 'SM',
    clockIn: '07:45 AM',
    clockOut: '05:30 PM',
    production: '09:45 hrs',
    status: 'in',
  },
  {
    id: 'EMP002',
    name: 'Peter Chando',
    role: 'HR Officer',
    avatar: 'PO',
    clockIn: '08:30 AM',
    clockOut: '12:00 PM',
    production: '03:30 hrs',
    status: 'out',
  },
];

export const mockTopPerformer = {
  name: 'David Gwara',
  role: 'Finance Manager',
  avatar: 'DK',
  performance: 98,
};

export const mockRecentApprovals = [
  {
    id: 'AR001',
    employeeName: 'Peter Shura',
    requestType: 'Leave',
    details: 'Annual Leave - 5 days',
    submittedDate: '05 Sept 2026',
    status: 'pending',
    avatar: 'PO',
  },
  {
    id: 'AR002',
    employeeName: 'Sarah Sango',
    requestType: 'Expense',
    details: 'Travel Reimbursement',
    submittedDate: '04 Sept 2026',
    status: 'approved',
    avatar: 'SM',
  },
  {
    id: 'AR003',
    employeeName: 'John Sithole',
    requestType: 'Petty Cash',
    details: 'Office Supplies - ZWG 15,000',
    submittedDate: '03 Sept 2026',
    status: 'pending',
    avatar: 'JM',
  },
  {
    id: 'AR004',
    employeeName: 'Collen Shumba',
    requestType: 'Procurement',
    details: 'New Computers - 5 Units',
    submittedDate: '02 Sept 2026',
    status: 'approved',
    avatar: 'CC',
  },
];

export const mockEmployeesList = [
  { id: 'EMP000', name: 'Margaret Jaji', department: 'Executive', avatar: 'MN' },
  { id: 'EMP001', name: 'Collen Chingadayi', department: 'Human Resources', avatar: 'CC' },
  { id: 'EMP010', name: 'David Gava', department: 'Finance', avatar: 'DK' },
  { id: 'EMP020', name: 'Sarah Mwazha', department: 'Operations', avatar: 'SM' },
  { id: 'EMP030', name: 'Michael Munoto', department: 'IT', avatar: 'MO' },
];

export const mockTodoList = [
  { id: '1', title: 'Review pending leave requests', completed: false },
  { id: '2', title: 'Approve petty cash disbursements', completed: false },
  { id: '3', title: 'Update employee handbook', completed: false },
  { id: '4', title: 'Monthly payroll processing', completed: false },
  { id: '5', title: 'Schedule performance reviews', completed: false },
  { id: '6', title: 'Process new hire documentation', completed: false },
];

export const mockExpensesData = [
  { month: 'Jan', travel: 45000, supplies: 25000, utilities: 35000, salaries: 850000 },
  { month: 'Feb', travel: 38000, supplies: 30000, utilities: 32000, salaries: 850000 },
  { month: 'Mar', travel: 52000, supplies: 28000, utilities: 34000, salaries: 850000 },
  { month: 'Apr', travel: 48000, supplies: 32000, utilities: 36000, salaries: 850000 },
  { month: 'May', travel: 55000, supplies: 35000, utilities: 33000, salaries: 850000 },
  { month: 'Jun', travel: 60000, supplies: 40000, utilities: 38000, salaries: 850000 },
  { month: 'Jul', travel: 58000, supplies: 38000, utilities: 35000, salaries: 850000 },
  { month: 'Aug', travel: 62000, supplies: 42000, utilities: 40000, salaries: 850000 },
  { month: 'Sep', travel: 57000, supplies: 39000, utilities: 37000, salaries: 850000 },
  { month: 'Oct', travel: 65000, supplies: 45000, utilities: 42000, salaries: 850000 },
  { month: 'Nov', travel: 54000, supplies: 36000, utilities: 34000, salaries: 850000 },
  { month: 'Dec', travel: 68000, supplies: 48000, utilities: 45000, salaries: 850000 },
];

export const mockPettyCashRequests = [
  {
    id: 'PC001',
    purpose: 'Office Supplies',
    requestedBy: 'Peter Moyo',
    department: 'HR',
    amount: 15000,
    requestDate: '05/09/2026',
    status: 'Pending',
    avatar: 'PO',
  },
  {
    id: 'PC002',
    purpose: 'Tea & Coffee',
    requestedBy: 'Sarah Mabaya',
    department: 'Operations',
    amount: 8000,
    requestDate: '04/09/2026',
    status: 'Approved',
    avatar: 'SM',
  },
  {
    id: 'PC003',
    purpose: 'Transport Advance',
    requestedBy: 'John Gata',
    department: 'Finance',
    amount: 12000,
    requestDate: '03/09/2026',
    status: 'Disbursed',
    avatar: 'JM',
  },
  {
    id: 'PC004',
    purpose: 'Stationery',
    requestedBy: 'Michael Meno',
    department: 'IT',
    amount: 6500,
    requestDate: '02/09/2026',
    status: 'Reconciled',
    avatar: 'MO',
  },
  {
    id: 'PC005',
    purpose: 'Printing Services',
    requestedBy: 'Collen Dombo',
    department: 'HR',
    amount: 18000,
    requestDate: '01/09/2026',
    status: 'Approved',
    avatar: 'CC',
  },
];

export const mockLeaveRequests = [
  {
    id: 'LR001',
    employee: 'Peter Mvura',
    department: 'Human Resources',
    leaveType: 'Annual',
    startDate: '15/09/2026',
    endDate: '19/09/2026',
    days: 5,
    status: 'Pending',
    approver: 'Collen Chingadayi',
  },
  {
    id: 'LR002',
    employee: 'John Sango',
    department: 'Finance',
    leaveType: 'Sick',
    startDate: '10/09/2026',
    endDate: '11/09/2026',
    days: 2,
    status: 'Approved',
    approver: 'David Kamau',
  },
  {
    id: 'LR003',
    employee: 'Sarah Kamba',
    department: 'Operations',
    leaveType: 'Annual',
    startDate: '20/09/2026',
    endDate: '27/09/2026',
    days: 6,
    status: 'Approved',
    approver: 'Sarah Mwangi',
  },
  {
    id: 'LR004',
    employee: 'Michael Nzou',
    department: 'IT',
    leaveType: 'Casual',
    startDate: '08/09/2026',
    endDate: '08/09/2026',
    days: 1,
    status: 'Rejected',
    approver: 'Margaret Njeri',
  },
  {
    id: 'LR005',
    employee: 'Jane Mvuu',
    department: 'Executive',
    leaveType: 'Maternity',
    startDate: '01/10/2026',
    endDate: '31/12/2026',
    days: 90,
    status: 'Pending',
    approver: 'Collen Chingadayi',
  },
];

export const mockApprovalStatistics = {
  completed: 124,
  total: 185,
  breakdown: [
    { type: 'Pending', count: 45, percentage: 24, color: '#ff6900' },
    { type: 'Approved', count: 95, percentage: 51, color: '#00d084' },
    { type: 'Rejected', count: 19, percentage: 10, color: '#cf2e2e' },
    { type: 'Cancelled', count: 26, percentage: 14, color: '#32373c' },
  ],
  totalThisWeek: 61,
  processedText: 'Approvals Processed This Week',
};

export const mockUpcomingLeave = [
  {
    id: '1',
    employeeName: 'Sarah Chipembere',
    department: 'Operations',
    leaveType: 'Annual',
    startDate: 'Mon, 15 Sept 2026',
    endDate: 'Fri, 19 Sept 2026',
    days: 5,
    avatar: 'SK',
  },
  {
    id: '2',
    employeeName: 'Jane Mhembwe',
    department: 'Executive',
    leaveType: 'Maternity',
    startDate: 'Tue, 01 Oct 2026',
    endDate: 'Wed, 31 Dec 2026',
    days: 90,
    avatar: 'JW',
  },
];

export const mockRecentActivities = [
  {
    id: '1',
    name: 'Collen Njuzu',
    action: 'Approved Leave Request',
    target: 'Sarah Kimani - Annual Leave',
    time: '2 hours ago',
    avatar: 'CC',
  },
  {
    id: '2',
    name: 'David Geza',
    action: 'Approved Petty Cash',
    target: 'ZWG 15,000 for Office Supplies',
    time: '3 hours ago',
    avatar: 'DK',
  },
  {
    id: '3',
    name: 'Peter Mhanya',
    action: 'Submitted Leave Request',
    target: 'Annual Leave - 5 days',
    time: '4 hours ago',
    avatar: 'PO',
  },
  {
    id: '4',
    name: 'Margaret Moto',
    action: 'Rejected Leave Request',
    target: 'Insufficient Leave Balance',
    time: '5 hours ago',
    avatar: 'MN',
  },
  {
    id: '5',
    name: 'Sarah Mwangi',
    action: 'Approved Expense Claim',
    target: 'Travel Reimbursement - ZWG 25,000',
    time: '6 hours ago',
    avatar: 'SM',
  },
  {
    id: '6',
    name: 'Michael Dondo',
    action: 'Updated Employee Records',
    target: '3 New Hires Added',
    time: '1 day ago',
    avatar: 'MO',
  },
];

export const mockBirthdays = [
  {
    id: '1',
    name: 'Peter Moyo',
    role: 'HR Officer',
    date: 'Today',
    avatar: 'PO',
  },
  {
    id: '2',
    name: 'Sarah Zara',
    role: 'Operations Officer',
    date: 'Tomorrow',
    avatar: 'SK',
  },
  {
    id: '3',
    name: 'John Mabaya',
    role: 'Accountant',
    date: '10 Sept 2026',
    avatar: 'JM',
  },
  {
    id: '4',
    name: 'Jane Mvura',
    role: 'Branch Manager',
    date: '15 Sept 2026',
    avatar: 'JW',
  },
];
