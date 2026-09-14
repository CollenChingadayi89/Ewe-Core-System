// Mock data for Employee Dashboard

export const mockEmployeeProfile = {
  id: 'EMP001',
  name: 'Stephan Peralt',
  role: 'Senior Product Designer - UI/UX Design',
  avatar: 'SP',
  phoneNumber: '+1 324 3453 545',
  emailAddress: 'Stephan4519@example.com',
  reportOffice: 'Doglas Martini',
  joinedOn: '15 Jan 2024',
  status: 'active',
};

export const mockLeaveBalance = {
  totalLeaves: 16,
  taken: 10,
  absent: 2,
  request: 0,
  workedDays: 240,
  lossOfPay: 2,
  leaveTypes: [
    { type: 'On time', count: 1254, percentage: 73, color: '#1e40af' },
    { type: 'Late Attendance', count: 204, percentage: 12, color: '#00d084' },
    { type: 'Work From Home', count: 858, percentage: 50, color: '#ff6900' },
    { type: 'Absent', count: 14, percentage: 1, color: '#fbbf24' },
    { type: 'Sick Leave', count: 88, percentage: 5, color: '#cf2e2e' },
  ],
  betterThan: 85,
};

export const mockAttendanceToday = {
  clockIn: '08:35 AM',
  date: '11 Mar 2025',
  totalHoursToday: '6:45:02',
  production: '3:40 Hrs',
  punchInAt: '10:00 AM',
  totalWorkingHours: '12h 38m',
  productionHours: '08h 36m',
  breakHours: '22m 15s',
  overtimeHours: '02h 15m',
  yesterdayComparison: 15,
  lastWeekComparison: 15,
  lastMonthComparison: 21,
  thisMonthOvertime: 8,
};

export const mockProjects = [
  {
    id: 'P001',
    name: 'Office Management',
    projectLeader: {
      name: 'Anthony Lewis',
      avatar: 'AL',
    },
    deadline: '14/01/2026',
    deadlineType: 'Deadline',
    tasks: {
      completed: 6,
      total: 10,
    },
    timeSpent: '65/120 Hrs',
    teamMembers: ['AL', 'JD', 'SM'],
  },
  {
    id: 'P002',
    name: 'Office Management',
    projectLeader: {
      name: 'Anthony Lewis',
      avatar: 'AL',
    },
    deadline: '14/01/2026',
    deadlineType: 'Deadline',
    tasks: {
      completed: 6,
      total: 10,
    },
    timeSpent: '65/120 Hrs',
    teamMembers: ['AL', 'JD', 'SM', 'MK'],
  },
];

export const mockTasks = [
  {
    id: 'T001',
    title: 'Patient appointment booking',
    status: 'Onhold',
    teamMembers: ['SP', 'AL'],
    priority: 'high',
  },
  {
    id: 'T002',
    title: 'Appointment booking with payment...',
    status: 'Inprogress',
    teamMembers: ['JD', 'SM'],
    priority: 'medium',
  },
  {
    id: 'T003',
    title: 'Patient and Doctor video conferencing',
    status: 'Completed',
    teamMembers: ['AL', 'MK'],
    isCompleted: true,
    priority: 'high',
  },
  {
    id: 'T004',
    title: 'Private chat module',
    status: 'Inprogress',
    teamMembers: ['SP', 'JD', 'AL'],
    priority: 'low',
  },
  {
    id: 'T005',
    title: 'Go-Live and Post-Implementation ...',
    status: 'Inprogress',
    teamMembers: ['SM', 'MK'],
    priority: 'medium',
  },
];

export const mockPerformance = {
  currentScore: 98,
  lastYearComparison: 12,
  trend: 'up',
  monthlyData: [
    { month: 'Jan', score: 65 },
    { month: 'Feb', score: 70 },
    { month: 'Mar', score: 75 },
    { month: 'Apr', score: 85 },
    { month: 'May', score: 90 },
    { month: 'Jun', score: 95 },
    { month: 'Jul', score: 98 },
  ],
  feedback: 'Ratings are as per the feedback from the higher authorities',
};

export const mockSkills = [
  {
    name: 'Figma',
    proficiency: 95,
    lastUpdated: '15 May 2025',
  },
  {
    name: 'HTML',
    proficiency: 82,
    lastUpdated: '12 May 2025',
  },
  {
    name: 'CSS',
    proficiency: 70,
    lastUpdated: '12 May 2025',
  },
  {
    name: 'Wordpress',
    proficiency: 81,
    lastUpdated: '15 Jan 2025',
  },
  {
    name: 'Javascript',
    proficiency: 64,
    lastUpdated: '12 May 2025',
  },
];

export const mockTeamMembers = [
  {
    id: 'TM001',
    name: 'Troy Marte',
    role: 'UI/UX Designer',
    avatar: 'TM',
  },
  {
    id: 'TM002',
    name: 'Brian Villalobos',
    role: 'Senior Developer',
    avatar: 'BV',
  },
  {
    id: 'TM003',
    name: 'Doglas Martini',
    role: 'Project Manager',
    avatar: 'DM',
  },
  {
    id: 'TM004',
    name: 'Daniel Eshella',
    role: 'Team Leader',
    avatar: 'DE',
  },
  {
    id: 'TM005',
    name: 'Elliot Murray',
    role: 'Junior Designer',
    avatar: 'EM',
  },
  {
    id: 'TM006',
    name: 'Harvey Smith',
    role: 'Project Lead',
    avatar: 'HS',
  },
];

export const mockNotifications = [
  {
    id: 'N001',
    user: {
      name: 'Troy Marte',
      avatar: 'TM',
    },
    action: 'submitted the employee review',
    time: 'Today at 9:42 AM',
    attachment: 'EY_review.pdf',
    type: 'document',
  },
  {
    id: 'N002',
    user: {
      name: 'Linda Ray',
      avatar: 'LR',
    },
    action: 'request leave on 28 Oct 2024',
    time: 'Today at 9:06 AM',
    type: 'leave',
  },
  {
    id: 'N003',
    user: {
      name: 'Harvey Smith',
      avatar: 'HS',
    },
    action: 'requested access to UNIX',
    time: 'Today at 8:12 AM',
    type: 'request',
    actions: ['Approve', 'Decline'],
  },
  {
    id: 'N004',
    user: {
      name: 'Brian Villalobos',
      avatar: 'BV',
    },
    action: 'scheduled a new meeting',
    time: 'Today at 8:00 AM',
    type: 'meeting',
  },
  {
    id: 'N005',
    user: {
      name: 'Anthony Lewis',
      avatar: 'AL',
    },
    action: 'commented on new post',
    time: 'Today at 7:48 AM',
    type: 'comment',
  },
];

export const mockMeetings = [
  {
    id: 'M001',
    time: '11:00 AM',
    title: 'Marketing Strategy Presentation',
    department: 'Marketing',
    status: 'upcoming',
    isOngoing: false,
  },
  {
    id: 'M002',
    time: '10:05 AM',
    title: 'Design Review Hospital: doctors Management Project',
    department: 'Review',
    status: 'completed',
    isOngoing: false,
  },
  {
    id: 'M003',
    time: '09:20 AM',
    title: 'Birthday Celebration of Employee',
    department: 'Celebration',
    status: 'completed',
    isOngoing: false,
  },
  {
    id: 'M004',
    time: '08:45 AM',
    title: 'Update of Project Flow',
    department: 'Development',
    status: 'completed',
    isOngoing: false,
  },
];

export const mockLeavePolicy = {
  title: 'Leave Policy',
  lastUpdated: 'Today',
};

export const mockNextHoliday = {
  title: 'Next Holiday',
  date: 'Diwali, 15 Sep 2025',
};

export const mockTeamBirthday = {
  name: 'Andrew Jermia',
  role: 'IOS Developer',
  avatar: 'AJ',
  date: 'Today',
  status: 'Send Wishes',
};
