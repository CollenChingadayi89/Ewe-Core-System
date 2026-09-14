export type OnboardingStage =
  | 'Document Collection'
  | 'IT Setup'
  | 'Workspace Setup'
  | 'Orientation'
  | 'Department Induction'
  | 'Training'
  | 'Completed';

export type OnboardingStatus = 'On Track' | 'Delayed' | 'Completed' | 'Not Started';

export interface OnboardingCandidate {
  id: string;
  candidateId: string;
  name: string;
  avatar?: string;
  position: string;
  department: string;
  startDate: string;
  stage: OnboardingStage;
  progress: number;
  assignedMentor: string;
  mentorAvatar?: string;
  status: OnboardingStatus;
  email: string;
  phone: string;
  tasksCompleted: number;
  totalTasks: number;
  documentsSubmitted: number;
  requiredDocuments: number;
}

export const mockOnboardingCandidates: OnboardingCandidate[] = [
  {
    id: 'OB001',
    candidateId: 'CND001',
    name: 'Faith Muthoni',
    position: 'Senior Accountant',
    department: 'Finance',
    startDate: '2026-09-10',
    stage: 'Document Collection',
    progress: 25,
    assignedMentor: 'David Kamau',
    status: 'On Track',
    email: 'faith.muthoni@ewesacco.org',
    phone: '+263 700 100 001',
    tasksCompleted: 2,
    totalTasks: 8,
    documentsSubmitted: 3,
    requiredDocuments: 6,
  },
  {
    id: 'OB002',
    candidateId: 'CND002',
    name: 'Dennis Ochieng',
    position: 'Software Developer',
    department: 'IT',
    startDate: '2026-09-08',
    stage: 'IT Setup',
    progress: 40,
    assignedMentor: 'Michael Otieno',
    status: 'On Track',
    email: 'dennis.ochieng@ewesacco.org',
    phone: '+263 700 100 002',
    tasksCompleted: 4,
    totalTasks: 10,
    documentsSubmitted: 6,
    requiredDocuments: 6,
  },
  {
    id: 'OB003',
    candidateId: 'CND003',
    name: 'Catherine Wangari',
    position: 'Branch Manager',
    department: 'Executive',
    startDate: '2026-09-05',
    stage: 'Orientation',
    progress: 60,
    assignedMentor: 'George Koech',
    status: 'On Track',
    email: 'catherine.wangari@ewesacco.org',
    phone: '+263 700 100 003',
    tasksCompleted: 7,
    totalTasks: 12,
    documentsSubmitted: 6,
    requiredDocuments: 6,
  },
  {
    id: 'OB004',
    candidateId: 'CND004',
    name: 'Vincent Kimani',
    position: 'Compliance Officer',
    department: 'Compliance & Risk',
    startDate: '2026-09-03',
    stage: 'Department Induction',
    progress: 75,
    assignedMentor: 'Elizabeth Wangari',
    status: 'On Track',
    email: 'vincent.kimani@ewesacco.org',
    phone: '+263 700 100 004',
    tasksCompleted: 10,
    totalTasks: 13,
    documentsSubmitted: 6,
    requiredDocuments: 6,
  },
  {
    id: 'OB005',
    candidateId: 'CND005',
    name: 'Agnes Chebet',
    position: 'HR Officer',
    department: 'Human Resources',
    startDate: '2026-09-01',
    stage: 'Training',
    progress: 90,
    assignedMentor: 'Collen Chingadayi',
    status: 'On Track',
    email: 'agnes.chebet@ewesacco.org',
    phone: '+263 700 100 005',
    tasksCompleted: 12,
    totalTasks: 14,
    documentsSubmitted: 6,
    requiredDocuments: 6,
  },
  {
    id: 'OB006',
    candidateId: 'CND006',
    name: 'Robert Mwangi',
    position: 'Operations Officer',
    department: 'Operations',
    startDate: '2026-08-28',
    stage: 'Completed',
    progress: 100,
    assignedMentor: 'James Mwangi',
    status: 'Completed',
    email: 'robert.mwangi@ewesacco.org',
    phone: '+263 700 100 006',
    tasksCompleted: 15,
    totalTasks: 15,
    documentsSubmitted: 6,
    requiredDocuments: 6,
  },
  {
    id: 'OB007',
    candidateId: 'CND007',
    name: 'Mercy Akinyi',
    position: 'Finance Officer',
    department: 'Finance',
    startDate: '2026-08-25',
    stage: 'Completed',
    progress: 100,
    assignedMentor: 'Sarah Mutua',
    status: 'Completed',
    email: 'mercy.akinyi@ewesacco.org',
    phone: '+263 700 100 007',
    tasksCompleted: 14,
    totalTasks: 14,
    documentsSubmitted: 6,
    requiredDocuments: 6,
  },
  {
    id: 'OB008',
    candidateId: 'CND008',
    name: 'Stephen Karanja',
    position: 'System Administrator',
    department: 'IT',
    startDate: '2026-09-12',
    stage: 'Document Collection',
    progress: 15,
    assignedMentor: 'Brian Kipchoge',
    status: 'Delayed',
    email: 'stephen.karanja@ewesacco.org',
    phone: '+263 700 100 008',
    tasksCompleted: 1,
    totalTasks: 9,
    documentsSubmitted: 2,
    requiredDocuments: 6,
  },
  {
    id: 'OB009',
    candidateId: 'CND009',
    name: 'Joyce Njoroge',
    position: 'Teller',
    department: 'Executive',
    startDate: '2026-09-15',
    stage: 'Document Collection',
    progress: 5,
    assignedMentor: 'Faith Njoroge',
    status: 'Not Started',
    email: 'joyce.njoroge@ewesacco.org',
    phone: '+263 700 100 009',
    tasksCompleted: 0,
    totalTasks: 8,
    documentsSubmitted: 1,
    requiredDocuments: 6,
  },
  {
    id: 'OB010',
    candidateId: 'CND010',
    name: 'Daniel Omondi',
    position: 'Credit Officer',
    department: 'Operations',
    startDate: '2026-09-18',
    stage: 'Document Collection',
    progress: 10,
    assignedMentor: 'Anne Njoki',
    status: 'Not Started',
    email: 'daniel.omondi@ewesacco.org',
    phone: '+263 700 100 010',
    tasksCompleted: 1,
    totalTasks: 10,
    documentsSubmitted: 2,
    requiredDocuments: 6,
  },
  {
    id: 'OB011',
    candidateId: 'CND011',
    name: 'Lydia Wanjiru',
    position: 'Customer Service Rep',
    department: 'Executive',
    startDate: '2026-09-06',
    stage: 'Workspace Setup',
    progress: 50,
    assignedMentor: 'Daniel Kimani',
    status: 'On Track',
    email: 'lydia.wanjiru@ewesacco.org',
    phone: '+263 700 100 011',
    tasksCompleted: 5,
    totalTasks: 10,
    documentsSubmitted: 6,
    requiredDocuments: 6,
  },
  {
    id: 'OB012',
    candidateId: 'CND012',
    name: 'Patrick Mutiso',
    position: 'Internal Auditor',
    department: 'Compliance & Risk',
    startDate: '2026-09-02',
    stage: 'Department Induction',
    progress: 70,
    assignedMentor: 'Patrick Njuguna',
    status: 'On Track',
    email: 'patrick.mutiso@ewesacco.org',
    phone: '+263 700 100 012',
    tasksCompleted: 8,
    totalTasks: 11,
    documentsSubmitted: 6,
    requiredDocuments: 6,
  },
];

export const getOnboardingCandidateById = (id: string): OnboardingCandidate | undefined => {
  return mockOnboardingCandidates.find((candidate) => candidate.id === id);
};

export const getOnboardingCandidatesByDepartment = (department: string): OnboardingCandidate[] => {
  return mockOnboardingCandidates.filter((candidate) => candidate.department === department);
};

export const getOnboardingCandidatesByStage = (stage: OnboardingStage): OnboardingCandidate[] => {
  return mockOnboardingCandidates.filter((candidate) => candidate.stage === stage);
};

export const getOnboardingCandidatesByStatus = (status: OnboardingStatus): OnboardingCandidate[] => {
  return mockOnboardingCandidates.filter((candidate) => candidate.status === status);
};

// Statistics helpers
export const getOnboardingStatistics = () => {
  const total = mockOnboardingCandidates.length;
  const inProgress = mockOnboardingCandidates.filter(
    (c) => c.status === 'On Track' || c.status === 'Delayed'
  ).length;
  const completed = mockOnboardingCandidates.filter((c) => c.status === 'Completed').length;
  const pendingStart = mockOnboardingCandidates.filter((c) => c.status === 'Not Started').length;

  return {
    total,
    inProgress,
    completed,
    pendingStart,
  };
};

// Stage configuration with colors
export const stageConfig: Record<
  OnboardingStage,
  { color: string; background: string; borderColor: string }
> = {
  'Document Collection': {
    color: '#ff6900',
    background: 'linear-gradient(135deg, #fff4e6 0%, #ffe7ba 100%)',
    borderColor: '#ff6900',
  },
  'IT Setup': {
    color: '#0693e3',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderColor: '#0693e3',
  },
  'Workspace Setup': {
    color: '#9b51e0',
    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    borderColor: '#9b51e0',
  },
  Orientation: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
  'Department Induction': {
    color: '#0693e3',
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderColor: '#0693e3',
  },
  Training: {
    color: '#EC4899',
    background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
    borderColor: '#EC4899',
  },
  Completed: {
    color: '#00d084',
    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    borderColor: '#00d084',
  },
};
