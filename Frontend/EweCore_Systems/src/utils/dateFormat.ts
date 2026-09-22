/**
 * Date Formatting Utilities
 * Converts between backend (YYYY-MM-DD) and frontend (DD/MM/YYYY) formats
 * Uses date-fns for reliable date manipulation
 */

import { format, parse, parseISO, isValid } from 'date-fns';

/**
 * Format date for display in the UI
 * Converts ISO 8601 (YYYY-MM-DD) to DD/MM/YYYY
 *
 * @param isoDate - Date string in YYYY-MM-DD format
 * @returns Date string in DD/MM/YYYY format
 */
export const formatDateForDisplay = (isoDate: string | Date | null | undefined): string => {
  if (!isoDate) return '';

  try {
    const date = typeof isoDate === 'string' ? parseISO(isoDate) : isoDate;
    if (!isValid(date)) return '';

    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    console.error('Error formatting date for display:', error);
    return '';
  }
};

/**
 * Format date for API requests
 * Converts DD/MM/YYYY to ISO 8601 (YYYY-MM-DD)
 *
 * @param displayDate - Date string in DD/MM/YYYY format or Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForAPI = (displayDate: string | Date | null | undefined): string => {
  if (!displayDate) return '';

  try {
    let date: Date;

    if (typeof displayDate === 'string') {
      // Try parsing as DD/MM/YYYY first
      date = parse(displayDate, 'dd/MM/yyyy', new Date());

      // If that fails, try ISO format
      if (!isValid(date)) {
        date = parseISO(displayDate);
      }
    } else {
      date = displayDate;
    }

    if (!isValid(date)) return '';

    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return '';
  }
};

/**
 * Format datetime for display with time
 * Converts ISO 8601 to DD/MM/YYYY HH:mm
 *
 * @param isoDateTime - DateTime string in ISO format
 * @returns DateTime string in DD/MM/YYYY HH:mm format
 */
export const formatDateTimeForDisplay = (isoDateTime: string | Date | null | undefined): string => {
  if (!isoDateTime) return '';

  try {
    const date = typeof isoDateTime === 'string' ? parseISO(isoDateTime) : isoDateTime;
    if (!isValid(date)) return '';

    return format(date, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting datetime for display:', error);
    return '';
  }
};

/**
 * Format time for display
 * Extracts time from ISO datetime
 *
 * @param isoDateTime - DateTime string in ISO format
 * @returns Time string in HH:mm format
 */
export const formatTimeForDisplay = (isoDateTime: string | Date | null | undefined): string => {
  if (!isoDateTime) return '';

  try {
    const date = typeof isoDateTime === 'string' ? parseISO(isoDateTime) : isoDateTime;
    if (!isValid(date)) return '';

    return format(date, 'HH:mm');
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return '';
  }
};

/**
 * Check if a date string is valid
 *
 * @param dateString - Date string to validate
 * @returns boolean indicating if date is valid
 */
export const isValidDate = (dateString: string | Date | null | undefined): boolean => {
  if (!dateString) return false;

  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date);
  } catch (error) {
    return false;
  }
};

/**
 * Get current date in API format (YYYY-MM-DD)
 */
export const getCurrentDateForAPI = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get current date in display format (DD/MM/YYYY)
 */
export const getCurrentDateForDisplay = (): string => {
  return format(new Date(), 'dd/MM/yyyy');
};

/**
 * Parse a date string in DD/MM/YYYY format to Date object
 */
export const parseDateFromDisplay = (displayDate: string): Date | null => {
  if (!displayDate) return null;

  try {
    const date = parse(displayDate, 'dd/MM/yyyy', new Date());
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Error parsing display date:', error);
    return null;
  }
};

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};
