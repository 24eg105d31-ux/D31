// =============================================================================
// Status Badge Utilities for CRMS
// =============================================================================
// Color-coded status indicators for resources and bookings
// =============================================================================

/**
 * Status type definitions
 */
export const StatusTypes = {
  // Resource statuses
  AVAILABLE: 'available',
  BUSY: 'busy',
  OCCUPIED: 'occupied',
  BOOKED: 'booked',
  MAINTENANCE: 'maintenance',
  
  // Booking statuses
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  
  // Maintenance statuses
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  
  // Error states
  CONFLICT: 'conflict',
  INVALID: 'invalid',
  OUTSIDE_HOURS: 'outside-hours'
};

/**
 * Get badge class based on status
 * @param {string} status - The status value
 * @returns {string} CSS class for the badge
 */
export function getStatusBadgeClass(status: string): string {
  if (!status) return 'badge-unknown';
  
  const statusLower = status.toLowerCase();
  
  // Green badges - Available/Approved/Success
  if (
    statusLower === StatusTypes.AVAILABLE ||
    statusLower === StatusTypes.APPROVED ||
    statusLower === StatusTypes.CONFIRMED ||
    statusLower === 'success' ||
    statusLower === 'completed'
  ) {
    return 'badge-available';
  }
  
  // Orange badges - Busy/Pending/Moderate
  if (
    statusLower === StatusTypes.BUSY ||
    statusLower === StatusTypes.OCCUPIED ||
    statusLower === StatusTypes.BOOKED ||
    statusLower === StatusTypes.PENDING ||
    statusLower === StatusTypes.IN_PROGRESS ||
    statusLower === 'moderate' ||
    statusLower === 'high'
  ) {
    return 'badge-busy';
  }
  
  // Red badges - Maintenance/Rejected/Error
  if (
    statusLower === StatusTypes.MAINTENANCE ||
    statusLower === StatusTypes.REJECTED ||
    statusLower === StatusTypes.CANCELLED ||
    statusLower === StatusTypes.CONFLICT ||
    statusLower === StatusTypes.INVALID ||
    statusLower === StatusTypes.OUTSIDE_HOURS ||
    statusLower === 'error' ||
    statusLower === 'failed'
  ) {
    return 'badge-maintenance';
  }
  
  return 'badge-unknown';
}

/**
 * Get status display label
 * @param {string} status - The status value
 * @returns {string} Human-readable label
 */
export function getStatusLabel(status: string): string {
  if (!status) return 'Unknown';
  
  const statusLower = status.toLowerCase();
  
  const labels: Record<string, string> = {
    [StatusTypes.AVAILABLE]: 'Available',
    [StatusTypes.BUSY]: 'Busy',
    [StatusTypes.OCCUPIED]: 'Occupied',
    [StatusTypes.BOOKED]: 'Booked',
    [StatusTypes.MAINTENANCE]: 'Under Maintenance',
    [StatusTypes.PENDING]: 'Pending',
    [StatusTypes.APPROVED]: 'Approved',
    [StatusTypes.REJECTED]: 'Rejected',
    [StatusTypes.CONFIRMED]: 'Confirmed',
    [StatusTypes.CANCELLED]: 'Cancelled',
    [StatusTypes.IN_PROGRESS]: 'In Progress',
    [StatusTypes.COMPLETED]: 'Completed',
    [StatusTypes.CONFLICT]: 'Conflict Detected',
    [StatusTypes.INVALID]: 'Invalid',
    [StatusTypes.OUTSIDE_HOURS]: 'Outside Hours'
  };
  
  return labels[statusLower] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Render a status badge component
 * @param {string} status - The status value
 * @param {string} customLabel - Optional custom label
 * @returns {JSX.Element} Badge element
 */
export function StatusBadge({ status, customLabel }: { status: string; customLabel?: string }) {
  const badgeClass = getStatusBadgeClass(status);
  const label = customLabel || getStatusLabel(status);
  
  return (
    <span className={`status-badge ${badgeClass}`}>
      {label}
    </span>
  );
}

