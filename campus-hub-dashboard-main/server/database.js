import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "database.json");
const LOCK_PATH = path.join(__dirname, "database.lock");

// Initialize empty database if it doesn't exist
function initDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const hashedPassword = bcrypt.hashSync("admin123", 10);
    const initialData = {
      users: [
        {
          id: "1",
          name: "Admin",
          email: "admin@crms.edu",
          password: hashedPassword,
          role: "admin",
          createdAt: new Date().toISOString()
        }
      ],
      bookings: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

initDatabase();

// ==================== TRANSACTION & LOCKING SYSTEM ====================

// Acquire exclusive lock for database operations (prevents race conditions)
function acquireLock(maxRetries = 50, retryDelay = 50) {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      // Try to create lock file (exclusive mode)
      fs.writeFileSync(LOCK_PATH, process.pid.toString(), { flag: 'wx' });
      return true;
    } catch (error) {
      if (error.code === 'EEXIST') {
        // Lock exists, wait and retry
        attempts++;
        // Check if lock is stale (older than 5 seconds)
        try {
          const stats = fs.statSync(LOCK_PATH);
          const age = Date.now() - stats.mtimeMs;
          if (age > 5000) {
            // Stale lock, force remove it
            try {
              fs.unlinkSync(LOCK_PATH);
            } catch (e) {
              // Ignore - another process may have removed it
            }
          }
        } catch (e) {
          // Ignore stat errors
        }
        
        // Wait before retrying
        const waitStart = Date.now();
        while (Date.now() - waitStart < retryDelay) {
          // Busy wait (in production, use proper async sleep)
        }
      } else {
        throw error;
      }
    }
  }
  
  throw new Error("LOCK_TIMEOUT: Could not acquire database lock");
}

// Release the database lock
function releaseLock() {
  try {
    if (fs.existsSync(LOCK_PATH)) {
      fs.unlinkSync(LOCK_PATH);
    }
  } catch (error) {
    console.error("Error releasing lock:", error);
  }
}

// Execute a function within a database transaction (with locking)
function executeTransaction(transactionFn) {
  let result = null;
  let lockAcquired = false;
  
  try {
    // Step 1: Acquire exclusive lock
    acquireLock();
    lockAcquired = true;
    
    // Step 2: Read database
    const db = readDatabase();
    
    // Step 3: Execute transaction logic (can read/modify db)
    result = transactionFn(db);
    
    // Step 4: Write database (commit)
    writeDatabase(db);
    
    return result;
    
  } catch (error) {
    // Transaction failed - rollback happens automatically since we don't write
    throw error;
  } finally {
    // Step 5: Always release lock
    if (lockAcquired) {
      releaseLock();
    }
  }
}

// ==================== DATABASE OPERATIONS ====================

function readDatabase() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return { users: [], bookings: [] };
  }
}

function writeDatabase(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Initialize resources in database
function initResources() {
  const db = readDatabase();
  if (!db.resources || db.resources.length === 0) {
    db.resources = [
      // Labs
      { id: "l1", name: "Lab 101", type: "lab", capacity: 30, status: "available", building: "CSE Block" },
      { id: "l2", name: "Lab 102", type: "lab", capacity: 30, status: "occupied", building: "CSE Block" },
      { id: "l3", name: "Lab 103", type: "lab", capacity: 30, status: "available", building: "CSE Block" },
      { id: "l4", name: "Lab 104", type: "lab", capacity: 30, status: "occupied", building: "CSE Block" },
      { id: "l5", name: "Lab 105", type: "lab", capacity: 25, status: "available", building: "CSE Block" },
      { id: "l6", name: "Lab 106", type: "lab", capacity: 25, status: "available", building: "CSE Block" },
      { id: "l7", name: "Lab 107", type: "lab", capacity: 30, status: "occupied", building: "CSE Block" },
      { id: "l8", name: "Lab 108", type: "lab", capacity: 30, status: "available", building: "CSE Block" },
      // Classrooms
      { id: "c1", name: "Classroom A1", type: "classroom", capacity: 60, status: "available", building: "Block A" },
      { id: "c2", name: "Classroom A2", type: "classroom", capacity: 60, status: "occupied", building: "Block A" },
      { id: "c3", name: "Classroom B1", type: "classroom", capacity: 50, status: "available", building: "Block B" },
      { id: "c4", name: "Classroom B2", type: "classroom", capacity: 50, status: "available", building: "Block B" },
      { id: "c5", name: "Classroom C1", type: "classroom", capacity: 40, status: "occupied", building: "Block C" },
      { id: "c6", name: "Classroom C2", type: "classroom", capacity: 40, status: "available", building: "Block C" },
      { id: "c7", name: "Classroom C3", type: "classroom", capacity: 45, status: "available", building: "Block C" },
      { id: "c8", name: "Classroom C4", type: "classroom", capacity: 45, status: "occupied", building: "Block C" },
      { id: "c9", name: "Classroom D1", type: "classroom", capacity: 35, status: "available", building: "Block D" },
      { id: "c10", name: "Classroom D2", type: "classroom", capacity: 35, status: "available", building: "Block D" },
      { id: "c11", name: "Classroom D3", type: "classroom", capacity: 35, status: "occupied", building: "Block D" },
      { id: "c12", name: "Classroom D4", type: "classroom", capacity: 35, status: "available", building: "Block D" },
      // Halls
      { id: "h1", name: "Seminar Hall 1", type: "hall", capacity: 100, status: "available", building: "Admin Block" },
      { id: "h2", name: "Seminar Hall 2", type: "hall", capacity: 80, status: "booked", building: "Admin Block" },
      { id: "h3", name: "Seminar Hall 3", type: "hall", capacity: 50, status: "available", building: "Admin Block" },
      // Auditoriums
      { id: "a1", name: "Main Auditorium", type: "auditorium", capacity: 500, status: "booked", building: "Cultural Block" },
      { id: "a2", name: "Mini Auditorium", type: "auditorium", capacity: 150, status: "available", building: "Cultural Block" },
    ];
    writeDatabase(db);
  }
  updateResourceStatusesFromBookings(db);
}

initResources();

// Update resource statuses based on upcoming bookings (next 7 days)
function updateResourceStatusesFromBookings(db) {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  // Get upcoming bookings (approved/pending)
  const upcomingBookings = db.bookings.filter(b => 
    (b.status === 'approved' || b.status === 'pending') &&
    new Date(b.date) <= oneWeekFromNow
  );
  
  // Group by resourceId
  const resourceBookings = upcomingBookings.reduce((acc, b) => {
    if (!acc[b.resourceId]) acc[b.resourceId] = 0;
    acc[b.resourceId]++;
    return acc;
  }, {});
  
  // Update resource statuses
  if (db.resources) {
    db.resources.forEach(resource => {
      if (resourceBookings[resource.id] && resourceBookings[resource.id] > 0) {
        resource.status = 'booked';
      } else {
        resource.status = 'available';
      }
      resource.updatedAt = new Date().toISOString();
    });
  }
}

// Resource functions
export function getAllResources() {
  const db = readDatabase();
  return db.resources || [];
}

export function getResourcesByType(type) {
  const db = readDatabase();
  return (db.resources || []).filter(r => r.type === type);
}

export function getResourceById(id) {
  const db = readDatabase();
  return (db.resources || []).find(r => r.id === id);
}

export function updateResourceStatus(id, status) {
  const db = readDatabase();
  const resourceIndex = (db.resources || []).findIndex(r => r.id === id);
  
  if (resourceIndex !== -1) {
    db.resources[resourceIndex].status = status;
    db.resources[resourceIndex].updatedAt = new Date().toISOString();
    writeDatabase(db);
    return db.resources[resourceIndex];
  }
  
  return null;
}

// Maintenance functions
export function createMaintenanceRequest(request) {
  const db = readDatabase();
  
  if (!db.maintenance) {
    db.maintenance = [];
  }
  
  const newRequest = {
    id: Date.now().toString(),
    ...request,
    status: "pending", // pending, in-progress, completed
    createdAt: new Date().toISOString()
  };
  
  db.maintenance.push(newRequest);
  writeDatabase(db);
  
  return newRequest.id;
}

export function getAllMaintenanceRequests() {
  const db = readDatabase();
  return (db.maintenance || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getMaintenanceById(id) {
  const db = readDatabase();
  return (db.maintenance || []).find(r => r.id === id);
}

export function updateMaintenanceStatus(id, status) {
  const db = readDatabase();
  const requestIndex = (db.maintenance || []).findIndex(r => r.id === id);
  
  if (requestIndex !== -1) {
    db.maintenance[requestIndex].status = status;
    db.maintenance[requestIndex].updatedAt = new Date().toISOString();
    writeDatabase(db);
    return db.maintenance[requestIndex];
  }
  
  return null;
}

export function getUserMaintenanceRequests(userId) {
  const db = readDatabase();
  return (db.maintenance || [])
    .filter(r => r.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// User functions
export function createUser(name, email, password, role = "user") {
  const db = readDatabase();
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  writeDatabase(db);
  
  return newUser.id;
}

export function findUserByEmail(email) {
  const db = readDatabase();
  return db.users.find(user => user.email === email);
}

export function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

export function getUserById(id) {
  const db = readDatabase();
  return db.users.find(user => user.id === id);
}

// Booking functions using transaction system
// Check if a slot is already booked (approved or pending) - uses read-only lock
export function isSlotAvailable(resourceId, date, timeSlot) {
  let available = false;
  
  executeTransaction((db) => {
    const conflictingBooking = db.bookings.find(
      booking => 
        booking.resourceId === resourceId &&
        booking.date === date &&
        booking.timeSlot === timeSlot &&
        (booking.status === "approved" || booking.status === "pending")
    );
    available = conflictingBooking === undefined;
  });
  
  return available;
}

// Check if slot is available (returns booking details if found)
export function getSlotBooking(resourceId, date, timeSlot) {
  let result = null;
  
  executeTransaction((db) => {
    result = db.bookings.find(
      booking => 
        booking.resourceId === resourceId &&
        booking.date === date &&
        booking.timeSlot === timeSlot &&
        (booking.status === "approved" || booking.status === "pending")
    );
  });
  
  return result;
}

// CREATE BOOKING - Uses transaction with exclusive lock to prevent race conditions
export function createBooking(booking) {
  // Use executeTransaction to ensure atomic check-and-create
  return executeTransaction((db) => {
    // Step 1: Check if slot is already booked (inside transaction)
    const conflictingBooking = db.bookings.find(
      b => 
        b.resourceId === booking.resourceId &&
        b.date === booking.date &&
        b.timeSlot === booking.timeSlot &&
        (b.status === "approved" || b.status === "pending")
    );
    
    // Step 2: If conflict found, throw error (will rollback)
    if (conflictingBooking) {
      throw {
        code: "SLOT_ALREADY_BOOKED",
        message: "This time slot is already booked",
        existingBooking: conflictingBooking
      };
    }
    
    // PAST TIME VALIDATION
    const slotStartTime = new Date(`${booking.date}T00:00:00`); // Base date
    const timeMatch = booking.timeSlot.match(/(\\d+):(\\d+)\\s*(AM|PM)/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const mins = parseInt(timeMatch[2]);
      const isPM = timeMatch[3].toUpperCase() === 'PM';
      
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
      
      slotStartTime.setHours(hours, mins, 0, 0);
    }
    
    const now = new Date();
    if (slotStartTime <= now) {
      throw {
        code: "PAST_TIME",
        message: "Cannot book past time slots"
      };
    }
    
    // Step 3: Create new booking
    const newBooking = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      ...booking,
      status: "pending", // pending, approved, rejected
      createdAt: new Date().toISOString()
    };
    
    // Step 4: Add to database (will be committed when transaction succeeds)
    db.bookings.push(newBooking);
    
    // Update resource statuses
    updateResourceStatusesFromBookings(db);
    
    return newBooking.id;
  });

}

export function getAllBookings() {
  const db = readDatabase();
  return db.bookings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getPendingBookings() {
  const db = readDatabase();
  return db.bookings
    .filter(booking => booking.status === "pending")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getBookingById(id) {
  const db = readDatabase();
  return db.bookings.find(booking => booking.id === id);
}

export function updateBookingStatus(id, status) {
  const db = readDatabase();
  const bookingIndex = db.bookings.findIndex(booking => booking.id === id);
  
  if (bookingIndex !== -1) {
    db.bookings[bookingIndex].status = status;
    db.bookings[bookingIndex].updatedAt = new Date().toISOString();
    writeDatabase(db);
    return db.bookings[bookingIndex];
  }
  
  return null;
}

// ==================== TEMPORARY RESERVATION SYSTEM ====================
// Holds a slot for 10 minutes while user completes payment

const RESERVATION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Create a temporary reservation for a slot (10-minute hold)
 */
export function createTemporaryReservation(resourceId, date, timeSlot, userId, userName, userEmail) {
  return executeTransaction((db) => {
    // Initialize reservations array if not exists
    if (!db.reservations) {
      db.reservations = [];
    }
    
    // Clean up expired reservations first
    const now = Date.now();
    db.reservations = db.reservations.filter(r => r.expiresAt > now);
    
    // Check if slot is already reserved (not expired)
    const existingReservation = db.reservations.find(
      r => r.resourceId === resourceId && r.date === date && r.timeSlot === timeSlot && r.expiresAt > now
    );
    
    // Also check for pending/approved bookings
    const existingBooking = db.bookings.find(
      b => b.resourceId === resourceId && b.date === date && b.timeSlot === timeSlot && (b.status === "pending" || b.status === "approved")
    );
    
    if (existingReservation) {
      if (existingReservation.userId === userId) {
        // Extend the reservation for same user
        existingReservation.expiresAt = now + RESERVATION_TIMEOUT_MS;
        return { reservationId: existingReservation.id, expiresAt: existingReservation.expiresAt, message: "Reservation extended" };
      }
      throw { code: "SLOT_RESERVED", message: "This slot is currently reserved by another user", expiresAt: existingReservation.expiresAt };
    }
    
    if (existingBooking) {
      throw { code: "SLOT_ALREADY_BOOKED", message: "This time slot is already booked" };
    }
    
    // Create new reservation
    const reservation = {
      id: "res_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
      resourceId, date, timeSlot, userId, userName, userEmail,
      createdAt: now,
      expiresAt: now + RESERVATION_TIMEOUT_MS
    };
    
    db.reservations.push(reservation);
    
    return { reservationId: reservation.id, expiresAt: reservation.expiresAt, message: "Slot reserved for 10 minutes" };
  });
}

/**
 * Check if slot is currently reserved
 */
export function isSlotReserved(resourceId, date, timeSlot) {
  let reserved = false;
  let reservation = null;
  
  executeTransaction((db) => {
    if (!db.reservations) { db.reservations = []; }
    
    const now = Date.now();
    db.reservations = db.reservations.filter(r => r.expiresAt > now);
    
    reservation = db.reservations.find(
      r => r.resourceId === resourceId && r.date === date && r.timeSlot === timeSlot && r.expiresAt > now
    );
    reserved = !!reservation;
  });
  
  return { reserved, reservation };
}

/**
 * Get reservation status for a slot
 */
export function getSlotReservation(resourceId, date, timeSlot) {
  let result = null;
  
  executeTransaction((db) => {
    if (!db.reservations) { db.reservations = []; }
    const now = Date.now();
    db.reservations = db.reservations.filter(r => r.expiresAt > now);
    result = db.reservations.find(r => r.resourceId === resourceId && r.date === date && r.timeSlot === timeSlot && r.expiresAt > now);
  });
  
  return result;
}

/**
 * Confirm booking from reservation (payment completed)
 */
export function confirmBookingFromReservation(reservationId, bookingDetails) {
  return executeTransaction((db) => {
    if (!db.reservations) { db.reservations = []; }
    
    const now = Date.now();
    const reservationIndex = db.reservations.findIndex(r => r.id === reservationId && r.expiresAt > now);
    
    if (reservationIndex === -1) {
      throw { code: "RESERVATION_EXPIRED", message: "Your reservation has expired" };
    }
    
    const reservation = db.reservations[reservationIndex];
    
    if (reservation.userId !== bookingDetails.userId) {
      throw { code: "UNAUTHORIZED", message: "You can only confirm your own reservation" };
    }
    
    // Remove reservation
    db.reservations.splice(reservationIndex, 1);
    
    // Check again for existing bookings
    const existingBooking = db.bookings.find(
      b => b.resourceId === reservation.resourceId && b.date === reservation.date && b.timeSlot === reservation.timeSlot && (b.status === "pending" || b.status === "approved")
    );
    
    if (existingBooking) {
      throw { code: "SLOT_ALREADY_BOOKED", message: "This slot was just booked" };
    }
    
    // Create the booking
    const newBooking = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      resourceId: reservation.resourceId,
      resourceName: bookingDetails.resourceName,
      resourceType: bookingDetails.resourceType,
      date: reservation.date,
      timeSlot: reservation.timeSlot,
      userId: reservation.userId,
      userName: reservation.userName,
      userEmail: reservation.userEmail,
      status: "pending",
      createdAt: new Date().toISOString()
    };
    
    db.bookings.push(newBooking);
    return { bookingId: newBooking.id, message: "Booking confirmed" };
  });
}

/**
 * Cancel a reservation
 */
export function cancelReservation(reservationId, userId) {
  return executeTransaction((db) => {
    if (!db.reservations) { db.reservations = []; }
    const index = db.reservations.findIndex(r => r.id === reservationId && r.userId === userId);
    if (index === -1) { throw { code: "RESERVATION_NOT_FOUND", message: "Reservation not found" }; }
    db.reservations.splice(index, 1);
    return { message: "Reservation cancelled" };
  });
}

/**
 * Get user's active reservations
 */
export function getUserReservations(userId) {
  let result = [];
  executeTransaction((db) => {
    if (!db.reservations) { db.reservations = []; }
    const now = Date.now();
    db.reservations = db.reservations.filter(r => r.expiresAt > now);
    result = db.reservations.filter(r => r.userId === userId);
  });
  return result;
}

export default {
  createUser,
  findUserByEmail,
  verifyPassword,
  getUserById,
  createBooking,
  getAllBookings,
  getPendingBookings,
  getBookingById,
  updateBookingStatus
};
