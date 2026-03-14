// =============================================================================
// Booking Conflict Detection Utility
// =============================================================================
// Simple vanilla JavaScript solution for detecting booking time overlaps
// Uses localStorage for storing bookings
// =============================================================================

const BOOKINGS_STORAGE_KEY = 'crms_bookings';

/**
 * Get all bookings from localStorage
 * @returns {Array} Array of booking objects
 */
function getAllBookings() {
  const bookingsJson = localStorage.getItem(BOOKINGS_STORAGE_KEY);
  if (!bookingsJson) {
    return [];
  }
  try {
    return JSON.parse(bookingsJson);
  } catch (error) {
    console.error('Error parsing bookings from localStorage:', error);
    return [];
  }
}

/**
 * Save all bookings to localStorage
 * @param {Array} bookings - Array of booking objects
 */
function saveBookings(bookings) {
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
}

/**
 * Convert time string (e.g., "9:00 AM") to minutes since midnight
 * @param {string} timeString - Time string like "9:00 AM" or "14:30"
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeString) {
  if (!timeString) return 0;
  
  // Handle 12-hour format (e.g., "9:00 AM", "12:30 PM")
  const isPM = timeString.toLowerCase().includes('pm');
  const isAM = timeString.toLowerCase().includes('am');
  
  // Extract hours and minutes
  let [timePart] = timeString.split(':');
  let hours = parseInt(timePart, 10);
  let minutes = 0;
  
  // Check if there's minutes part
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    if (parts[1]) {
      const minPart = parts[1].replace(/\D/g, ''); // Remove non-digits
      minutes = parseInt(minPart, 10);
    }
  }
  
  // Convert to 24-hour format
  if (isPM && hours !== 12) {
    hours += 12;
  }
  if (isAM && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 * Overlap occurs when: (newStart < existingEnd) AND (newEnd > existingStart)
 * 
 * @param {string} newStart - Start time of new booking
 * @param {string} newEnd - End time of new booking  
 * @param {string} existingStart - Start time of existing booking
 * @param {string} existingEnd - End time of existing booking
 * @returns {boolean} True if times overlap
 */
function doTimesOverlap(newStart, newEnd, existingStart, existingEnd) {
  const newStartMins = timeToMinutes(newStart);
  const newEndMins = timeToMinutes(newEnd);
  const existingStartMins = timeToMinutes(existingStart);
  const existingEndMins = timeToMinutes(existingEnd);
  
  // Overlap formula: (newStart < existingEnd) AND (newEnd > existingStart)
  return (newStartMins < existingEndMins) && (newEndMins > existingStartMins);
}

/**
 * Check if a new booking conflicts with existing bookings
 * 
 * @param {Object} newBooking - The new booking to check
 * @param {string} newBooking.resourceId - Resource identifier
 * @param {string} newBooking.date - Booking date (YYYY-MM-DD)
 * @param {string} newBooking.startTime - Start time (e.g., "9:00 AM")
 * @param {string} newBooking.endTime - End time (e.g., "10:00 AM")
 * @param {string} newBooking.requestedBy - User ID making the request
 * @returns {Object} Result object with conflict status and details
 */
function checkBookingConflict(newBooking) {
  const { resourceId, date, startTime, endTime, requestedBy } = newBooking;
  
  // Validate required fields
  if (!resourceId || !date || !startTime || !endTime) {
    return {
      hasConflict: true,
      error: 'Missing required booking fields',
      conflictingBooking: null
    };
  }
  
  // Get all existing bookings
  const existingBookings = getAllBookings();
  
  // Find conflicting bookings for the same resource, date, and overlapping time
  // Only consider pending or approved bookings (not rejected)
  const conflictingBooking = existingBookings.find(booking => {
    // Must be same resource
    if (booking.resourceId !== resourceId) return false;
    
    // Must be same date
    if (booking.date !== date) return false;
    
    // Must be pending or approved (not rejected)
    if (booking.status === 'rejected') return false;
    
    // Check time overlap
    return doTimesOverlap(
      startTime, 
      endTime, 
      booking.startTime, 
      booking.endTime
    );
  });
  
  // Return result
  if (conflictingBooking) {
    return {
      hasConflict: true,
      error: 'This resource is already booked for the selected time.',
      conflictingBooking: {
        id: conflictingBooking.id,
        resourceId: conflictingBooking.resourceId,
        resourceName: conflictingBooking.resourceName,
        date: conflictingBooking.date,
        startTime: conflictingBooking.startTime,
        endTime: conflictingBooking.endTime,
        requestedBy: conflictingBooking.requestedBy,
        status: conflictingBooking.status
      }
    };
  }
  
  return {
    hasConflict: false,
    error: null,
    conflictingBooking: null
  };
}

/**
 * Save a new booking after conflict check
 * 
 * @param {Object} booking - The booking to save
 * @returns {Object} Result with success status
 */
function createBooking(booking) {
  // Check for conflicts first
  const conflictCheck = checkBookingConflict(booking);
  
  if (conflictCheck.hasConflict) {
    return {
      success: false,
      error: conflictCheck.error,
      conflictingBooking: conflictCheck.conflictingBooking
    };
  }
  
  // Generate unique ID
  const newBooking = {
    id: 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    ...booking,
    status: 'pending', // Default status
    createdAt: new Date().toISOString()
  };
  
  // Get existing bookings and add new one
  const bookings = getAllBookings();
  bookings.push(newBooking);
  saveBookings(bookings);
  
  return {
    success: true,
    booking: newBooking,
    error: null
  };
}

/**
 * Update booking status (approve/reject)
 * 
 * @param {string} bookingId - ID of booking to update
 * @param {string} newStatus - New status ('pending', 'approved', 'rejected')
 * @returns {Object} Result
 */
function updateBookingStatus(bookingId, newStatus) {
  const bookings = getAllBookings();
  const bookingIndex = bookings.findIndex(b => b.id === bookingId);
  
  if (bookingIndex === -1) {
    return {
      success: false,
      error: 'Booking not found'
    };
  }
  
  bookings[bookingIndex].status = newStatus;
  bookings[bookingIndex].updatedAt = new Date().toISOString();
  
  saveBookings(bookings);
  
  return {
    success: true,
    booking: bookings[bookingIndex]
  };
}

/**
 * Get bookings for a specific resource on a specific date
 * 
 * @param {string} resourceId - Resource ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Array} Array of bookings
 */
function getResourceBookingsForDate(resourceId, date) {
  const bookings = getAllBookings();
  return bookings.filter(
    b => b.resourceId === resourceId && 
         b.date === date && 
         b.status !== 'rejected'
  );
}

// =============================================================================
// Export functions for use in other files
// =============================================================================
export {
  getAllBookings,
  saveBookings,
  checkBookingConflict,
  createBooking,
  updateBookingStatus,
  getResourceBookingsForDate,
  timeToMinutes,
  doTimesOverlap
};

// Also expose globally for simple usage
if (typeof window !== 'undefined') {
  window.BookingUtils = {
    getAllBookings,
    saveBookings,
    checkBookingConflict,
    createBooking,
    updateBookingStatus,
    getResourceBookingsForDate,
    timeToMinutes,
    doTimesOverlap
  };
}

