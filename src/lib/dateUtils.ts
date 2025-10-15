import { format } from "date-fns";

/**
 * Safely format a date, returning a fallback string if the date is invalid
 * @param date - The date to format (can be string, Date, null, or undefined)
 * @param formatStr - The format string to use
 * @param options - Optional format options (e.g., { locale: fr })
 * @param fallback - The fallback string to return if date is invalid (default: '-')
 * @returns Formatted date string or fallback
 */
export const safeFormatDate = (
  date: any,
  formatStr: string,
  options?: any,
  fallback: string = '-'
): string => {
  if (!date) return fallback;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return fallback;
    return format(dateObj, formatStr, options);
  } catch {
    return fallback;
  }
};
