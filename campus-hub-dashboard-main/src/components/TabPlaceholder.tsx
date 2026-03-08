import { TabName } from "@/components/SubNav";

interface TabPlaceholderProps {
  tab: TabName;
}

const descriptions: Record<string, string> = {
  Labs: "View and manage all campus laboratories, equipment, and availability.",
  Classrooms: "Browse classroom schedules, capacity, and booking status.",
  Halls: "Manage seminar halls and conference room reservations.",
  Bookings: "View all your current and past resource bookings.",
  Maintenance: "Submit and track maintenance requests for campus facilities.",
};

const TabPlaceholder = ({ tab }: TabPlaceholderProps) => {
  return (
    <div className="bg-card rounded-lg p-8 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
      <h2 className="text-2xl font-bold text-card-foreground mb-2">{tab}</h2>
      <p className="text-muted-foreground max-w-md">{descriptions[tab]}</p>
      <p className="text-sm text-muted-foreground mt-4">This page is under construction.</p>
    </div>
  );
};

export default TabPlaceholder;
