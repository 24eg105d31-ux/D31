import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

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
  status: string;
  createdAt: string;
}

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/bookings");
      const data = await response.json();
      
      // Filter bookings for the current user
      const userBookings = user ? data.filter((b: Booking) => b.userId === user.id) : data;
      setBookings(userBookings.reverse());
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getResourceTypeLabel = (type: string) => {
    switch (type) {
      case "lab":
        return "Lab";
      case "classroom":
        return "Classroom";
      case "hall":
        return "Seminar Hall";
      case "auditorium":
        return "Auditorium";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-muted-foreground">View all your current and past resource bookings</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No bookings yet. Book a lab, classroom, or hall to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{booking.resourceName}</CardTitle>
                    <span className="text-sm text-muted-foreground">{getResourceTypeLabel(booking.resourceType)}</span>
                  </div>
                  <Badge className={getStatusColor(booking.status)}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium">{formatDate(booking.date)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Time:</span>
                    <p className="font-medium">{booking.timeSlot}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Booked On:</span>
                    <p className="font-medium">{formatDate(booking.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium">
                      {booking.status === "pending" && "Awaiting approval"}
                      {booking.status === "approved" && "Confirmed"}
                      {booking.status === "rejected" && "Not approved"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
