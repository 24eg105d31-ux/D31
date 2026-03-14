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
  getUserMaintenanceRequests,
  isSlotAvailable,
  getSlotBooking,
  createTemporaryReservation,
  isSlotReserved,
  getSlotReservation,
  confirmBookingFromReservation,
  cancelReservation,
  getUserReservations
} from "./database.js";

const app = express();
const PORT = 3001;

const requireRole = (allowedRoles) => (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({ error: 'Insufficient permissions for this action' });
  }
  req.userRole = role;
  next();
};

// Middleware
app.use(cors());
app.use(express.json());

// Auth routes
app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }
    
    // Create new user with specified role (default is "student")
    const userRole = role && ["student", "faculty"].includes(role) ? role : "student";
    const userId = createUser(name, email, password, userRole);
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
    
    // Handle slot already booked error from transaction
    if (error && error.code === "SLOT_ALREADY_BOOKED") {
      return res.status(409).json({ 
        error: error.message || "This time slot is already booked. Please choose a different time or date.",
        existingBooking: error.existingBooking || null
      });
    }
    
    if (error && error.code === "PAST_TIME") {
      return res.status(400).json({ error: error.message });
    }
    
    // Handle lock timeout error
    if (error && error.message && error.message.includes("LOCK_TIMEOUT")) {
      return res.status(503).json({ error: "Server busy. Please try again." });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to check slot availability before booking
app.get("/api/bookings/check", (req, res) => {
  try {
    const { resourceId, date, timeSlot } = req.query;
    
    if (!resourceId || !date || !timeSlot) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const available = isSlotAvailable(resourceId, date, timeSlot);
    const existingBooking = getSlotBooking(resourceId, date, timeSlot);
    const { reserved, reservation } = isSlotReserved(resourceId, date, timeSlot);
    
    res.json({ 
      available: available && !reserved, 
      reserved,
      existingBooking: existingBooking ? {
        id: existingBooking.id,
        userName: existingBooking.userName,
        status: existingBooking.status
      } : null,
      reservation: reservation ? {
        id: reservation.id,
        userName: reservation.userName,
        expiresAt: reservation.expiresAt
      } : null
    });
  } catch (error) {
    console.error("Check availability error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================== TEMPORARY RESERVATION ENDPOINTS ====================

// Create a temporary reservation (10-minute hold)
app.post("/api/reservations", (req, res) => {
  try {
    const { resourceId, date, timeSlot, userId, userName, userEmail } = req.body;
    
    if (!resourceId || !date || !timeSlot || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = createTemporaryReservation(resourceId, date, timeSlot, userId, userName, userEmail);
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Create reservation error:", error);
    
    if (error && error.code === "SLOT_RESERVED") {
      return res.status(409).json({ 
        error: error.message,
        expiresAt: error.expiresAt
      });
    }
    
    if (error && error.code === "SLOT_ALREADY_BOOKED") {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Confirm booking from reservation (payment completed)
app.post("/api/reservations/:id/confirm", (req, res) => {
  try {
    const { id } = req.params;
    const { resourceName, resourceType, userId } = req.body;
    
    if (!resourceName || !resourceType || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const result = confirmBookingFromReservation(id, {
      resourceName,
      resourceType,
      userId
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error("Confirm reservation error:", error);
    
    if (error && error.code === "RESERVATION_EXPIRED") {
      return res.status(410).json({ error: error.message });
    }
    
    if (error && error.code === "UNAUTHORIZED") {
      return res.status(403).json({ error: error.message });
    }
    
    if (error && error.code === "SLOT_ALREADY_BOOKED") {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Cancel a reservation
app.delete("/api/reservations/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }
    
    const result = cancelReservation(id, userId);
    res.json(result);
  } catch (error) {
    console.error("Cancel reservation error:", error);
    
    if (error && error.code === "RESERVATION_NOT_FOUND") {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user's active reservations
app.get("/api/reservations/user/:userId", (req, res) => {
  try {
    const { userId } = req.params;
    const reservations = getUserReservations(userId);
    res.json(reservations);
  } catch (error) {
    console.error("Get user reservations error:", error);
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

import { Server } from "socket.io";

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Emit availability update on booking changes
const emitAvailabilityUpdate = () => {
  io.emit("availabilityUpdate");
};

// Wrap booking endpoints with emit
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
    
    emitAvailabilityUpdate();
    
    res.status(201).json({ message: "Booking request submitted", bookingId });
  } catch (error) {
    console.error("Create booking error:", error);
    
    if (error && error.code === "SLOT_ALREADY_BOOKED") {
      return res.status(409).json({ 
        error: error.message || "This time slot is already booked. Please choose a different time or date.",
        existingBooking: error.existingBooking || null
      });
    }
    
    if (error && error.message && error.message.includes("LOCK_TIMEOUT")) {
      return res.status(503).json({ error: "Server busy. Please try again." });
    }
    
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/bookings/:id/approve", (req, res) => {
  try {
    const { id } = req.params;
    const booking = updateBookingStatus(id, "approved");
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    emitAvailabilityUpdate();
    
    res.json({ message: "Booking approved", booking });
  } catch (error) {
    console.error("Approve booking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/bookings/:id/reject", (req, res) => {
  try {
    const { id } = req.params;
    const booking = updateBookingStatus(id, "rejected");
    
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    emitAvailabilityUpdate();
    
    res.json({ message: "Booking rejected", booking });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
