import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import TopNav from "@/components/TopNav";
import { 
  Check, X, Clock, Calendar, User, DoorOpen, LayoutGrid, 
  Wrench, AlertCircle, CheckCircle, Activity, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  date: string;
  timeSlot: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  building: string;
}

interface MaintenanceRequest {
  id: string;
  resourceId: string;
  resourceName: string;
  issue: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "pending" | "in-progress" | "completed";
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  timestamp: string;
}

type AdminTab = "dashboard" | "bookings" | "resources" | "maintenance";

const Admin = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  // Check if user is admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen admin-bg admin-theme flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
          <p className="text-gray-400 mt-2">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, resourcesRes, maintenanceRes] = await Promise.all([
        fetch("http://localhost:3001/api/bookings"),
        fetch("http://localhost:3001/api/resources"),
        fetch("http://localhost:3001/api/maintenance")
      ]);
      
      const bookingsData = await bookingsRes.json();
      const resourcesData = await resourcesRes.json();
      const maintenanceData = await maintenanceRes.json();

      // Add role header for backend
      const headers = {
        'Content-Type': 'application/json',
        'x-user-role': user.role
      };
      
      setBookings(bookingsData);
      setResources(resourcesData);
      setMaintenanceRequests(maintenanceData);
      
      // Generate initial activity log from bookings
      const initialActivities: ActivityLog[] = bookingsData.slice(0, 5).map((b: Booking) => ({
        id: b.id,
        action: b.status,
        description: `Booking request for ${b.resourceName}`,
        timestamp: b.createdAt
      }));
      setActivities(initialActivities);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addActivity = (action: string, description: string) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      action,
      description,
      timestamp: new Date().toISOString()
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 10));
  };

  const handleApprove = async (bookingId: string) => {
    setApproving(bookingId);
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/approve`, {
        method: "PATCH"
      });
      if (response.ok) {
        const booking = bookings.find(b => b.id === bookingId);
        setBookings(bookings.filter(b => b.id !== bookingId));
        addActivity("approved", `Approved booking for ${booking?.resourceName}`);
      }
    } catch (error) {
      console.error("Error approving booking:", error);
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setRejecting(bookingId);
    try {
      const response = await fetch(`http://localhost:3001/api/bookings/${bookingId}/reject`, {
        method: "PATCH"
      });
      if (response.ok) {
        const booking = bookings.find(b => b.id === bookingId);
        setBookings(bookings.filter(b => b.id !== bookingId));
        addActivity("rejected", `Rejected booking for ${booking?.resourceName}`);
      }
    } catch (error) {
      console.error("Error rejecting booking:", error);
    } finally {
      setRejecting(null);
    }
  };

  const handleResolveMaintenance = async (requestId: string) => {
    setResolving(requestId);
    try {
      const response = await fetch(`http://localhost:3001/api/maintenance/${requestId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" })
      });
      if (response.ok) {
        const request = maintenanceRequests.find(r => r.id === requestId);
        setMaintenanceRequests(maintenanceRequests.map(r => 
          r.id === requestId ? { ...r, status: "completed" } : r
        ));
        addActivity("resolved", `Resolved maintenance for ${request?.resourceName}`);
      }
    } catch (error) {
      console.error("Error resolving maintenance:", error);
    } finally {
      setResolving(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "approved": 
      case "available": return "bg-green-500";
      case "rejected": 
      case "occupied": return "bg-red-500";
      case "in-progress": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "booked": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case "lab": return "Lab";
      case "classroom": return "Classroom";
      case "hall": return "Seminar Hall";
      case "auditorium": return "Auditorium";
      default: return type;
    }
  };

  // Statistics
  const stats = {
    totalResources: resources.length,
    pendingRequests: bookings.filter(b => b.status === "pending").length,
    approvedBookings: bookings.filter(b => b.status === "approved").length,
    rejectedBookings: bookings.filter(b => b.status === "rejected").length,
    maintenanceRequests: maintenanceRequests.filter(m => m.status !== "completed").length
  };

  const pendingBookings = bookings.filter(b => b.status === "pending");

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="admin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Total Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{stats.totalResources}</div>
          </CardContent>
        </Card>
        <Card className="admin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{stats.pendingRequests}</div>
          </CardContent>
        </Card>
        <Card className="admin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.approvedBookings}</div>
          </CardContent>
        </Card>
        <Card className="admin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <X className="w-4 h-4" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.rejectedBookings}</div>
          </CardContent>
        </Card>
        <Card className="admin-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">{stats.maintenanceRequests}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pending Requests */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Recent Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingBookings.length === 0 ? (
              <p className="text-gray-400">No pending requests</p>
            ) : (
              <div className="space-y-3">
                {pendingBookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="font-medium text-white">{booking.resourceName}</p>
                      <p className="text-sm text-gray-400">{booking.userName} • {formatDate(booking.date)}</p>
                    </div>
                    <button
                      onClick={() => handleApprove(booking.id)}
                      className="admin-action-approve px-3 py-1 rounded text-sm"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="admin-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-gray-400">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {activities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3">
                    {activity.action === "approved" && <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />}
                    {activity.action === "rejected" && <X className="w-4 h-4 text-red-500 mt-0.5" />}
                    {activity.action === "resolved" && <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />}
                    {activity.action === "pending" && <Clock className="w-4 h-4 text-amber-500 mt-0.5" />}
                    <div>
                      <p className="text-sm text-white">{activity.description}</p>
                      <p className="text-xs text-gray-500">{getTimeSince(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderBookings = () => (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="text-white">All Booking Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Request ID</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Resource</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Requested By</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-gray-300">#{booking.id.slice(-6)}</td>
                    <td className="py-3 px-4 text-white font-medium">{booking.resourceName}</td>
                    <td className="py-3 px-4 text-gray-300">{getResourceTypeLabel(booking.resourceType)}</td>
                    <td className="py-3 px-4 text-gray-300">{formatDate(booking.date)}</td>
                    <td className="py-3 px-4 text-gray-300">{booking.timeSlot}</td>
                    <td className="py-3 px-4 text-gray-300">{booking.userName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {booking.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(booking.id)}
                            disabled={approving === booking.id}
                            className="admin-action-approve px-3 py-1 rounded text-sm flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(booking.id)}
                            disabled={rejecting === booking.id}
                            className="admin-action-reject px-3 py-1 rounded text-sm flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {bookings.length === 0 && (
              <p className="text-center text-gray-400 py-8">No booking requests</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderResources = () => (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="text-white">Campus Resources</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Resource Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Building</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Capacity</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {resources.map(resource => (
                  <tr key={resource.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white font-medium">{resource.name}</td>
                    <td className="py-3 px-4 text-gray-300">{getResourceTypeLabel(resource.type)}</td>
                    <td className="py-3 px-4 text-gray-300">{resource.building}</td>
                    <td className="py-3 px-4 text-gray-300">{resource.capacity}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(resource.status)}`}>
                        {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderMaintenance = () => (
    <Card className="admin-card">
      <CardHeader>
        <CardTitle className="text-white">Maintenance Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : maintenanceRequests.length === 0 ? (
          <div className="text-center py-8">
            <Wrench className="w-12 h-12 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">No maintenance requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Resource</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Issue</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Reported By</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRequests.map(request => (
                  <tr key={request.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="py-3 px-4 text-white font-medium">{request.resourceName}</td>
                    <td className="py-3 px-4 text-gray-300">{request.issue}</td>
                    <td className="py-3 px-4 text-gray-300">{request.description || "-"}</td>
                    <td className="py-3 px-4 text-gray-300">{request.userName}</td>
                    <td className="py-3 px-4 text-gray-300">{formatDate(request.createdAt)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(request.status)}`}>
                        {request.status === "in-progress" ? "In Progress" : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {request.status !== "completed" && (
                        <button
                          onClick={() => handleResolveMaintenance(request.id)}
                          disabled={resolving === request.id}
                          className="admin-action-approve px-3 py-1 rounded text-sm flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen admin-bg admin-theme">
      <TopNav />

      {/* Admin Navigation */}
      <nav className="bg-gray-800/50 border-b border-gray-700 px-6 py-3">
        <div className="max-w-7xl mx-auto flex gap-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: Activity },
            { id: "bookings", label: "Bookings", icon: Calendar },
            { id: "resources", label: "Resources", icon: DoorOpen },
            { id: "maintenance", label: "Maintenance", icon: Wrench }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "bookings" && renderBookings()}
        {activeTab === "resources" && renderResources()}
        {activeTab === "maintenance" && renderMaintenance()}
        {activeTab === "maintenance" && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Open Requests (Pending + In Progress)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceRequests.filter(r => r.status !== "completed").slice(0, 6).map(request => (
                  <div key={request.id} className="flex items-center justify-between p-4 border-b border-gray-700/50 last:border-b-0">
                    <div>
                      <p className="font-medium text-white">{request.resourceName}</p>
                      <p className="text-sm text-gray-400">{request.issue}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolveMaintenance(request.id)}
                        disabled={resolving === request.id}
                        className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${resolving === request.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleResolveMaintenance(request.id)}
                        disabled={resolving === request.id}
                        className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${resolving === request.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="admin-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Recently Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceRequests.filter(r => r.status === "completed").slice(-4).map(request => (
                  <div key={request.id} className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{request.resourceName} - {request.issue}</p>
                      <p className="text-sm text-gray-400">{request.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(request.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
