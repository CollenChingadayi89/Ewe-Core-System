export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  month: string; // "January 2026"
  year: number;
  payPeriod: string; // "2026-01"
  payDate: string;

  // Earnings
  basicSalary: number; // ZWG
  housingAllowance: number; // ZWG
  transportAllowance: number; // ZWG
  mealAllowance: number; // ZWG
  performanceBonus: number; // ZWG
  overtimePay: number; // ZWG
  otherEarnings: number; // ZWG
  grossSalary: number; // ZWG

  // Deductions
  incomeTax: number; // PAYE - ZWG
  pensionContribution: number; // ZWG
  nhif: number; // National Health Insurance Fund - ZWG
  nssf: number; // National Social Security Fund - ZWG
  saccoContribution: number; // ZWG
  loanRepayment: number; // ZWG
  advance: number; // ZWG
  otherDeductions: number; // ZWG
  totalDeductions: number; // ZWG

  // Net Pay
  netSalary: number; // ZWG

  // Payment Details
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Cheque' | 'Mobile Money';
  bankName: string;
  accountNumber: string;
  paymentReference: string;
  paymentStatus: 'Pending' | 'Processed' | 'Paid' | 'Failed';
}

// Helper function to calculate deductions
const calculateDeductions = (gross: number) => {
  const incomeTax = Math.round(gross * 0.30); // 30% PAYE
  const pension = Math.round(gross * 0.06); // 6% pension
  const nhif = 2500; // Fixed ZWG 2500
  const nssf = 3000; // Fixed ZWG 3000
  const sacco = Math.round(gross * 0.05); // 5% SACCO contribution

  return {
    incomeTax,
    pension,
    nhif,
    nssf,
    sacco,
  };
};

// Base salaries by position (ZWG)
const baseSalaries: Record<string, number> = {
  'Chief Executive Officer': 450000,
  'HR Manager': 280000,
  'Finance Manager': 300000,
  'Operations Manager': 290000,
  'IT Manager': 310000,
  'Branch Operations Manager': 275000,
  'Compliance Manager': 265000,
  'HR Officer': 180000,
  'Recruitment Specialist': 175000,
  'Senior Accountant': 220000,
  'Accountant': 190000,
  'Finance Officer': 185000,
  'Operations Officer': 170000,
  'Software Developer': 240000,
  'System Administrator': 230000,
  'Branch Manager - Nairobi': 210000,
  'Branch Manager - Mombasa': 210000,
  'Compliance Officer': 175000,
};

// Generate payroll for all employees for 3 months
const generatePayrollRecords = (): PayrollRecord[] => {
  const employees = [
    { id: 'EMP000', name: 'Margaret Njeri', department: 'Executive', position: 'Chief Executive Officer' },
    { id: 'EMP001', name: 'Collen Chingadayi', department: 'Human Resources', position: 'HR Manager' },
    { id: 'EMP002', name: 'Peter Omondi', department: 'Human Resources', position: 'HR Officer' },
    { id: 'EMP003', name: 'Lucy Akinyi', department: 'Human Resources', position: 'Recruitment Specialist' },
    { id: 'EMP010', name: 'David Kamau', department: 'Finance', position: 'Finance Manager' },
    { id: 'EMP011', name: 'Sarah Mutua', department: 'Finance', position: 'Senior Accountant' },
    { id: 'EMP012', name: 'John Kariuki', department: 'Finance', position: 'Accountant' },
    { id: 'EMP013', name: 'Mary Chebet', department: 'Finance', position: 'Finance Officer' },
    { id: 'EMP020', name: 'James Mwangi', department: 'Operations', position: 'Operations Manager' },
    { id: 'EMP021', name: 'Anne Njoki', department: 'Operations', position: 'Operations Officer' },
    { id: 'EMP030', name: 'Michael Otieno', department: 'IT', position: 'IT Manager' },
    { id: 'EMP031', name: 'Brian Kipchoge', department: 'IT', position: 'Software Developer' },
    { id: 'EMP032', name: 'Susan Wambui', department: 'IT', position: 'System Administrator' },
    { id: 'EMP040', name: 'George Koech', department: 'Executive', position: 'Branch Operations Manager' },
    { id: 'EMP041', name: 'Faith Njoroge', department: 'Executive', position: 'Branch Manager - Nairobi' },
    { id: 'EMP042', name: 'Daniel Kimani', department: 'Executive', position: 'Branch Manager - Mombasa' },
    { id: 'EMP050', name: 'Elizabeth Wangari', department: 'Compliance & Risk', position: 'Compliance Manager' },
    { id: 'EMP051', name: 'Patrick Njuguna', department: 'Compliance & Risk', position: 'Compliance Officer' },
  ];

  const months = [
    { month: 'July 2026', year: 2026, period: '2026-07', payDate: '2026-07-30' },
    { month: 'August 2026', year: 2026, period: '2026-08', payDate: '2026-08-30' },
    { month: 'September 2026', year: 2026, period: '2026-09', payDate: '2026-09-30' },
  ];

  const records: PayrollRecord[] = [];
  let recordId = 1;

  months.forEach((monthData, monthIndex) => {
    employees.forEach((emp) => {
      const basicSalary = baseSalaries[emp.position];
      const housingAllowance = Math.round(basicSalary * 0.15);
      const transportAllowance = Math.round(basicSalary * 0.10);
      const mealAllowance = Math.round(basicSalary * 0.05);

      // Add some variation for bonuses and overtime
      const performanceBonus = monthIndex === 2 ? Math.round(basicSalary * 0.10) : 0; // Bonus in Sep
      const overtimePay = Math.random() > 0.7 ? Math.round(basicSalary * 0.03) : 0;
      const otherEarnings = 0;

      const grossSalary = basicSalary + housingAllowance + transportAllowance + mealAllowance + performanceBonus + overtimePay + otherEarnings;

      const deductions = calculateDeductions(grossSalary);

      // Add some variation for loans and advances
      const loanRepayment = Math.random() > 0.6 ? Math.round(basicSalary * 0.08) : 0;
      const advance = 0;
      const otherDeductions = 0;

      const totalDeductions = deductions.incomeTax + deductions.pension + deductions.nhif + deductions.nssf + deductions.sacco + loanRepayment + advance + otherDeductions;

      const netSalary = grossSalary - totalDeductions;

      records.push({
        id: `PAY-${String(recordId).padStart(4, '0')}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        position: emp.position,
        month: monthData.month,
        year: monthData.year,
        payPeriod: monthData.period,
        payDate: monthData.payDate,

        basicSalary,
        housingAllowance,
        transportAllowance,
        mealAllowance,
        performanceBonus,
        overtimePay,
        otherEarnings,
        grossSalary,

        incomeTax: deductions.incomeTax,
        pensionContribution: deductions.pension,
        nhif: deductions.nhif,
        nssf: deductions.nssf,
        saccoContribution: deductions.sacco,
        loanRepayment,
        advance,
        otherDeductions,
        totalDeductions,

        netSalary,

        paymentMethod: 'Bank Transfer',
        bankName: emp.id === 'EMP000' ? 'Barclays Bank' : emp.id.includes('01') ? 'Standard Bank' : emp.id.includes('02') ? 'Equity Bank' : emp.id.includes('03') ? 'KCB Bank' : 'Stanbic Bank',
        accountNumber: `ACC${emp.id.replace('EMP', '')}${Math.floor(Math.random() * 1000000)}`,
        paymentReference: `REF-${monthData.period}-${emp.id}`,
        paymentStatus: 'Paid',
      });

      recordId++;
    });
  });

  return records;
};

export const mockPayrollRecords = generatePayrollRecords();

// Get payroll by employee
export const getPayrollByEmployee = (employeeId: string): PayrollRecord[] => {
  return mockPayrollRecords.filter(p => p.employeeId === employeeId);
};

// Get payroll by month
export const getPayrollByMonth = (month: string): PayrollRecord[] => {
  return mockPayrollRecords.filter(p => p.month === month);
};

// Get payroll by department
export const getPayrollByDepartment = (department: string): PayrollRecord[] => {
  return mockPayrollRecords.filter(p => p.department === department);
};

// Get payroll statistics
export const getPayrollStats = (month?: string) => {
  const records = month ? getPayrollByMonth(month) : mockPayrollRecords;

  return {
    totalEmployees: new Set(records.map(p => p.employeeId)).size,
    totalGrossSalary: records.reduce((sum, p) => sum + p.grossSalary, 0),
    totalDeductions: records.reduce((sum, p) => sum + p.totalDeductions, 0),
    totalNetSalary: records.reduce((sum, p) => sum + p.netSalary, 0),
    totalTaxCollected: records.reduce((sum, p) => sum + p.incomeTax, 0),
    totalPensionContributions: records.reduce((sum, p) => sum + p.pensionContribution, 0),
    totalSACCOContributions: records.reduce((sum, p) => sum + p.saccoContribution, 0),
    averageGrossSalary: Math.round(records.reduce((sum, p) => sum + p.grossSalary, 0) / records.length),
    averageNetSalary: Math.round(records.reduce((sum, p) => sum + p.netSalary, 0) / records.length),
  };
};

// Get salary by position
export const getSalaryByPosition = (): Record<string, number> => {
  return baseSalaries;
};

// Export base salaries for reference
export { baseSalaries };
