import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";

interface MaintenanceRequest {
  id: string;
  resourceId: string;
  resourceName: string;
  issue: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: string;
  createdAt: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
}

const MaintenancePage = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState("");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, resourcesRes] = await Promise.all([
        fetch("http://localhost:3001/api/maintenance"),
        fetch("http://localhost:3001/api/resources"),
      ]);

      const requestsData = await requestsRes.json();
      const resourcesData = await resourcesRes.json();

      // Filter requests for current user
      const userRequests = user
        ? requestsData.filter((r: MaintenanceRequest) => r.userId === user.id)
        : requestsData;

      setRequests(userRequests.reverse());
      setResources(resourcesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedResource || !issue || !user) return;

    const resource = resources.find((r) => r.id === selectedResource);

    try {
      const response = await fetch("http://localhost:3001/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedResource,
          resourceName: resource?.name || "Unknown",
          issue,
          description,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setDialogOpen(false);
          setSubmitSuccess(false);
          setSelectedResource("");
          setIssue("");
          setDescription("");
          fetchData();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "in-progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">Submit and track maintenance requests for campus facilities</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New Request</Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No maintenance requests yet. Click "New Request" to submit one.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{request.resourceName}</CardTitle>
                    <span className="text-sm text-muted-foreground">{request.issue}</span>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Issue:</span>
                    <p className="font-medium">{request.issue}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p className="font-medium">{request.description || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted On:</span>
                    <p className="font-medium">{formatDate(request.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium">
                      {request.status === "pending" && "Awaiting review"}
                      {request.status === "in-progress" && "Being worked on"}
                      {request.status === "completed" && "Issue resolved"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Maintenance Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Resource</Label>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a resource" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name} ({resource.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Issue Type</Label>
              <Select value={issue} onValueChange={setIssue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Equipment">Equipment</SelectItem>
                  <SelectItem value="AC/Heating">AC/Heating</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={!selectedResource || !issue}>
              {submitSuccess ? "Request Submitted!" : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaintenancePage;
