import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = "http://localhost:3001/api";

interface Notification {
  id: string;
  type: "booking" | "maintenance";
  resourceName: string;
  status: string;
  message: string;
  createdAt: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      // Fetch bookings and maintenance requests
      const [bookingsRes, maintenanceRes] = await Promise.all([
        fetch(`${API_URL}/bookings`),
        fetch(`${API_URL}/maintenance`),
      ]);

      const bookings = await bookingsRes.json();
      const maintenance = await maintenanceRes.json();

      const allNotifications: Notification[] = [];

      // Process bookings - get recent bookings for current user
      bookings
        .filter((b: any) => b.userId === user?.id)
        .slice(0, 5)
        .forEach((b: any) => {
          allNotifications.push({
            id: `booking-${b.id}`,
            type: "booking",
            resourceName: b.resourceName,
            status: b.status,
            message: getBookingMessage(b.status, b.resourceName),
            createdAt: b.createdAt,
          });
        });

      // Process maintenance requests - get recent for current user
      maintenance
        .filter((m: any) => m.userId === user?.id)
        .slice(0, 5)
        .forEach((m: any) => {
          allNotifications.push({
            id: `maintenance-${m.id}`,
            type: "maintenance",
            resourceName: m.resourceName,
            status: m.status,
            message: getMaintenanceMessage(m.status, m.issue),
            createdAt: m.createdAt,
          });
        });

      // Sort by created date (newest first)
      allNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setNotifications(allNotifications.slice(0, 10));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingMessage = (status: string, resourceName: string) => {
    switch (status) {
      case "approved":
        return `${resourceName} booking approved`;
      case "rejected":
        return `${resourceName} booking rejected`;
      default:
        return `${resourceName} booking pending approval`;
    }
  };

  const getMaintenanceMessage = (status: string, issue: string) => {
    switch (status) {
      case "completed":
        return `${issue} maintenance completed`;
      case "in-progress":
        return `${issue} maintenance in progress`;
      default:
        return `${issue} request pending`;
    }
  };

  const getIconAndStyle = (notification: Notification) => {
    if (notification.type === "booking") {
      if (notification.status === "approved") {
        return { icon: CheckCircle2, iconClass: "text-success", bgClass: "bg-success/10" };
      } else if (notification.status === "rejected") {
        return { icon: XCircle, iconClass: "text-destructive", bgClass: "bg-destructive/10" };
      }
    } else if (notification.type === "maintenance") {
      if (notification.status === "completed") {
        return { icon: CheckCircle2, iconClass: "text-success", bgClass: "bg-success/10" };
      } else if (notification.status === "in-progress") {
        return { icon: AlertTriangle, iconClass: "text-warning", bgClass: "bg-warning/10" };
      }
    }
    return { icon: AlertTriangle, iconClass: "text-warning", bgClass: "bg-warning/10" };
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-5 shadow-sm h-full">
        <h2 className="text-lg font-bold text-card-foreground mb-4">Notifications</h2>
        <div className="flex items-center justify-center h-32">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-5 shadow-sm h-full">
      <h2 className="text-lg font-bold text-card-foreground mb-4">Notifications</h2>
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <Bell className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((notification) => {
            const { icon: Icon, iconClass, bgClass } = getIconAndStyle(notification);
            return (
              <div key={notification.id} className={`flex items-center gap-3 py-3 first:pt-0 px-3 rounded-md ${bgClass}`}>
                <Icon className={`w-5 h-5 shrink-0 ${iconClass}`} />
                <span className="text-sm text-card-foreground">{notification.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
