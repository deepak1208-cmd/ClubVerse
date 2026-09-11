/**
 * ClubVerse Time Formatting Utilities
 * Converts database TIME format (e.g., "14:30:00") to 12-hour format (e.g., "2:30 PM")
 */

/**
 * Format a time string from 24-hour to 12-hour format
 * @param {string} timeString - Time in HH:MM:SS or HH:MM format (e.g., "14:30:00")
 * @returns {string|null} - Formatted time (e.g., "2:30 PM") or null if invalid
 */
export const formatTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  
  // Handle both "HH:MM:SS" and "HH:MM" formats
  const parts = timeString.split(':');
  if (parts.length < 2) return null;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  
  if (isNaN(hours) || isNaN(parseInt(minutes, 10))) return null;
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  
  // Remove leading zero from minutes if present (e.g., "05" -> "5")
  const minutesNum = parseInt(minutes, 10);
  
  return `${hour12}:${minutesNum.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Format a date string to a readable format (e.g., "17 Sept 2025")
 * @param {string} dateString - Date in ISO format (e.g., "2025-09-17")
 * @returns {string} - Formatted date (e.g., "17 Sept 2025")
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format event date and time together with fallback support
 * @param {string} dateString - Event date (e.g., "2025-09-17")
 * @param {string} startTime - Start time (e.g., "10:00:00")
 * @param {string} endTime - End time (e.g., "12:00:00")
 * @returns {string} - Formatted datetime (e.g., "17 Sept 2025 • 10:00 AM - 12:00 PM")
 */
export const formatEventDateTime = (dateString, startTime, endTime) => {
  const dateStr = formatDate(dateString);
  if (!dateStr) return '';
  
  const startStr = formatTime(startTime);
  const endStr = formatTime(endTime);
  
  // If no times provided, just show the date
  if (!startStr && !endStr) {
    return dateStr;
  }
  
  // Build time range string
  let timeRange = '';
  if (startStr && endStr) {
    timeRange = `${startStr} - ${endStr}`;
  } else if (startStr) {
    timeRange = startStr;
  } else {
    timeRange = endStr;
  }
  
  return `${dateStr} • ${timeRange}`;
};
