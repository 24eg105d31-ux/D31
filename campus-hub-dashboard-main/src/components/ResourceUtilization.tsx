import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_URL = "http://localhost:3001/api";

interface Resource {
  type: string;
  status: string;
}

interface Booking {
  resourceType: string;
  date: string;
  status: string;
}

const ResourceUtilization = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resourcesRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/resources`),
        fetch(`${API_URL}/bookings`),
      ]);

      const resources: Resource[] = await resourcesRes.json();
      const bookings: Booking[] = await bookingsRes.json();

      // Get today's date
      const today = new Date().toISOString().split("T")[0];
      
      // Calculate utilization for each resource type
      const resourceTypes = ["lab", "classroom", "hall", "auditorium"];
      const data = resourceTypes.map((type) => {
        const totalResources = resources.filter((r) => r.type === type).length;
        const availableResources = resources.filter(
          (r) => r.type === type && r.status === "available"
        ).length;
        const occupiedResources = totalResources - availableResources;
        
        // Count today's bookings
        const todayBookings = bookings.filter(
          (b) => b.resourceType === type && b.date === today && b.status === "approved"
        ).length;

        const utilizationPercent = totalResources > 0 
          ? Math.round(((occupiedResources + todayBookings) / totalResources) * 100) 
          : 0;

        return {
          name: getTypeLabel(type),
          total: totalResources,
          available: availableResources,
          booked: occupiedResources + todayBookings,
          utilization: utilizationPercent,
        };
      });

      setChartData(data);
    } catch (error) {
      console.error("Error fetching utilization data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "lab":
        return "Labs";
      case "classroom":
        return "Classrooms";
      case "hall":
        return "Halls";
      case "auditorium":
        return "Auditoriums";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-5 shadow-sm h-full flex flex-col">
        <h2 className="text-lg font-bold text-card-foreground mb-4">Resource Utilization</h2>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-5 shadow-sm h-full flex flex-col">
      <h2 className="text-lg font-bold text-card-foreground mb-4">Resource Utilization</h2>
      {chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 py-6">
          <BarChart3 className="w-10 h-10" />
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                className="text-muted-foreground"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="available" name="Available" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="booked" name="Booked/Occupied" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default ResourceUtilization;
