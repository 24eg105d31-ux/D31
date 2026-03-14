// =============================================================================
// Booking Conflict Detection - Usage Examples
// =============================================================================

// Import the functions
import { checkBookingConflict, createBooking, getResourceBookingsForDate } from './bookingUtils.js';

// =============================================================================
// EXAMPLE 1: Basic usage - Check before saving
// =============================================================================

function handleCreateBooking(bookingData) {
  // Step 1: Check for conflicts
  const conflictCheck = checkBookingConflict(bookingData);

  if (conflictCheck.hasConflict) {
    // Conflict found - show error
    console.log('Error:', conflictCheck.error);
    console.log('Existing booking:', conflictCheck.conflictingBooking);
    return { success: false, error: conflictCheck.error };
  }

  // Step 2: No conflict - save booking
  const result = createBooking(bookingData);
  return result;
}

// Example call:
const newBooking = {
  resourceId: 'lab-101',
  resourceName: 'Lab 101',
  date: '2024-01-15',
  startTime: '9:00 AM',
  endTime: '10:00 AM',
  requestedBy: 'user-123'
};

const result = handleCreateBooking(newBooking);
console.log(result);


// =============================================================================
// EXAMPLE 2: React Component Usage
// =============================================================================

/*
In your React component:

import { checkBookingConflict, createBooking } from './utils/bookingUtils';

function BookingForm() {
  const [error, setError] = useState(null);

  async function handleSubmit(bookingData) {
    setError(null);

    // Check for conflicts
    const conflictCheck = checkBookingConflict(bookingData);

    if (conflictCheck.hasConflict) {
      setError(conflictCheck.error);
      return;
    }

    // Create booking
    const result = createBooking(bookingData);
    
    if (!result.success) {
      setError(result.error);
    }
  }

  return (
    <form>
      {error && <div className="error">{error}</div>}
      <button onClick={() => handleSubmit(yourData)}>Book</button>
    </form>
  );
}
*/

// =============================================================================
// EXAMPLE 3: Vanilla JS with Error Display
// =============================================================================

/*
HTML:
<div id="message"></div>
<button id="book-btn">Create Booking</button>

JS:
document.getElementById('book-btn').addEventListener('click', function() {
  const booking = {
    resourceId: 'lab-101',
    resourceName: 'Lab 101', 
    date: '2024-01-15',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    requestedBy: 'user-1'
  };

  const result = checkBookingConflict(booking);
  
  const msgDiv = document.getElementById('message');
  
  if (result.hasConflict) {
    msgDiv.textContent = 'This resource is already booked for the selected time.';
    msgDiv.className = 'error';
  } else {
    const saveResult = createBooking(booking);
    if (saveResult.success) {
      msgDiv.textContent = 'Booking created!';
      msgDiv.className = 'success';
    }
  }
});
*/

// =============================================================================
// EXAMPLE 4: Time Overlap Formula
// =============================================================================

/*
The overlap check uses this formula:
  (newStart < existingEnd) AND (newEnd > existingStart)

Examples:
- 9:00-10:00 overlaps with 9:30-10:30 ✓
- 9:00-10:00 overlaps with 10:00-11:00 ✗ (touching, not overlapping)
- 9:00-11:00 overlaps with 9:30-10:30 ✓ (contained)
*/

export {};

