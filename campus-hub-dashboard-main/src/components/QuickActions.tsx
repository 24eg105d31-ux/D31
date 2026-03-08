import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:3001/api";

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

const resourceTypes = [
  { value: "lab", label: "Lab" },
  { value: "classroom", label: "Classroom" },
  { value: "hall", label: "Seminar Hall" },
  { value: "auditorium", label: "Auditorium" },
];

interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
}

const QuickActions = () => {
  const [open, setOpen] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourceType, setResourceType] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [date, setDate] = useState<Date>();
  const [timeSlot, setTimeSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (resourceType) {
      fetchResourcesByType(resourceType);
    }
  }, [resourceType]);

  const fetchResourcesByType = async (type: string) => {
    setLoadingResources(true);
    try {
      const response = await fetch(`${API_URL}/resources?type=${type}`);
      const data = await response.json();
      // Filter only available resources
      const available = data.filter((r: Resource) => r.status === "available");
      setResources(available);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "Please login to book a resource",
        variant: "destructive"
      });
      setOpen(false);
      navigate("/login");
      return;
    }

    if (!resourceType || !date || !timeSlot || !resourceId) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const selectedResource = resources.find(r => r.id === resourceId);
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resourceId: resourceId,
          resourceName: selectedResource?.name || resourceId,
          resourceType: resourceType,
          date: format(date, "yyyy-MM-dd"),
          timeSlot,
          userId: user.id,
          userName: user.name,
          userEmail: user.email
        }),
      });

      if (response.ok) {
        toast({
          title: "Booking Request Submitted!",
          description: `Your booking request for ${selectedResource?.name} on ${format(date, "PPP")} at ${timeSlot} has been submitted for approval.`,
        });
        // Reset form
        setResourceType("");
        setResourceId("");
        setDate(undefined);
        setTimeSlot("");
        setResources([]);
      } else {
        const data = await response.json();
        toast({
          title: "Booking Failed",
          description: data.error || "Failed to create booking",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
      setOpen(false);
    }
  };

  const handleMaintenanceRequest = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to submit a maintenance request",
        variant: "destructive"
      });
      navigate("/login");
      return;
    }
    // Navigate to maintenance page
    navigate("/maintenance");
    sonnerToast.success("Navigate to Maintenance to submit a request");
  };

  const getResourceTypeLabel = (value: string) => {
    const found = resourceTypes.find(r => r.value === value);
    return found ? found.label : value;
  };

  return (
    <div className="bg-card rounded-lg p-5 shadow-sm h-full">
      <h2 className="text-lg font-bold text-card-foreground mb-4">Quick Actions</h2>
      <div className="flex flex-wrap gap-3">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/80 active:scale-95 transition-all font-semibold">
              Book Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Book a Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Resource Type</label>
                <Select value={resourceType} onValueChange={(value) => {
                  setResourceType(value);
                  setResourceId("");
                  setResources([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {resourceType && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Resource Name {loadingResources && "(Loading...)"}
                  </label>
                  <Select value={resourceId} onValueChange={setResourceId} disabled={loadingResources || resources.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingResources ? "Loading..." : resources.length === 0 ? "No available resources" : "Select resource"} />
                    </SelectTrigger>
                    <SelectContent>
                      {resources.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Time Slot</label>
                <Select value={timeSlot} onValueChange={setTimeSlot}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/80 active:scale-95 transition-all font-semibold"
                disabled={!resourceType || !resourceId || !date || !timeSlot || submitting}
                onClick={handleConfirmBooking}
              >
                {submitting ? "Submitting..." : "Submit Booking Request"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          onClick={handleMaintenanceRequest}
          className="bg-accent/15 text-accent border border-accent/30 hover:bg-accent/25 active:scale-95 transition-all font-semibold"
        >
          Maintenance Request
        </Button>
      </div>
    </div>
  );
};

export default QuickActions;
