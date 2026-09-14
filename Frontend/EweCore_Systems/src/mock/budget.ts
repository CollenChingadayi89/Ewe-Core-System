export interface BudgetAllocation {
  id: string;
  department: string;
  category: string;
  subcategory: string;
  budgetYear: number;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  month: string;

  // Budget
  allocatedBudget: number; // ZWG
  revisedBudget: number; // ZWG (if revised during year)

  // Actual Spending
  actualSpending: number; // ZWG
  committedSpending: number; // ZWG (approved but not yet spent)

  // Variance
  variance: number; // ZWG (allocatedBudget - actualSpending)
  variancePercentage: number; // Percentage

  // Status
  status: 'Under Budget' | 'On Track' | 'Over Budget' | 'Critical';
  utilizationPercentage: number; // actualSpending / allocatedBudget * 100

  // Forecasting
  forecastedSpending: number; // ZWG (projected spending by year end)
  remainingBudget: number; // ZWG

  // Approval
  approvedBy: string;
  approvedDate: string;
  notes?: string;
}

const departments = [
  'Human Resources',
  'Finance',
  'Operations',
  'IT',
  'Executive',
  'Compliance & Risk',
];

const categories = {
  'Human Resources': [
    { category: 'Salaries & Wages', subcategories: ['Basic Salary', 'Allowances', 'Overtime', 'Bonuses'] },
    { category: 'Recruitment', subcategories: ['Job Ads', 'Agency Fees', 'Interview Expenses'] },
    { category: 'Training & Development', subcategories: ['Training Programs', 'Conferences', 'Certifications'] },
    { category: 'Employee Welfare', subcategories: ['Medical', 'Team Building', 'Staff Welfare'] },
  ],
  'Finance': [
    { category: 'Salaries & Wages', subcategories: ['Basic Salary', 'Allowances', 'Bonuses'] },
    { category: 'Professional Services', subcategories: ['Audit Fees', 'Legal Fees', 'Consultancy'] },
    { category: 'Banking & Finance', subcategories: ['Bank Charges', 'Interest', 'Insurance'] },
  ],
  'Operations': [
    { category: 'Salaries & Wages', subcategories: ['Basic Salary', 'Allowances', 'Bonuses'] },
    { category: 'Utilities', subcategories: ['Electricity', 'Water', 'Internet', 'Phone'] },
    { category: 'Rent & Facilities', subcategories: ['Office Rent', 'Maintenance', 'Security'] },
    { category: 'Supplies', subcategories: ['Office Supplies', 'Printing', 'Stationery'] },
  ],
  'IT': [
    { category: 'Salaries & Wages', subcategories: ['Basic Salary', 'Allowances', 'Bonuses'] },
    { category: 'Software & Licenses', subcategories: ['Software Licenses', 'Cloud Services', 'Subscriptions'] },
    { category: 'Hardware', subcategories: ['Computers', 'Servers', 'Networking Equipment'] },
    { category: 'IT Services', subcategories: ['Support Services', 'Development', 'Maintenance'] },
  ],
  'Executive': [
    { category: 'Salaries & Wages', subcategories: ['Basic Salary', 'Allowances', 'Bonuses'] },
    { category: 'Travel & Entertainment', subcategories: ['Travel', 'Accommodation', 'Entertainment'] },
    { category: 'Marketing & PR', subcategories: ['Advertising', 'Events', 'PR Services'] },
  ],
  'Compliance & Risk': [
    { category: 'Salaries & Wages', subcategories: ['Basic Salary', 'Allowances', 'Bonuses'] },
    { category: 'Compliance', subcategories: ['Regulatory Fees', 'Compliance Training', 'Audits'] },
    { category: 'Risk Management', subcategories: ['Insurance', 'Risk Assessment', 'Security'] },
  ],
};

// Generate budget allocations for 2026
const generateBudgetAllocations = (): BudgetAllocation[] => {
  const allocations: BudgetAllocation[] = [];
  let id = 1;

  const months = [
    { month: 'January 2026', quarter: 'Q1' as const },
    { month: 'February 2026', quarter: 'Q1' as const },
    { month: 'March 2026', quarter: 'Q1' as const },
    { month: 'April 2026', quarter: 'Q2' as const },
    { month: 'May 2026', quarter: 'Q2' as const },
    { month: 'June 2026', quarter: 'Q2' as const },
    { month: 'July 2026', quarter: 'Q3' as const },
    { month: 'August 2026', quarter: 'Q3' as const },
    { month: 'September 2026', quarter: 'Q3' as const },
  ];

  departments.forEach(dept => {
    const deptCategories = categories[dept as keyof typeof categories] || [];

    deptCategories.forEach(catGroup => {
      catGroup.subcategories.forEach(subcat => {
        months.forEach(monthData => {
          // Base budget allocation
          let allocatedBudget = 0;

          if (catGroup.category === 'Salaries & Wages') {
            allocatedBudget = Math.floor(Math.random() * 300000) + 200000; // ZWG 200k-500k
          } else if (catGroup.category.includes('Software') || catGroup.category.includes('Hardware')) {
            allocatedBudget = Math.floor(Math.random() * 150000) + 50000; // ZWG 50k-200k
          } else if (catGroup.category.includes('Professional') || catGroup.category.includes('Consultancy')) {
            allocatedBudget = Math.floor(Math.random() * 100000) + 30000; // ZWG 30k-130k
          } else if (catGroup.category.includes('Utilities') || catGroup.category.includes('Supplies')) {
            allocatedBudget = Math.floor(Math.random() * 50000) + 10000; // ZWG 10k-60k
          } else {
            allocatedBudget = Math.floor(Math.random() * 80000) + 20000; // ZWG 20k-100k
          }

          const revisedBudget = Math.random() > 0.9 ? Math.floor(allocatedBudget * 1.1) : allocatedBudget;

          // Actual spending (70-105% of budget)
          const spendingFactor = Math.random() * 0.35 + 0.70; // 0.70 to 1.05
          const actualSpending = Math.floor(allocatedBudget * spendingFactor);
          const committedSpending = Math.floor(Math.random() * allocatedBudget * 0.1);

          const variance = allocatedBudget - actualSpending;
          const variancePercentage = Math.round((variance / allocatedBudget) * 100);

          const utilizationPercentage = Math.round((actualSpending / allocatedBudget) * 100);

          let status: 'Under Budget' | 'On Track' | 'Over Budget' | 'Critical';
          if (utilizationPercentage < 75) status = 'Under Budget';
          else if (utilizationPercentage <= 100) status = 'On Track';
          else if (utilizationPercentage <= 110) status = 'Over Budget';
          else status = 'Critical';

          const forecastedSpending = Math.floor(actualSpending * (12 / months.indexOf(monthData) + 1));
          const remainingBudget = allocatedBudget - actualSpending;

          allocations.push({
            id: `BUD-${String(id).padStart(4, '0')}`,
            department: dept,
            category: catGroup.category,
            subcategory: subcat,
            budgetYear: 2026,
            quarter: monthData.quarter,
            month: monthData.month,

            allocatedBudget,
            revisedBudget,

            actualSpending,
            committedSpending,

            variance,
            variancePercentage,

            status,
            utilizationPercentage,

            forecastedSpending,
            remainingBudget,

            approvedBy: dept === 'Executive' ? 'Margaret Njeri' : dept === 'Human Resources' ? 'Collen Chingadayi' : dept === 'Finance' ? 'David Kamau' : 'Margaret Njeri',
            approvedDate: '2025-12-15',
            notes: status === 'Critical' ? 'Requires immediate attention - budget exceeded' : status === 'Over Budget' ? 'Monitor closely' : undefined,
          });

          id++;
        });
      });
    });
  });

  return allocations;
};

export const mockBudgetAllocations = generateBudgetAllocations();

// Get budget by department
export const getBudgetByDepartment = (department: string): BudgetAllocation[] => {
  return mockBudgetAllocations.filter(b => b.department === department);
};

// Get budget by category
export const getBudgetByCategory = (category: string): BudgetAllocation[] => {
  return mockBudgetAllocations.filter(b => b.category === category);
};

// Get budget by status
export const getBudgetByStatus = (status: string): BudgetAllocation[] => {
  return mockBudgetAllocations.filter(b => b.status === status);
};

// Get budget by month
export const getBudgetByMonth = (month: string): BudgetAllocation[] => {
  return mockBudgetAllocations.filter(b => b.month === month);
};

// Get budget by quarter
export const getBudgetByQuarter = (quarter: string): BudgetAllocation[] => {
  return mockBudgetAllocations.filter(b => b.quarter === quarter);
};

// Get budget statistics
export const getBudgetStats = (department?: string, month?: string) => {
  let budgets = mockBudgetAllocations;

  if (department) budgets = budgets.filter(b => b.department === department);
  if (month) budgets = budgets.filter(b => b.month === month);

  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedBudget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.actualSpending, 0);
  const totalCommitted = budgets.reduce((sum, b) => sum + b.committedSpending, 0);
  const totalVariance = budgets.reduce((sum, b) => sum + b.variance, 0);

  return {
    totalAllocated,
    totalRevised: budgets.reduce((sum, b) => sum + b.revisedBudget, 0),
    totalSpent,
    totalCommitted,
    totalVariance,
    utilizationPercentage: Math.round((totalSpent / totalAllocated) * 100),
    underBudgetCount: budgets.filter(b => b.status === 'Under Budget').length,
    onTrackCount: budgets.filter(b => b.status === 'On Track').length,
    overBudgetCount: budgets.filter(b => b.status === 'Over Budget').length,
    criticalCount: budgets.filter(b => b.status === 'Critical').length,
    remainingBudget: totalAllocated - totalSpent,
    forecastedYearEnd: budgets.reduce((sum, b) => sum + b.forecastedSpending, 0),
  };
};

// Get over-budget items
export const getOverBudgetItems = (): BudgetAllocation[] => {
  return mockBudgetAllocations.filter(b => b.status === 'Over Budget' || b.status === 'Critical');
};

// Get department budget summary
export const getDepartmentBudgetSummary = () => {
  return departments.map(dept => {
    const deptBudgets = getBudgetByDepartment(dept);
    const stats = getBudgetStats(dept);

    return {
      department: dept,
      ...stats,
    };
  });
};
