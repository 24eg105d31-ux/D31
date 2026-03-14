// =============================================================================
// Role-Based Access Control (RBAC) Utilities
// =============================================================================
// Simple role-based UI control for CRMS application
// =============================================================================

// Define user roles
export const UserRoles = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin'
};

// Define permissions for each role
export const RolePermissions = {
  // Dashboard access
  [UserRoles.STUDENT]: {
    canViewDashboard: true,
    canViewMyBookings: true,
    canViewDepartmentUtilization: false,
    canViewSystemReports: false,
    canViewAdminPanel: false,
    
    // Resource access
    canViewResources: true,
    canManageResources: false,
    
    // Booking access
    canCreateBooking: true,
    canViewAllBookings: false,
    canApproveBookings: false,
    canRejectBookings: false,
    
    // Maintenance access
    canCreateMaintenanceRequest: true,
    canViewAllMaintenance: false,
    canManageMaintenance: false
  },
  
  [UserRoles.FACULTY]: {
    canViewDashboard: true,
    canViewMyBookings: true,
    canViewDepartmentUtilization: true,
    canViewSystemReports: false,
    canViewAdminPanel: false,
    
    // Resource access
    canViewResources: true,
    canManageResources: false,
    
    // Booking access
    canCreateBooking: true,
    canViewAllBookings: false,
    canApproveBookings: false,
    canRejectBookings: false,
    
    // Maintenance access
    canCreateMaintenanceRequest: true,
    canViewAllMaintenance: false,
    canManageMaintenance: false
  },
  
  [UserRoles.ADMIN]: {
    canViewDashboard: true,
    canViewMyBookings: true,
    canViewDepartmentUtilization: true,
    canViewSystemReports: true,
    canViewAdminPanel: true,
    
    // Resource access
    canViewResources: true,
    canManageResources: true,
    
    // Booking access
    canCreateBooking: true,
    canViewAllBookings: true,
    canApproveBookings: true,
    canRejectBookings: true,
    
    // Maintenance access
    canCreateMaintenanceRequest: true,
    canViewAllMaintenance: true,
    canManageMaintenance: true
  }
};

// Navigation items with role restrictions
export const NavigationConfig = {
  // Items visible to Students
  student: [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'home' },
    { id: 'labs', label: 'Labs', path: '/labs', icon: 'flask' },
    { id: 'classrooms', label: 'Classrooms', path: '/classrooms', icon: 'school' },
    { id: 'halls', label: 'Halls', path: '/halls', icon: 'building' },
    { id: 'my-bookings', label: 'My Bookings', path: '/bookings', icon: 'calendar' },
    { id: 'maintenance', label: 'Maintenance', path: '/maintenance', icon: 'wrench' }
  ],
  
  // Items visible to Faculty (same as student + department)
  faculty: [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'home' },
    { id: 'labs', label: 'Labs', path: '/labs', icon: 'flask' },
    { id: 'classrooms', label: 'Classrooms', path: '/classrooms', icon: 'school' },
    { id: 'halls', label: 'Halls', path: '/halls', icon: 'building' },
    { id: 'my-bookings', label: 'My Bookings', path: '/bookings', icon: 'calendar' },
    { id: 'department', label: 'Department Stats', path: '/department', icon: 'chart' },
    { id: 'maintenance', label: 'Maintenance', path: '/maintenance', icon: 'wrench' }
  ],
  
  // Items visible to Admin (full access)
  admin: [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'home' },
    { id: 'labs', label: 'Labs', path: '/labs', icon: 'flask' },
    { id: 'classrooms', label: 'Classrooms', path: '/classrooms', icon: 'school' },
    { id: 'halls', label: 'Halls', path: '/halls', icon: 'building' },
    { id: 'my-bookings', label: 'My Bookings', path: '/bookings', icon: 'calendar' },
    { id: 'admin', label: 'Admin Panel', path: '/admin', icon: 'settings' },
    { id: 'maintenance', label: 'Maintenance', path: '/maintenance', icon: 'wrench' }
  ]
};

/**
 * Check if a user has a specific permission
 * @param {string} role - User role ('student', 'faculty', 'admin')
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export function hasPermission(role, permission) {
  const permissions = RolePermissions[role];
  if (!permissions) {
    return false;
  }
  return permissions[permission] === true;
}

/**
 * Get navigation items for a specific role
 * @param {string} role - User role
 * @returns {Array} Array of navigation items
 */
export function getNavigationItems(role) {
  return NavigationConfig[role] || NavigationConfig[UserRoles.STUDENT];
}

/**
 * Check if user is admin
 * @param {string} role 
 * @returns {boolean}
 */
export function isAdmin(role) {
  return role === UserRoles.ADMIN;
}

/**
 * Check if user is faculty
 * @param {string} role 
 * @returns {boolean}
 */
export function isFaculty(role) {
  return role === UserRoles.FACULTY;
}

/**
 * Check if user is student
 * @param {string} role 
 * @returns {boolean}
 */
export function isStudent(role) {
  return role === UserRoles.STUDENT;
}

/**
 * Get role display name
 * @param {string} role 
 * @returns {string}
 */
export function getRoleDisplayName(role) {
  const names = {
    [UserRoles.STUDENT]: 'Student',
    [UserRoles.FACULTY]: 'Faculty',
    [UserRoles.ADMIN]: 'Administrator'
  };
  return names[role] || 'User';
}

