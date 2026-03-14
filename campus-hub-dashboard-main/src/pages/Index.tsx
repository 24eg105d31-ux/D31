import { useState } from "react";
import TopNav from "@/components/TopNav";
import SubNav, { TabName } from "@/components/SubNav";
import LiveAvailability from "@/components/LiveAvailability";
import TodaySchedule from "@/components/TodaySchedule";
import Notifications from "@/components/Notifications";
import QuickActions from "@/components/QuickActions";
import ResourceUtilization from "@/components/ResourceUtilization";
import LabsPage from "./LabsPage";
import ClassroomsPage from "./ClassroomsPage";
import HallsPage from "./HallsPage";
import BookingsPage from "./BookingsPage";
import MaintenancePage from "./MaintenancePage";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission, UserRoles } from "@/utils/roleUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabName>("Dashboard");
  const { user } = useAuth();
  
  const userRole = user?.role || UserRoles.STUDENT;
  const isAdmin = userRole === UserRoles.ADMIN;
  const isFaculty = userRole === UserRoles.FACULTY;

  const renderContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return isAdmin ? renderAdminDashboard() : isFaculty ? renderFacultyDashboard() : renderStudentDashboard();
      case "Labs":
        return <LabsPage />;
      case "Classrooms":
        return <ClassroomsPage />;
      case "Halls":
        return <HallsPage />;
      case "Bookings":
        return <BookingsPage />;
      case "Maintenance":
        return <MaintenancePage />;
      case "AdminDashboard":
        return renderAdminDashboard();
      case "Department":
        return renderFacultyDashboard();
      default:
        return isAdmin ? renderAdminDashboard() : isFaculty ? renderFacultyDashboard() : renderStudentDashboard();
    }
  };

  // Student Dashboard - Simple view
  const renderStudentDashboard = () => {
    return (
      <>
        <LiveAvailability />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodaySchedule />
          </div>
          <div className="lg:col-span-1">
            <Notifications />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
          <div className="lg:col-span-2">
            <ResourceUtilization />
          </div>
        </div>
      </>
    );
  };

  // Faculty Dashboard - Shows department stats
  const renderFacultyDashboard = () => {
    return (
      <>
        {/* Faculty Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="faculty-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">My Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">5</div>
              <p className="text-xs text-gray-500 mt-1">Active bookings</p>
            </CardContent>
          </Card>
          <Card className="faculty-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Department Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">72%</div>
              <p className="text-xs text-gray-500 mt-1">Average usage</p>
            </CardContent>
          </Card>
          <Card className="faculty-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">2</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
            </CardContent>
          </Card>
        </div>

        {/* Faculty Content */}
        <LiveAvailability />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodaySchedule />
          </div>
          <div className="lg:col-span-1">
            <Notifications />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
          <div className="lg:col-span-2">
            <ResourceUtilization />
          </div>
        </div>
      </>
    );
  };

  // Admin Dashboard - Full access view
  const renderAdminDashboard = () => {
    return (
      <>
        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="admin-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">12</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card className="admin-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Approved Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">48</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
          <Card className="admin-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Rejected Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">5</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Dashboard Content */}
        <LiveAvailability />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodaySchedule />
          </div>
          <div className="lg:col-span-1">
            <Notifications />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
          <div className="lg:col-span-2">
            <ResourceUtilization />
          </div>
        </div>
      </>
    );
  };

  // Apply different classes based on role
  const containerClass = isAdmin 
    ? "min-h-screen admin-bg admin-theme" 
    : isFaculty
      ? "min-h-screen bg-background"
      : "min-h-screen bg-background";

  return (
    <div className={containerClass}>
      <TopNav />
      <SubNav 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
