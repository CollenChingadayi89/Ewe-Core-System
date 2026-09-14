export interface SACCOMember {
  id: string;
  memberNumber: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  age: number;
  gender: 'Male' | 'Female';

  // Account Details
  accountStatus: 'Active' | 'Inactive' | 'Suspended' | 'Closed';
  joinDate: string;
  membershipType: 'Individual' | 'Corporate';
  branch: string;

  // Shares
  sharesOwned: number;
  shareValue: number; // ZWG per share
  totalShareValue: number; // ZWG

  // Savings
  savingsBalance: number; // ZWG
  depositsThisMonth: number; // ZWG
  withdrawalsThisMonth: number; // ZWG
  depositsYTD: number; // ZWG
  withdrawalsYTD: number; // ZWG

  // Loans
  activeLoans: number;
  totalLoanAmount: number; // ZWG
  outstandingLoanBalance: number; // ZWG
  monthlyInstallment: number; // ZWG
  nextPaymentDue: string;
  loanStatus: 'Current' | 'Arrears' | 'Defaulted' | 'No Loan';

  // Dividends
  lastDividend: number; // ZWG
  totalDividendsEarned: number; // ZWG
  dividendRate: number; // Percentage

  // Activity
  lastTransactionDate: string;
  transactionCount: number;

  // Personal Information
  occupation: string;
  employer: string;
  address: string;
  city: string;

  // Emergency Contact
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

// Helper to generate realistic member data
const generateMembers = (): SACCOMember[] => {
  const firstNames = [
    'John', 'Mary', 'Peter', 'Grace', 'David', 'Sarah', 'James', 'Lucy', 'Michael', 'Faith',
    'Daniel', 'Elizabeth', 'Joseph', 'Margaret', 'Samuel', 'Ann', 'Patrick', 'Jane', 'Paul', 'Rose',
    'Stephen', 'Catherine', 'Thomas', 'Rachel', 'Benjamin', 'Hannah', 'Emmanuel', 'Rebecca', 'Timothy', 'Ruth',
    'Joshua', 'Esther', 'Andrew', 'Judith', 'Kenneth', 'Martha', 'Robert', 'Lydia', 'Moses', 'Naomi',
    'George', 'Susan', 'William', 'Beatrice', 'Charles', 'Josephine', 'Simon', 'Christine', 'Francis', 'Agnes',
  ];

  const lastNames = [
    'Kamau', 'Njeri', 'Mwangi', 'Wanjiru', 'Ochieng', 'Akinyi', 'Otieno', 'Wanjiku', 'Mutua', 'Nyambura',
    'Kimani', 'Wairimu', 'Kariuki', 'Wangari', 'Omondi', 'Atieno', 'Kipchoge', 'Chebet', 'Maina', 'Nyokabi',
  ];

  const occupations = [
    'Teacher', 'Nurse', 'Engineer', 'Doctor', 'Accountant', 'Lawyer', 'Business Owner', 'Farmer',
    'IT Professional', 'Civil Servant', 'Driver', 'Sales Manager', 'Consultant', 'Architect',
    'Pharmacist', 'Journalist', 'Chef', 'Mechanic', 'Electrician', 'Plumber',
  ];

  const employers = [
    'Ministry of Education', 'Nairobi Hospital', 'Kenya Power & Lighting', 'Equity Bank',
    'Safaricom Ltd', 'Kenya Revenue Authority', 'Self Employed', 'County Government',
    'KPLC', 'KCB Bank', 'Co-operative Bank', 'Nation Media Group', 'Standard Group',
    'East African Breweries', 'Kenya Airways', 'Bamburi Cement', 'Brookside Dairy',
    'Kenyan Government', 'Private Practice', 'Local Business',
  ];

  const cities = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Nyeri', 'Machakos',
    'Kiambu', 'Meru', 'Naivasha', 'Kakamega', 'Kitale', 'Garissa', 'Lamu',
  ];

  const branches = ['Nairobi Central', 'Westlands', 'Mombasa', 'Kisumu', 'Nakuru'];

  const members: SACCOMember[] = [];

  for (let i = 1; i <= 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    const age = Math.floor(Math.random() * 40) + 25; // 25-65 years
    const birthYear = new Date().getFullYear() - age;

    // Shares
    const sharesOwned = Math.floor(Math.random() * 500) + 50; // 50-550 shares
    const shareValue = 1000; // ZWG 1000 per share
    const totalShareValue = sharesOwned * shareValue;

    // Savings
    const savingsBalance = Math.floor(Math.random() * 500000) + 50000; // ZWG 50,000 - 550,000
    const depositsThisMonth = Math.floor(Math.random() * 50000) + 5000;
    const withdrawalsThisMonth = Math.floor(Math.random() * 30000);
    const depositsYTD = depositsThisMonth * 9; // Approx 9 months
    const withdrawalsYTD = withdrawalsThisMonth * 7;

    // Loans
    const hasLoan = Math.random() > 0.4; // 60% have loans
    const activeLoans = hasLoan ? (Math.random() > 0.8 ? 2 : 1) : 0;
    const totalLoanAmount = hasLoan ? Math.floor(Math.random() * 1000000) + 100000 : 0; // ZWG 100k - 1.1M
    const outstandingLoanBalance = hasLoan ? Math.floor(totalLoanAmount * (Math.random() * 0.7 + 0.3)) : 0; // 30-100% of loan
    const monthlyInstallment = hasLoan ? Math.floor(outstandingLoanBalance / (Math.floor(Math.random() * 24) + 12)) : 0; // 12-36 months
    const loanStatus = !hasLoan ? 'No Loan' : (Math.random() > 0.85 ? 'Arrears' : (Math.random() > 0.95 ? 'Defaulted' : 'Current'));

    // Dividends
    const dividendRate = 8.5; // 8.5% annual dividend rate
    const lastDividend = Math.floor(totalShareValue * (dividendRate / 100));
    const totalDividendsEarned = lastDividend * 3; // 3 years of dividends

    const accountStatus: 'Active' | 'Inactive' | 'Suspended' | 'Closed' = Math.random() > 0.95 ? 'Inactive' : (Math.random() > 0.98 ? 'Suspended' : 'Active');

    members.push({
      id: `MEM-${String(i).padStart(4, '0')}`,
      memberNumber: `WES-${String(10000 + i)}`,
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+263 ${Math.floor(Math.random() * 900 + 700)} ${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      nationalId: `${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
      dateOfBirth: `${birthYear}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      age,
      gender,

      accountStatus,
      joinDate: `${2020 + Math.floor(Math.random() * 6)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      membershipType: Math.random() > 0.9 ? 'Corporate' : 'Individual',
      branch: branches[Math.floor(Math.random() * branches.length)],

      sharesOwned,
      shareValue,
      totalShareValue,

      savingsBalance,
      depositsThisMonth,
      withdrawalsThisMonth,
      depositsYTD,
      withdrawalsYTD,

      activeLoans,
      totalLoanAmount,
      outstandingLoanBalance,
      monthlyInstallment,
      nextPaymentDue: hasLoan ? `2026-${String(Math.floor(Math.random() * 3) + 9).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}` : '',
      loanStatus,

      lastDividend,
      totalDividendsEarned,
      dividendRate,

      lastTransactionDate: `2026-09-${String(Math.floor(Math.random() * 9) + 1).padStart(2, '0')}`,
      transactionCount: Math.floor(Math.random() * 200) + 50,

      occupation: occupations[Math.floor(Math.random() * occupations.length)],
      employer: employers[Math.floor(Math.random() * employers.length)],
      address: `${Math.floor(Math.random() * 1000) + 1} ${lastNames[Math.floor(Math.random() * lastNames.length)]} Road`,
      city: cities[Math.floor(Math.random() * cities.length)],

      emergencyContactName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      emergencyContactPhone: `+263 ${Math.floor(Math.random() * 900 + 700)} ${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      emergencyContactRelationship: ['Spouse', 'Sibling', 'Parent', 'Child', 'Friend'][Math.floor(Math.random() * 5)],
    });
  }

  return members;
};

export const mockMembers = generateMembers();

// Get members by branch
export const getMembersByBranch = (branch: string): SACCOMember[] => {
  return mockMembers.filter(m => m.branch === branch);
};

// Get members by status
export const getMembersByStatus = (status: string): SACCOMember[] => {
  return mockMembers.filter(m => m.accountStatus === status);
};

// Get members with loans
export const getMembersWithLoans = (): SACCOMember[] => {
  return mockMembers.filter(m => m.activeLoans > 0);
};

// Get members in arrears
export const getMembersInArrears = (): SACCOMember[] => {
  return mockMembers.filter(m => m.loanStatus === 'Arrears' || m.loanStatus === 'Defaulted');
};

// Get member statistics
export const getMemberStats = () => {
  const activeMembers = mockMembers.filter(m => m.accountStatus === 'Active');

  return {
    totalMembers: mockMembers.length,
    activeMembers: activeMembers.length,
    inactiveMembers: mockMembers.filter(m => m.accountStatus === 'Inactive').length,
    suspendedMembers: mockMembers.filter(m => m.accountStatus === 'Suspended').length,

    totalShares: mockMembers.reduce((sum, m) => sum + m.sharesOwned, 0),
    totalShareValue: mockMembers.reduce((sum, m) => sum + m.totalShareValue, 0),

    totalSavings: mockMembers.reduce((sum, m) => sum + m.savingsBalance, 0),
    totalDepositsThisMonth: mockMembers.reduce((sum, m) => sum + m.depositsThisMonth, 0),
    totalWithdrawalsThisMonth: mockMembers.reduce((sum, m) => sum + m.withdrawalsThisMonth, 0),

    membersWithLoans: mockMembers.filter(m => m.activeLoans > 0).length,
    totalLoansAmount: mockMembers.reduce((sum, m) => sum + m.totalLoanAmount, 0),
    totalOutstandingLoans: mockMembers.reduce((sum, m) => sum + m.outstandingLoanBalance, 0),
    membersInArrears: mockMembers.filter(m => m.loanStatus === 'Arrears' || m.loanStatus === 'Defaulted').length,

    totalDividendsPaid: mockMembers.reduce((sum, m) => sum + m.lastDividend, 0),

    averageSavingsBalance: Math.round(mockMembers.reduce((sum, m) => sum + m.savingsBalance, 0) / mockMembers.length),
    averageSharesOwned: Math.round(mockMembers.reduce((sum, m) => sum + m.sharesOwned, 0) / mockMembers.length),
  };
};

// Get member by ID
export const getMemberById = (id: string): SACCOMember | undefined => {
  return mockMembers.find(m => m.id === id);
};

// Get member by member number
export const getMemberByNumber = (memberNumber: string): SACCOMember | undefined => {
  return mockMembers.find(m => m.memberNumber === memberNumber);
};

