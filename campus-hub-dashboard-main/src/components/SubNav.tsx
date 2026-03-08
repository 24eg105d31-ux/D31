export type TabName = "Dashboard" | "Labs" | "Classrooms" | "Halls" | "Bookings" | "Maintenance" | "AdminDashboard";

export const tabs: TabName[] = ["Dashboard", "Labs", "Classrooms", "Halls", "Bookings", "Maintenance"];

export const adminTabs: TabName[] = ["Dashboard", "Labs", "Classrooms", "Halls", "Bookings", "Maintenance", "AdminDashboard"];

interface SubNavProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  isAdmin?: boolean;
}

const SubNav = ({ activeTab, onTabChange, isAdmin = false }: SubNavProps) => {
  const visibleTabs = isAdmin ? adminTabs : tabs;
  
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
          {tab === "AdminDashboard" ? "Admin Dashboard" : tab}
        </button>
      ))}
    </nav>
  );
};

export default SubNav;
