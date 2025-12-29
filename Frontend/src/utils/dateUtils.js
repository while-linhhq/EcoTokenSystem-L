/**
 * Utility functions for date/time formatting with Vietnam timezone (UTC+7)
 */

/**
 * Parse date string from backend (always UTC) to Date object
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {Date} Date object in UTC
 */
const parseUTCDate = (dateString) => {
  if (dateString instanceof Date) {
    return dateString;
  }

  if (!dateString) {
    return null;
  }

  // Backend returns UTC time in ISO format
  // ASP.NET Core serializes DateTime to ISO string, may or may not have 'Z' at the end
  // If no timezone indicator, assume it's UTC
  let dateStr = dateString.trim();
  
  // If already has timezone indicator (Z, +, -), use as is
  if (dateStr.endsWith('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/)) {
    return new Date(dateStr);
  }
  
  // If no timezone indicator, append 'Z' to indicate UTC
  // Format: YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ss.fff
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(dateStr + 'Z');
  }
  
  // Fallback: try parsing as is (may be interpreted as local time, but should be rare)
  return new Date(dateStr);
};

/**
 * Format date string to Vietnamese locale with timezone support
 * @param {string|Date} dateString - ISO date string or Date object (UTC from backend)
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'Chưa có';

  try {
    const date = parseUTCDate(dateString);
    if (!date || isNaN(date.getTime())) {
      return 'Ngày không hợp lệ';
    }

    // Use Vietnam timezone (Asia/Ho_Chi_Minh = UTC+7)
    const defaultOptions = {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      ...options
    };

    return date.toLocaleString('vi-VN', defaultOptions);
  } catch (error) {
    console.error('[formatDate] Error:', error, dateString);
    return 'Ngày không hợp lệ';
  }
};

/**
 * Format date to date-only string (YYYY-MM-DD) for input[type="date"]
 * @param {string|Date} dateString - ISO date string or Date object (UTC from backend)
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString) => {
  if (!dateString) return '';

  try {
    const date = parseUTCDate(dateString);
    if (!date || isNaN(date.getTime())) {
      return '';
    }

    // Convert UTC date to Vietnam timezone and format as YYYY-MM-DD
    // Use toLocaleDateString with en-CA locale to get ISO format (YYYY-MM-DD)
    const vietnamDateStr = date.toLocaleDateString('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    return vietnamDateStr; // Returns YYYY-MM-DD format
  } catch (error) {
    console.error('[formatDateForInput] Error:', error, dateString);
    return '';
  }
};

/**
 * Format relative time (e.g., "5 phút trước", "2 giờ trước")
 * @param {string|Date} dateString - ISO date string or Date object (UTC from backend)
 * @returns {string} Relative time string
 */
export const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Vừa xong';

  try {
    const date = parseUTCDate(dateString);
    if (!date || isNaN(date.getTime())) {
      return 'Vừa xong';
    }

    // Get current time in UTC
    const now = new Date();
    
    // Calculate difference in milliseconds (both are in UTC)
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return 'Vừa xong';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // If older than 7 days, show date with Vietnam timezone
    return date.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('[formatTimeAgo] Error:', error, dateString);
    return 'Vừa xong';
  }
};

/**
 * Format date only (without time)
 * @param {string|Date} dateString - ISO date string or Date object (UTC from backend)
 * @returns {string} Formatted date string (DD/MM/YYYY)
 */
export const formatDateOnly = (dateString) => {
  if (!dateString) return 'Chưa có';

  try {
    const date = parseUTCDate(dateString);
    if (!date || isNaN(date.getTime())) {
      return 'Ngày không hợp lệ';
    }

    return date.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('[formatDateOnly] Error:', error, dateString);
    return 'Ngày không hợp lệ';
  }
};
