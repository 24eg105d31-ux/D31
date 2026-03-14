import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, Clock, Calendar as CalendarIcon } from "lucide-react";
import io from 'socket.io-client';
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = "http://localhost:3001/api";

interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
  capacity: number;
  building: string;
}

interface SlotAvailability {
  timeSlot: string;
  available: boolean;
  bookedBy?: string;
  status: 'available' | 'booked' | 'pending' | 'reserved';
}

const timeSlots = [
  "8:00 AM - 9:00 AM", "9:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM", "1:00 PM - 2:00 PM", "2:00 PM - 3:00 PM", "3:00 PM - 4:00 PM", "4:00 PM - 5:00 PM"
];

const categoryConfig: Record<string, { label: string; color: string; bookedLabel: string }> = {
  lab: { label: "Labs", color: "bg-blue-500", bookedLabel: "Occupied" },
  classroom: { label: "Classrooms", color: "bg-green-500", bookedLabel: "Occupied" },
  hall: { label: "Seminar Halls", color: "bg-orange-500", bookedLabel: "Booked" },
  auditorium: { label: "Auditoriums", color: "bg-purple-500", bookedLabel: "Booked" },
};

const LiveAvailability = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [resources, setResources] = useState<Resource[]>([]);
  const [slotAvailability, setSlotAvailability] = useState<Record<string, SlotAvailability[]>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'detailed'>('overview');
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchResources = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/resources`);
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (err) {
      console.error("Failed to fetch resources:", err);
    }
  }, []);

  const fetchSlotAvailability = useCallback(async (date: Date) => {
    setLoading(true);
    const dateStr = date.toISOString().split('T')[0];
    const availabilityMap: Record<string, SlotAvailability[]> = {};

    try {
      await Promise.all(resources.map(async (resource) => {
        availabilityMap[resource.id] = [];
        for (const timeSlot of timeSlots) {
          try {
            const response = await fetch(
              `${API_URL}/bookings/check?resourceId=${resource.id}&date=${dateStr}&timeSlot=${encodeURIComponent(timeSlot)}`
            );
            const data = await response.json();
            availabilityMap[resource.id].push({
              timeSlot,
              available: data.available,
              bookedBy: data.existingBooking?.userName,
              status: data.reserved ? 'reserved' : (data.available ? 'available' : data.existingBooking?.status || 'booked')
            });
          } catch (err) {
            availabilityMap[resource.id].push({
              timeSlot,
              available: true,
              status: 'available' as const
            });
          }
        }
      }));
      setSlotAvailability(availabilityMap);
    } catch (err) {
      console.error("Failed to fetch slot availability:", err);
    } finally {
      setLoading(false);
    }
  }, [resources]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    fetchSlotAvailability(selectedDate);
  }, [selectedDate, fetchSlotAvailability]);

  useEffect(() => {
    const socket = io(API_URL.replace('/api', ''));

    socket.on('availabilityUpdate', () => {
      fetchResources();
      fetchSlotAvailability(selectedDate);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedDate, fetchResources, fetchSlotAvailability]);

  const categories = ["lab", "classroom", "hall", "auditorium"] as const;

  const getOverviewStats = () => {
    return categories.map((cat) => {
      const items = resources.filter((r) => r.type === cat);
      const available = items.filter((r) => r.status === "available").length;
      const occupied = items.length - available;
      return { category: cat, available, occupied, ...categoryConfig[cat] };
    });
  };

  const getSlotStatusColor = (status: SlotAvailability['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'booked': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'reserved': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading && Object.keys(slotAvailability).length === 0) {
    return (
      <div className="bg-card rounded-lg p-5 shadow-sm">
        <h2 className="text-lg font-bold text-card-foreground mb-4">Live Availability</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-card-foreground">Live Availability</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className={tab === 'overview' ? 'bg-accent' : ''}
            onClick={() => setTab('overview')}
          >
            Overview
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className={tab === 'detailed' ? 'bg-accent' : ''}
            onClick={() => setTab('detailed')}
          >
            Slot Matrix
          </Button>
        </div>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {getOverviewStats().map((s) => (
            <div key={s.category} className="rounded-lg overflow-hidden border border-border shadow-sm">
              <div className={`${s.color} text-primary-foreground px-4 py-2.5 font-bold text-sm`}>
                {s.label}
              </div>
              <div className="bg-secondary px-4 py-3 flex gap-5">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span>{s.available} Available</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <span>{s.occupied} {s.bookedLabel}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'detailed' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border w-full max-w-md"
              disabled={(date) => date < new Date()}
            />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading slot availability...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="border-r p-3 text-left font-medium">Resource</th>
                    {timeSlots.map(slot => (
                      <th key={slot} className="p-3 text-center font-medium text-xs">{slot}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map(resource => (
                    <tr key={resource.id} className="border-b last:border-b-0 hover:bg-accent/50">
                      <td className="border-r p-3 font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getSlotStatusColor('available')}`} />
                          {resource.name}
                          <span className="text-xs text-muted-foreground">({resource.building})</span>
                        </div>
                      </td>
                      {slotAvailability[resource.id]?.map((slot, idx) => (
                        <td key={idx} className={`p-2 text-center text-xs ${slot.available ? 'cursor-pointer hover:bg-green-500/20' : ''}`}>
                          <div className={`w-6 h-6 mx-auto rounded-full text-xs font-medium flex items-center justify-center ${getSlotStatusColor(slot.status)} text-white`}>
                            {slot.status === 'available' ? '✓' : slot.status.charAt(0).toUpperCase()}
                          </div>
                          {slot.bookedBy && (
                            <div className="mt-1 text-xs text-muted-foreground line-clamp-1 max-w-[80px]">
                              {slot.bookedBy}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveAvailability;
