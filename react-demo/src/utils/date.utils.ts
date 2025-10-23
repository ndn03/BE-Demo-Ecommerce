/**
 * 📅 **Enhanced Date Utilities**
 *
 * Comprehensive date manipulation and formatting utilities
 */

import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/vi';

import { DATE_FORMATS } from './constants/app.constants';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(isTomorrow);
dayjs.extend(weekOfYear);
dayjs.extend(quarterOfYear);
dayjs.extend(customParseFormat);

// Set Vietnamese locale as default
dayjs.locale('vi');

export type DateInput = string | number | Date | Dayjs;

export class DateHelper {
  /**
   * Get current date in Vietnam timezone
   */
  static now(): Dayjs {
    return dayjs().tz('Asia/Ho_Chi_Minh');
  }

  /**
   * Parse date with various formats
   */
  static parse(date: DateInput): Dayjs {
    if (!date) return dayjs();
    return dayjs(date).tz('Asia/Ho_Chi_Minh');
  }

  /**
   * Format date for display
   */
  static formatDisplay(date: DateInput): string {
    return this.parse(date).format(DATE_FORMATS.DISPLAY);
  }

  /**
   * Format date with time for display
   */
  static formatDisplayWithTime(date: DateInput): string {
    return this.parse(date).format(DATE_FORMATS.DISPLAY_WITH_TIME);
  }

  /**
   * Format date for API
   */
  static formatForApi(date: DateInput): string {
    return this.parse(date).format(DATE_FORMATS.API);
  }

  /**
   * Get relative time (e.g., "2 hours ago", "in 3 days")
   */
  static fromNow(date: DateInput): string {
    return this.parse(date).fromNow();
  }

  /**
   * Check if date is today
   */
  static isToday(date: DateInput): boolean {
    return this.parse(date).isToday();
  }

  /**
   * Check if date is in the past
   */
  static isPast(date: DateInput): boolean {
    return this.parse(date).isBefore(this.now());
  }

  /**
   * Check if date is in the future
   */
  static isFuture(date: DateInput): boolean {
    return this.parse(date).isAfter(this.now());
  }

  /**
   * Validate date string
   */
  static isValidDate(dateStr: string, format?: string): boolean {
    const parsed = format ? dayjs(dateStr, format, true) : dayjs(dateStr);
    return parsed.isValid();
  }
}

// Legacy exports for backward compatibility
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  try {
    return DateHelper.formatDisplay(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

export const formatDateTime = (
  date: string | Date | null | undefined,
): string => {
  if (!date) return 'N/A';
  try {
    return DateHelper.formatDisplayWithTime(date);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'N/A';
  }
};

export const isValidDate = (
  date: string | Date | null | undefined,
): boolean => {
  if (!date) return false;
  try {
    return DateHelper.isValidDate(String(date));
  } catch (error) {
    return false;
  }
};
