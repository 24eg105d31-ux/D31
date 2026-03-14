import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, UserRoles } from "@/utils/roleUtils";

export type TabName = "Dashboard" | "Labs" | "Classrooms" | "Halls" | "Bookings" | "Maintenance" | "AdminDashboard" | "Department";

// Base tabs - visible to all authenticated users
export const studentTabs: TabName[] = ["Dashboard", "Labs", "Classrooms", "Halls", "Bookings"];

// Faculty tabs - adds Department view
export const facultyTabs: TabName[] = ["Dashboard", "Labs", "Classrooms", "Halls", "Bookings", "Department", "Maintenance"];

// Admin tabs - adds Admin Dashboard
export const adminTabs: TabName[] = ["Dashboard", "Labs", "Classrooms", "Halls", "Bookings", "Maintenance", "AdminDashboard"];

interface SubNavProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const SubNav = ({ activeTab, onTabChange }: SubNavProps) => {
  const { user } = useAuth();
  const userRole = user?.role || UserRoles.STUDENT;
  
  // Get visible tabs based on role
  const visibleTabs = hasPermission(userRole, 'canViewAdminPanel') 
    ? adminTabs 
    : hasPermission(userRole, 'canViewDepartmentUtilization')
      ? facultyTabs
      : studentTabs;
  
  // Don't render if no tabs
  if (visibleTabs.length === 0) {
    return null;
  }
  
  return (
    <nav className="bg-subnav border-b border-border px-6 py-2 flex gap-1">
      {visibleTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 rounded text-sm font-medium transition-all duration-150 ${
            activeTab === tab
              ? "bg-subnav-active text-subnav-active-foreground"
              : "text-subnav-foreground hover:bg-muted active:bg-muted/80"
          }`}
        >
          {tab === "AdminDashboard" ? "Admin Dashboard" : tab === "Department" ? "Department Stats" : tab}
        </button>
      ))}
    </nav>
  );
};

export default SubNav;
