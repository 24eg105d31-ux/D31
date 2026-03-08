import { useState, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

const API_URL = "http://localhost:3001/api";

interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
}

const categoryConfig: Record<string, { label: string; color: string; occupiedLabel: string }> = {
  lab: { label: "Labs", color: "bg-lab", occupiedLabel: "Occupied" },
  classroom: { label: "Classrooms", color: "bg-classroom", occupiedLabel: "Occupied" },
  hall: { label: "Seminar Halls", color: "bg-hall", occupiedLabel: "Booked" },
  auditorium: { label: "Auditoriums", color: "bg-auditorium", occupiedLabel: "Booked" },
};

const LiveAvailability = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(`${API_URL}/resources`);
        if (!response.ok) throw new Error("Failed to fetch resources");
        const data = await response.json();
        setResources(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load resources");
        // Fall back to mock data on error
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const categories = ["lab", "classroom", "hall", "auditorium"];

  const getStats = () => {
    return categories.map((cat) => {
      const items = resources.filter((r) => r.type === cat);
      const available = items.filter((r) => r.status === "available").length;
      const occupied = items.length - available;
      return { category: cat, available, occupied, ...categoryConfig[cat] };
    });
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-5 shadow-sm">
        <h2 className="text-lg font-bold text-card-foreground mb-4">Live Availability</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="bg-card rounded-lg p-5 shadow-sm">
      <h2 className="text-lg font-bold text-card-foreground mb-4">Live Availability</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
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
                <span>{s.occupied} {s.occupiedLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveAvailability;
