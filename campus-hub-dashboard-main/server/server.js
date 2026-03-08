import express from "express";
import cors from "cors";
import { 
  createUser, 
  findUserByEmail, 
  verifyPassword,
  getUserById,
  createBooking,
  getAllBookings,
  getPendingBookings,
  getBookingById,
  updateBookingStatus,
  getAllResources,
  getResourcesByType,
  getResourceById,
  updateResourceStatus,
  createMaintenanceRequest,
  getAllMaintenanceRequests,
  getMaintenanceById,
  updateMaintenanceStatus,
  getUserMaintenanceRequests
} from "./database.js";

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes
app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    // Create new user (default role is "user")
    const userId = createUser(name, email, password);
    res.status(201).json({ message: "User created successfully", userId });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Verify password
    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Return user info (without password)
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user"
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Booking routes
// Create a new booking request
app.post("/api/bookings", (req, res) => {
  try {
    const { resourceId, resourceName, resourceType, date, timeSlot, userId, userName, userEmail } = req.body;
    
    if (!resourceId || !date || !timeSlot || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const bookingId = createBooking({
      resourceId,
      resourceName,
      resourceType,
      date,
      timeSlot,
      userId,
      userName,
      userEmail,
      status: "pending"
    });
    
    res.status(201).json({ message: "Booking request submitted", bookingId });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all bookings (for admin)
app.get("/api/bookings", (req, res) => {
  try {
    const bookings = getAllBookings();
    res.json(bookings);
  } catch (error) {
    console.error("Get bookings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get pending bookings (for admin - first come first serve)
app.get("/api/bookings/pending", (req, res) => {
  try {
    const bookings = getPendingBookings();
    res.json(bookings);
  } catch (error) {
    console.error("Get pending bookings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Approve a booking
app.patch("/api/bookings/:id/approve", (req, res) => {
  try {
    const { id } = req.params;
    const booking = updateBookingStatus(id, "approved");
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    res.json({ message: "Booking approved", booking });
  } catch (error) {
    console.error("Approve booking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reject a booking
app.patch("/api/bookings/:id/reject", (req, res) => {
  try {
    const { id } = req.params;
    const booking = updateBookingStatus(id, "rejected");
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    res.json({ message: "Booking rejected", booking });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Resource routes
// Get all resources
app.get("/api/resources", (req, res) => {
  try {
    const { type } = req.query;
    const resources = type ? getResourcesByType(type) : getAllResources();
    res.json(resources);
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get resources by type (lab, classroom, hall)
app.get("/api/resources/:type", (req, res) => {
  try {
    const { type } = req.params;
    const resources = getResourcesByType(type);
    res.json(resources);
  } catch (error) {
    console.error("Get resources by type error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Maintenance routes
// Create a new maintenance request
app.post("/api/maintenance", (req, res) => {
  try {
    const { resourceId, resourceName, issue, description, userId, userName, userEmail } = req.body;
    
    if (!resourceId || !issue || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const requestId = createMaintenanceRequest({
      resourceId,
      resourceName,
      issue,
      description,
      userId,
      userName,
      userEmail,
      status: "pending"
    });
    
    res.status(201).json({ message: "Maintenance request submitted", requestId });
  } catch (error) {
    console.error("Create maintenance request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all maintenance requests (for admin)
app.get("/api/maintenance", (req, res) => {
  try {
    const requests = getAllMaintenanceRequests();
    res.json(requests);
  } catch (error) {
    console.error("Get maintenance requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's maintenance requests
app.get("/api/maintenance/user/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const requests = getUserMaintenanceRequests(userId);
    res.json(requests);
  } catch (error) {
    console.error("Get user maintenance requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update maintenance status
app.patch("/api/maintenance/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    
    const request = updateMaintenanceStatus(id, status);
    
    if (!request) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }
    
    res.json({ message: "Maintenance status updated", request });
  } catch (error) {
    console.error("Update maintenance status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
