// Mock attendance data for EWE SACCO HR module

export interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'permission';
  breakMinutes: number;
  lateMinutes: number;
  overtimeMinutes: number;
  productionHours: number;
  totalHours: number;
}

export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  averageWorkHours: number;
  totalProductionHours: number;
  totalOvertimeHours: number;
}

export interface TodayAttendance {
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'checked-in' | 'checked-out' | 'not-checked-in';
  currentProductionHours: number;
  breakMinutes: number;
  overtimeMinutes: number;
  expectedCheckOut: string;
}

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: 'ATT001',
    date: '14/01/2024',
    checkIn: '09:00 AM',
    checkOut: '06:45 PM',
    status: 'present',
    breakMinutes: 30,
    lateMinutes: 0,
    overtimeMinutes: 20,
    productionHours: 8.65,
    totalHours: 9.75,
  },
  {
    id: 'ATT002',
    date: '21/01/2024',
    checkIn: '09:00 AM',
    checkOut: '08:12 PM',
    status: 'present',
    breakMinutes: 20,
    lateMinutes: 0,
    overtimeMinutes: 45,
    productionHours: 7.64,
    totalHours: 11.2,
  },
  {
    id: 'ATT003',
    date: '20/02/2024',
    checkIn: '09:00 AM',
    checkOut: '06:13 PM',
    status: 'present',
    breakMinutes: 50,
    lateMinutes: 0,
    overtimeMinutes: 33,
    productionHours: 8.45,
    totalHours: 9.22,
  },
  {
    id: 'ATT004',
    date: '15/03/2024',
    checkIn: '09:00 AM',
    checkOut: '06:23 PM',
    status: 'present',
    breakMinutes: 41,
    lateMinutes: 0,
    overtimeMinutes: 50,
    productionHours: 8.35,
    totalHours: 9.38,
  },
  {
    id: 'ATT005',
    date: '12/04/2024',
    checkIn: '09:00 AM',
    checkOut: '08:43 PM',
    status: 'present',
    breakMinutes: 23,
    lateMinutes: 0,
    overtimeMinutes: 10,
    productionHours: 8.22,
    totalHours: 11.72,
  },
  {
    id: 'ATT006',
    date: '20/05/2024',
    checkIn: '09:00 AM',
    checkOut: '07:15 PM',
    status: 'present',
    breakMinutes: 3,
    lateMinutes: 0,
    overtimeMinutes: 0,
    productionHours: 8.32,
    totalHours: 10.25,
  },
  {
    id: 'ATT007',
    date: '06/07/2024',
    checkIn: '09:00 AM',
    checkOut: '07:13 PM',
    status: 'present',
    breakMinutes: 32,
    lateMinutes: 0,
    overtimeMinutes: 0,
    productionHours: 9.15,
    totalHours: 10.22,
  },
  {
    id: 'ATT008',
    date: '02/09/2024',
    checkIn: '09:00 AM',
    checkOut: '09:17 PM',
    status: 'present',
    breakMinutes: 14,
    lateMinutes: 12,
    overtimeMinutes: 0,
    productionHours: 9.26,
    totalHours: 12.28,
  },
  {
    id: 'ATT009',
    date: '15/11/2024',
    checkIn: '09:00 AM',
    checkOut: '08:15 PM',
    status: 'present',
    breakMinutes: 12,
    lateMinutes: 0,
    overtimeMinutes: 0,
    productionHours: 8.39,
    totalHours: 11.25,
  },
  {
    id: 'ATT010',
    date: '10/12/2024',
    checkIn: '09:00 AM',
    checkOut: '09:23 PM',
    status: 'absent',
    breakMinutes: 10,
    lateMinutes: 0,
    overtimeMinutes: 0,
    productionHours: 8.22,
    totalHours: 12.38,
  },
];

export const mockTodayAttendance: TodayAttendance = {
  employeeId: 'EMP002',
  employeeName: 'Adrian',
  date: '2025-03-11',
  checkInTime: '10:00 AM',
  checkOutTime: undefined,
  status: 'checked-in',
  currentProductionHours: 3.45,
  breakMinutes: 22,
  overtimeMinutes: 15,
  expectedCheckOut: '06:00 PM',
};

export const mockAttendanceSummary: AttendanceSummary = {
  totalDays: 160,
  presentDays: 126,
  absentDays: 16,
  lateDays: 18,
  averageWorkHours: 8.5,
  totalProductionHours: 1008,
  totalOvertimeHours: 45.5,
};

// Helper functions
export const getAttendanceByDateRange = (startDate: string, endDate: string): AttendanceRecord[] => {
  return mockAttendanceRecords.filter((record) => {
    const recordDate = new Date(record.date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return recordDate >= start && recordDate <= end;
  });
};

export const getAttendanceSummary = (records: AttendanceRecord[]): AttendanceSummary => {
  const totalDays = records.length;
  const presentDays = records.filter((r) => r.status === 'present').length;
  const absentDays = records.filter((r) => r.status === 'absent').length;
  const lateDays = records.filter((r) => r.lateMinutes > 0).length;
  const totalProductionHours = records.reduce((sum, r) => sum + r.productionHours, 0);
  const totalOvertimeHours = records.reduce((sum, r) => sum + r.overtimeMinutes / 60, 0);
  const averageWorkHours = totalDays > 0 ? totalProductionHours / totalDays : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    averageWorkHours,
    totalProductionHours,
    totalOvertimeHours,
  };
};

export const formatHoursMinutes = (decimalHours: number): string => {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}h ${minutes}m`;
};

export const formatMinutes = (minutes: number): string => {
  if (minutes === 0) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} Min`;
  return `${hours}h ${mins}m`;
};
