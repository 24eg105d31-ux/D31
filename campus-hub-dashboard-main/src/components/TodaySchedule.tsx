import { useState, useEffect } from "react";
import { FlaskConical, Mic, Users, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = "http://localhost:3001/api";

interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  date: string;
  timeSlot: string;
  status: string;
}

const TodaySchedule = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchTodayBookings();
  }, [user]);

  const fetchTodayBookings = async () => {
    try {
      const response = await fetch(`${API_URL}/bookings`);
      const data = await response.json();
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      
      // Filter bookings for today and approved status
      const todayBookings = data.filter(
        (b: Booking) => b.date === today && b.status === "approved"
      );
      
      // Sort by time slot
      todayBookings.sort((a: Booking, b: Booking) => 
        a.timeSlot.localeCompare(b.timeSlot)
      );
      
      setBookings(todayBookings);
    } catch (error) {
      console.error("Error fetching today's bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIconAndColor = (type: string) => {
    switch (type) {
      case "lab":
        return { icon: FlaskConical, color: "text-success" };
      case "hall":
      case "auditorium":
        return { icon: Users, color: "text-destructive" };
      default:
        return { icon: Mic, color: "text-accent" };
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case "lab":
        return "Lab Session";
      case "classroom":
        return "Lecture";
      case "hall":
      case "auditorium":
        return "Event";
      default:
        return "Booking";
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-5 shadow-sm h-full">
        <h2 className="text-lg font-bold text-card-foreground mb-4">Today's Schedule</h2>
        <div className="flex items-center justify-center h-32">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-5 shadow-sm h-full">
      <h2 className="text-lg font-bold text-card-foreground mb-4">Today's Schedule</h2>
      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
          <Calendar className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No bookings for today</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {bookings.map((booking) => {
            const { icon: Icon, color } = getIconAndColor(booking.resourceType);
            return (
              <div key={booking.id} className="flex items-center gap-3 py-3 first:pt-0">
                <div className={`w-8 h-8 rounded-full bg-secondary flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-card-foreground">
                    {getResourceTypeLabel(booking.resourceType)} - {booking.resourceName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {booking.timeSlot}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TodaySchedule;
