/**
 * Public Holidays Calendar - Zimbabwe 2026
 *
 * Based on Public Holidays and Prohibition of Business Act [Chapter 10:21]
 * Updated annually by government gazette
 *
 * Note: Some dates (Heroes Day, Defence Forces Day) may vary year-to-year
 * HR should verify against official government gazette before each year
 */

import type { PublicHoliday } from '../types/leave-ledger';

export const mockPublicHolidays2026: PublicHoliday[] = [
  {
    id: 'PH-2026-001',
    date: '2026-01-01',
    name: "New Year's Day",
    year: 2026,
    isRecurring: true,
    affectsLeaveCalculation: true,
    notes: 'Fixed date - January 1st annually',
  },
  {
    id: 'PH-2026-002',
    date: '2026-02-18',
    name: 'Robert Gabriel Mugabe National Youth Day',
    year: 2026,
    isRecurring: true,
    affectsLeaveCalculation: true,
    notes: 'Fixed date - February 21st annually',
  },
  {
    id: 'PH-2026-003',
    date: '2026-04-03',
    name: 'Good Friday',
    year: 2026,
    isRecurring: false,
    affectsLeaveCalculation: true,
    notes: 'Date varies based on Easter calculation',
  },
  {
    id: 'PH-2026-004',
    date: '2026-04-04',
    name: 'Easter Saturday',
    year: 2026,
    isRecurring: false,
    affectsLeaveCalculation: true,
    notes: 'Day after Good Friday',
  },
  {
    id: 'PH-2026-005',
    date: '2026-04-06',
    name: 'Easter Monday',
    year: 2026,
    isRecurring: false,
    affectsLeaveCalculation: true,
    notes: 'Monday after Easter Sunday',
  },
  {
    id: 'PH-2026-006',
    date: '2026-04-18',
    name: 'Independence Day',
    year: 2026,
    isRecurring: true,
    affectsLeaveCalculation: true,
    notes: 'Fixed date - April 18th annually (Zimbabwe independence from UK, 1980)',
  },
  {
    id: 'PH-2026-007',
    date: '2026-05-01',
    name: "Workers' Day / May Day",
    year: 2026,
    isRecurring: true,
    affectsLeaveCalculation: true,
    notes: 'Fixed date - May 1st annually (International Workers Day)',
  },
  {
    id: 'PH-2026-008',
    date: '2026-05-25',
    name: 'Africa Day',
    year: 2026,
    isRecurring: true,
    affectsLeaveCalculation: true,
    notes: 'Fixed date - May 25th annually (OAU founding day)',
  },
  {
    id: 'PH-2026-009',
    date: '2026-08-10',
    name: "Heroes' Day",
    year: 2026,
    isRecurring: false,
    affectsLeaveCalculation: true,
    notes: 'Second Monday of August - date varies annually, verify with gazette',
  },
  {
    id: 'PH-2026-010',
    date: '2026-08-11',
    name: "Defence Forces Day",
    year: 2026,
    isRecurring: false,
    affectsLeaveCalculation: true,
    notes: 'Day after Heroes Day - second Tuesday of August',
  },
  {
    id: 'PH-2026-011',
    date: '2026-12-22',
    name: 'Unity Day',
    year: 2026,
    isRecurring: true,
    affectsLeaveCalculation: true,
    notes: 'Fixed date - December 22nd annually (ZANU-PF and ZAPU unity accord, 1987)',
  },
  {
    id: 'PH-2026-012',
    date: '2026-12-25',
    name: 'Christmas Day',
    year: 2026,
    isRecurring: true,
    affectsLeaveCalculation: true,
    notes: 'Fixed date - December 25th annually',
  },
  {
    id: 'PH-2026-013',
    date: '2026-12-26',
    name: 'Boxing Day',
    year: 2026,
    isRecurring: true,
    affectsLeaveCalculation: true,
    notes: 'Fixed date - December 26th annually',
  },
];

/**
 * Public holidays for 2025 (for carryforward calculations)
 */
export const mockPublicHolidays2025: PublicHoliday[] = [
  { id: 'PH-2025-001', date: '2025-01-01', name: "New Year's Day", year: 2025, isRecurring: true, affectsLeaveCalculation: true },
  { id: 'PH-2025-002', date: '2025-02-21', name: 'Robert Gabriel Mugabe National Youth Day', year: 2025, isRecurring: true, affectsLeaveCalculation: true },
  { id: 'PH-2025-003', date: '2025-04-18', name: 'Good Friday', year: 2025, isRecurring: false, affectsLeaveCalculation: true },
  { id: 'PH-2025-004', date: '2025-04-19', name: 'Easter Saturday', year: 2025, isRecurring: false, affectsLeaveCalculation: true },
  { id: 'PH-2025-005', date: '2025-04-21', name: 'Easter Monday', year: 2025, isRecurring: false, affectsLeaveCalculation: true },
  { id: 'PH-2025-006', date: '2025-04-18', name: 'Independence Day', year: 2025, isRecurring: true, affectsLeaveCalculation: true },
  { id: 'PH-2025-007', date: '2025-05-01', name: "Workers' Day", year: 2025, isRecurring: true, affectsLeaveCalculation: true },
  { id: 'PH-2025-008', date: '2025-05-25', name: 'Africa Day', year: 2025, isRecurring: true, affectsLeaveCalculation: true },
  { id: 'PH-2025-009', date: '2025-08-11', name: "Heroes' Day", year: 2025, isRecurring: false, affectsLeaveCalculation: true },
  { id: 'PH-2025-010', date: '2025-08-12', name: "Defence Forces Day", year: 2025, isRecurring: false, affectsLeaveCalculation: true },
  { id: 'PH-2025-011', date: '2025-12-22', name: 'Unity Day', year: 2025, isRecurring: true, affectsLeaveCalculation: true },
  { id: 'PH-2025-012', date: '2025-12-25', name: 'Christmas Day', year: 2025, isRecurring: true, affectsLeaveCalculation: true },
  { id: 'PH-2025-013', date: '2025-12-26', name: 'Boxing Day', year: 2025, isRecurring: true, affectsLeaveCalculation: true },
];

// Combine both years for easy lookup
export const mockPublicHolidays: PublicHoliday[] = [
  ...mockPublicHolidays2025,
  ...mockPublicHolidays2026,
];

/**
 * Helper function to check if a date is a public holiday
 */
export function isPublicHoliday(date: string): boolean {
  return mockPublicHolidays.some((holiday) => holiday.date === date);
}

/**
 * Helper function to get public holiday by date
 */
export function getPublicHoliday(date: string): PublicHoliday | undefined {
  return mockPublicHolidays.find((holiday) => holiday.date === date);
}

/**
 * Helper function to get all public holidays in a date range
 */
export function getPublicHolidaysInRange(startDate: string, endDate: string): PublicHoliday[] {
  return mockPublicHolidays.filter(
    (holiday) => holiday.date >= startDate && holiday.date <= endDate
  );
}

/**
 * Helper function to get public holidays for a specific year
 */
export function getPublicHolidaysByYear(year: number): PublicHoliday[] {
  return mockPublicHolidays.filter((holiday) => holiday.year === year);
}

/**
 * Calculate working days between two dates (excluding weekends and public holidays)
 * Weekends: Saturday (6) and Sunday (0)
 *
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param includeWeekends - If true, weekends count as working days (for annual leave per s14A(3))
 * @param includePublicHolidays - If true, public holidays count as working days (for annual leave per s14A(3))
 * @returns Number of working days
 */
export function calculateWorkingDays(
  startDate: string,
  endDate: string,
  includeWeekends: boolean = false,
  includePublicHolidays: boolean = false
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;

  // Iterate through each day
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    // Check if weekend
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Check if public holiday
    const isHoliday = isPublicHoliday(dateStr);

    // Count the day based on rules
    if (includeWeekends && includePublicHolidays) {
      // Annual leave - everything counts
      workingDays++;
    } else if (includeWeekends && !includePublicHolidays) {
      // Weekends count, but not public holidays
      if (!isHoliday) {
        workingDays++;
      }
    } else if (!includeWeekends && includePublicHolidays) {
      // Public holidays count, but not weekends
      if (!isWeekend) {
        workingDays++;
      }
    } else {
      // Standard working days only (exclude both weekends and holidays)
      if (!isWeekend && !isHoliday) {
        workingDays++;
      }
    }
  }

  return workingDays;
}
