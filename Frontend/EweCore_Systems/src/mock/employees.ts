import type { User, Department } from '../types/index';

export const mockDepartments: Department[] = [
  { id: 'DEPT001', name: 'Executive', description: 'Executive Leadership', managerId: 'EMP000', employeeCount: 3 },
  { id: 'DEPT002', name: 'Human Resources', description: 'HR & Admin', managerId: 'EMP001', parentId: 'DEPT001', employeeCount: 8 },
  { id: 'DEPT003', name: 'Finance', description: 'Finance & Accounting', managerId: 'EMP010', parentId: 'DEPT001', employeeCount: 12 },
  { id: 'DEPT004', name: 'Operations', description: 'Operations Management', managerId: 'EMP020', parentId: 'DEPT001', employeeCount: 25 },
  { id: 'DEPT005', name: 'IT', description: 'Information Technology', managerId: 'EMP030', parentId: 'DEPT001', employeeCount: 10 },
  { id: 'DEPT006', name: 'Executive', description: 'Branch Operations', managerId: 'EMP040', parentId: 'DEPT004', employeeCount: 45 },
  { id: 'DEPT007', name: 'Compliance & Risk', description: 'Compliance & Risk Management', managerId: 'EMP050', parentId: 'DEPT001', employeeCount: 6 },
];

// Extended employee interface with productivity data
export interface EmployeeWithProductivity extends User {
  projects?: number;
  done?: number;
  progress?: number;
  productivity?: number;
  employmentStatus?: 'Permanent' | 'Contract' | 'Probation' | 'Intern';
}

export const mockEmployees: User[] = [
  // Executive
  {
    id: 'EMP000',
    name: 'Margaret Njeri',
    email: 'margaret.njeri@ewesacco.org',
    role: 'ceo',
    department: 'Executive',
    position: 'Chief Executive Officer',
    phone: '+263 700 000 000',
    joinDate: '2018-01-15',
    status: 'active',
  },

  // HR Department
  {
    id: 'EMP001',
    name: 'Collen Chingadayi',
    email: 'collen.chingadayi@ewesacco.org',
    role: 'hr_manager',
    department: 'Human Resources',
    position: 'HR Manager',
    reportsTo: 'EMP000',
    phone: '+263 700 000 001',
    joinDate: '2019-03-10',
    status: 'active',
  },
  {
    id: 'EMP002',
    name: 'Peter Omondi',
    email: 'peter.omondi@ewesacco.org',
    role: 'employee',
    department: 'Human Resources',
    position: 'HR Officer',
    reportsTo: 'EMP001',
    phone: '+263 700 000 002',
    joinDate: '2020-06-15',
    status: 'active',
  },
  {
    id: 'EMP003',
    name: 'Lucy Akinyi',
    email: 'lucy.akinyi@ewesacco.org',
    role: 'employee',
    department: 'Human Resources',
    position: 'Recruitment Specialist',
    reportsTo: 'EMP001',
    phone: '+263 700 000 003',
    joinDate: '2021-01-20',
    status: 'active',
  },

  // Finance Department
  {
    id: 'EMP010',
    name: 'David Kamau',
    email: 'david.kamau@ewesacco.org',
    role: 'finance_manager',
    department: 'Finance',
    position: 'Finance Manager',
    reportsTo: 'EMP000',
    phone: '+263 700 000 010',
    joinDate: '2018-07-01',
    status: 'active',
  },
  {
    id: 'EMP011',
    name: 'Sarah Mutua',
    email: 'sarah.mutua@ewesacco.org',
    role: 'employee',
    department: 'Finance',
    position: 'Senior Accountant',
    reportsTo: 'EMP010',
    phone: '+263 700 000 011',
    joinDate: '2019-09-15',
    status: 'active',
  },
  {
    id: 'EMP012',
    name: 'John Kariuki',
    email: 'john.kariuki@ewesacco.org',
    role: 'employee',
    department: 'Finance',
    position: 'Accountant',
    reportsTo: 'EMP010',
    phone: '+263 700 000 012',
    joinDate: '2020-11-01',
    status: 'active',
  },
  {
    id: 'EMP013',
    name: 'Mary Chebet',
    email: 'mary.chebet@ewesacco.org',
    role: 'employee',
    department: 'Finance',
    position: 'Finance Officer',
    reportsTo: 'EMP010',
    phone: '+263 700 000 013',
    joinDate: '2021-02-10',
    status: 'active',
  },

  // Operations Department
  {
    id: 'EMP020',
    name: 'James Mwangi',
    email: 'james.mwangi@ewesacco.org',
    role: 'manager',
    department: 'Operations',
    position: 'Operations Manager',
    reportsTo: 'EMP000',
    phone: '+263 700 000 020',
    joinDate: '2019-04-01',
    status: 'active',
  },
  {
    id: 'EMP021',
    name: 'Anne Njoki',
    email: 'anne.njoki@ewesacco.org',
    role: 'employee',
    department: 'Operations',
    position: 'Operations Officer',
    reportsTo: 'EMP020',
    phone: '+263 700 000 021',
    joinDate: '2020-05-15',
    status: 'active',
  },

  // IT Department
  {
    id: 'EMP030',
    name: 'Michael Otieno',
    email: 'michael.otieno@ewesacco.org',
    role: 'manager',
    department: 'IT',
    position: 'IT Manager',
    reportsTo: 'EMP000',
    phone: '+263 700 000 030',
    joinDate: '2019-08-01',
    status: 'active',
  },
  {
    id: 'EMP031',
    name: 'Brian Kipchoge',
    email: 'brian.kipchoge@ewesacco.org',
    role: 'employee',
    department: 'IT',
    position: 'Software Developer',
    reportsTo: 'EMP030',
    phone: '+263 700 000 031',
    joinDate: '2020-09-01',
    status: 'active',
  },
  {
    id: 'EMP032',
    name: 'Susan Wambui',
    email: 'susan.wambui@ewesacco.org',
    role: 'employee',
    department: 'IT',
    position: 'System Administrator',
    reportsTo: 'EMP030',
    phone: '+263 700 000 032',
    joinDate: '2021-03-15',
    status: 'active',
  },

  // Executive
  {
    id: 'EMP040',
    name: 'George Koech',
    email: 'george.koech@ewesacco.org',
    role: 'manager',
    department: 'Executive',
    position: 'Branch Operations Manager',
    reportsTo: 'EMP020',
    phone: '+263 700 000 040',
    joinDate: '2019-05-01',
    status: 'active',
  },
  {
    id: 'EMP041',
    name: 'Faith Njoroge',
    email: 'faith.njoroge@ewesacco.org',
    role: 'employee',
    department: 'Executive',
    position: 'Branch Manager - Nairobi',
    reportsTo: 'EMP040',
    phone: '+263 700 000 041',
    joinDate: '2020-02-01',
    status: 'active',
  },
  {
    id: 'EMP042',
    name: 'Daniel Kimani',
    email: 'daniel.kimani@ewesacco.org',
    role: 'employee',
    department: 'Executive',
    position: 'Branch Manager - Mombasa',
    reportsTo: 'EMP040',
    phone: '+263 700 000 042',
    joinDate: '2020-03-15',
    status: 'active',
  },

  // Compliance
  {
    id: 'EMP050',
    name: 'Elizabeth Wangari',
    email: 'elizabeth.wangari@ewesacco.org',
    role: 'manager',
    department: 'Compliance & Risk',
    position: 'Compliance Manager',
    reportsTo: 'EMP000',
    phone: '+263 700 000 050',
    joinDate: '2019-10-01',
    status: 'active',
  },
  {
    id: 'EMP051',
    name: 'Patrick Njuguna',
    email: 'patrick.njuguna@ewesacco.org',
    role: 'employee',
    department: 'Compliance & Risk',
    position: 'Compliance Officer',
    reportsTo: 'EMP050',
    phone: '+263 700 000 051',
    joinDate: '2020-11-15',
    status: 'active',
  },
];

export const getEmployeeById = (id: string): User | undefined => {
  return mockEmployees.find(emp => emp.id === id);
};

export const getEmployeesByDepartment = (department: string): User[] => {
  return mockEmployees.filter(emp => emp.department === department);
};

export const getEmployeesByManager = (managerId: string): User[] => {
  return mockEmployees.filter(emp => emp.reportsTo === managerId);
};

export const getDepartmentById = (id: string): Department | undefined => {
  return mockDepartments.find(dept => dept.id === id);
};

// Employee Grid data with productivity metrics
export const mockEmployeesWithProductivity: EmployeeWithProductivity[] = mockEmployees.map((emp, index) => ({
  ...emp,
  projects: Math.floor(Math.random() * 15) + 3,
  done: Math.floor(Math.random() * 10) + 2,
  progress: Math.floor(Math.random() * 5) + 1,
  productivity: Math.floor(Math.random() * 30) + 70,
  employmentStatus: index % 10 === 0 ? 'Intern' : index % 8 === 0 ? 'Probation' : index % 5 === 0 ? 'Contract' : 'Permanent',
}));
