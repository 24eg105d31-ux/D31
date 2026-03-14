import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { StatusBadge } from "@/utils/statusUtils";

interface Classroom {
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

const ClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/resources?type=classroom");
      const data = await response.json();
      setClassrooms(data);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedClassroom || !selectedDate || !selectedTimeSlot || !user) return;

    // First check if slot is available
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      const checkResponse = await fetch(
        `http://localhost:3001/api/bookings/check?resourceId=${selectedClassroom.id}&date=${dateStr}&timeSlot=${encodeURIComponent(selectedTimeSlot)}`
      );
      const checkData = await checkResponse.json();
      
      if (!checkData.available) {
        alert(`This time slot is already booked by ${checkData.existingBooking?.userName || 'another user'}. Please choose a different time or date.`);
        return;
      }
    } catch (error) {
      console.error("Error checking availability:", error);
      // Continue with booking attempt - server will validate
    }

    try {
      const response = await fetch("http://localhost:3001/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedClassroom.id,
          resourceName: selectedClassroom.name,
          resourceType: "classroom",
          date: selectedDate.toISOString().split("T")[0],
          timeSlot: selectedTimeSlot,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingDialogOpen(false);
          setBookingSuccess(false);
          setSelectedClassroom(null);
          setSelectedDate(undefined);
          setSelectedTimeSlot("");
        }, 2000);
      } else {
        alert(data.error || "Failed to create booking. Please try again.");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading classrooms...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Classrooms</h1>
        <p className="text-muted-foreground">
          {isAdmin 
            ? "View and manage classroom schedules, capacity, and booking status" 
            : "Browse classroom schedules, capacity, and booking status"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((classroom) => (
          <Card 
            key={classroom.id} 
            className={isAdmin ? "hover:shadow-lg transition-shadow admin-card" : "hover:shadow-lg transition-shadow"}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{classroom.name}</CardTitle>
                <StatusBadge status={classroom.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Building:</span>
                  <span>{classroom.building}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span>{classroom.capacity} students</span>
                </div>
                <Button
                  className={`w-full mt-4 ${isAdmin ? "admin-action-approve" : "user-action-book"}`}
                  onClick={() => {
                    setSelectedClassroom(classroom);
                    setBookingDialogOpen(true);
                  }}
                  disabled={classroom.status !== "available"}
                >
                  {isAdmin ? "Manage Booking" : (classroom.status === "available" ? "Request Booking" : "Not Available")}
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
              {isAdmin ? `Manage ${selectedClassroom?.name}` : `Book ${selectedClassroom?.name}`}
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

export default ClassroomsPage;
