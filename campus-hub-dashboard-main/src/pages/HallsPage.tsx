import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";

interface Hall {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
  building: string;
}

const timeSlots = [
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
];

const HallsPage = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedHall, setSelectedHall] = useState<Hall | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/resources?type=hall");
      const hallsData = await response.json();
      
      const auditoriumResponse = await fetch("http://localhost:3001/api/resources?type=auditorium");
      const auditoriumData = await auditoriumResponse.json();
      
      setHalls([...hallsData, ...auditoriumData]);
    } catch (error) {
      console.error("Error fetching halls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedHall || !selectedDate || !selectedTimeSlot || !user) return;

    try {
      const response = await fetch("http://localhost:3001/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedHall.id,
          resourceName: selectedHall.name,
          resourceType: selectedHall.type,
          date: selectedDate.toISOString().split("T")[0],
          timeSlot: selectedTimeSlot,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
        }),
      });

      if (response.ok) {
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingDialogOpen(false);
          setBookingSuccess(false);
          setSelectedHall(null);
          setSelectedDate(undefined);
          setSelectedTimeSlot("");
        }, 2000);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "booked":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "hall":
        return "Seminar Hall";
      case "auditorium":
        return "Auditorium";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading halls...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Halls & Auditoriums</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "Manage seminar halls and conference room reservations" 
            : "Book seminar halls and conference rooms"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {halls.map((hall) => (
          <Card 
            key={hall.id} 
            className={isAdmin ? "hover:shadow-lg transition-shadow admin-card" : "hover:shadow-lg transition-shadow"}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{hall.name}</CardTitle>
                  <span className="text-sm text-muted-foreground">{getTypeLabel(hall.type)}</span>
                </div>
                <Badge className={getStatusColor(hall.status)}>
                  {hall.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Building:</span>
                  <span>{hall.building}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span>{hall.capacity} seats</span>
                </div>
                <Button
                  className={`w-full mt-4 ${isAdmin ? "admin-action-approve" : "user-action-book"}`}
                  onClick={() => {
                    setSelectedHall(hall);
                    setBookingDialogOpen(true);
                  }}
                  disabled={hall.status !== "available"}
                >
                  {isAdmin ? "Manage Booking" : (hall.status === "available" ? "Request Booking" : "Not Available")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAdmin ? `Manage ${selectedHall?.name}` : `Book ${selectedHall?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border mt-2"
                disabled={(date) => date < new Date()}
              />
            </div>
            <div>
              <Label>Select Time Slot</Label>
              <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleBooking} 
              className={`w-full ${isAdmin ? "admin-action-approve" : "user-action-book"}`}
              disabled={!selectedDate || !selectedTimeSlot}
            >
              {bookingSuccess 
                ? (isAdmin ? "Booking Approved!" : "Booking Confirmed!") 
                : (isAdmin ? "Approve Booking" : "Confirm Booking")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HallsPage;
