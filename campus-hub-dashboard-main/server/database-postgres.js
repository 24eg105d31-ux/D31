// =============================================================================
// PostgreSQL Database Module for Campus Booking System
// =============================================================================
// This module demonstrates using PostgreSQL with proper constraints to prevent
// race conditions and double bookings at the database level.
// =============================================================================

import pg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pg;

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "campus_booking",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 20, // Max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// =============================================================================
// BOOKING FUNCTIONS - Using Database Constraints for Race Condition Prevention
// =============================================================================

/**
 * Check if a slot is available for booking
 * Uses database query to check for existing pending/approved bookings
 */
export async function isSlotAvailable(resourceId, date, timeSlot) {
  try {
    const result = await pool.query(
      `SELECT booking_id FROM bookings 
       WHERE resource_id = $1 AND date = $2 AND time_slot = $3 
       AND status IN ('pending', 'approved')
       LIMIT 1`,
      [resourceId, date, timeSlot]
    );
    return result.rows.length === 0;
  } catch (error) {
    console.error("Error checking slot availability:", error);
    return false;
  }
}

/**
 * Get existing booking for a slot
 */
export async function getSlotBooking(resourceId, date, timeSlot) {
  try {
    const result = await pool.query(
      `SELECT booking_id, user_name, status 
       FROM bookings 
       WHERE resource_id = $1 AND date = $2 AND time_slot = $3 
       AND status IN ('pending', 'approved')
       LIMIT 1`,
      [resourceId, date, timeSlot]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting slot booking:", error);
    return null;
  }
}

/**
 * Create a new booking - with database-level constraint protection
 * =============================================================================
 * CRITICAL: The UNIQUE constraint prevents race conditions at the database level
 * 
 * Even if two users submit bookings simultaneously:
 * 1. PostgreSQL's row-level locking ensures serializable isolation
 * 2. The UNIQUE constraint (resource_id, date, time_slot, status) is checked
 * 3. Only ONE insertion can succeed; the other gets a constraint violation
 * 4. No need for application-level locking!
 * =============================================================================
 */
export async function createBooking(booking) {
  try {
    // Use RETURNING to get the created booking ID
    const result = await pool.query(
      `INSERT INTO bookings 
       (resource_id, resource_name, resource_type, date, time_slot, 
        user_id, user_name, user_email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING booking_id`,
      [
        booking.resourceId,
        booking.resourceName,
        booking.resourceType,
        booking.date,
        booking.timeSlot,
        booking.userId,
        booking.userName,
        booking.userEmail,
        "pending"
      ]
    );

    return result.rows[0].booking_id;

  } catch (error) {
    // Handle UNIQUE constraint violation (double booking attempt)
    if (error.code === "23505") { // PostgreSQL unique violation code
      console.error("Constraint violation - slot already booked");
      throw {
        code: "SLOT_ALREADY_BOOKED",
        message: "This time slot is already booked by another user",
        originalError: error
      };
    }

    // Handle other database errors
    console.error("Database error creating booking:", error);
    throw error;
  }
}

/**
 * Get all bookings (for admin)
 */
export async function getAllBookings() {
  try {
    const result = await pool.query(
      `SELECT b.*, r.name as resource_name, u.name as user_name
       FROM bookings b
       LEFT JOIN resources r ON b.resource_id = r.resource_id
       LEFT JOIN users u ON b.user_id = u.user_id
       ORDER BY b.created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting bookings:", error);
    return [];
  }
}

/**
 * Get pending bookings
 */
export async function getPendingBookings() {
  try {
    const result = await pool.query(
      `SELECT b.*, r.name as resource_name, u.name as user_name
       FROM bookings b
       LEFT JOIN resources r ON b.resource_id = r.resource_id
       LEFT JOIN users u ON b.user_id = u.user_id
       WHERE b.status = 'pending'
       ORDER BY b.created_at ASC`
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting pending bookings:", error);
    return [];
  }
}

/**
 * Get booking by ID
 */
export async function getBookingById(id) {
  try {
    const result = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting booking:", error);
    return null;
  }
}

/**
 * Update booking status (approve/reject)
 * Also uses constraint protection - only one approved booking per slot
 */
export async function updateBookingStatus(bookingId, newStatus) {
  try {
    // First get the booking to check current status
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return null;
    }

    // If approving, check for existing approved booking for this slot
    if (newStatus === "approved") {
      const conflict = await pool.query(
        `SELECT booking_id FROM bookings 
         WHERE resource_id = $1 AND date = $2 AND time_slot = $3 
         AND status = 'approved' AND booking_id != $4`,
        [booking.resource_id, booking.date, booking.time_slot, bookingId]
      );
      
      if (conflict.rows.length > 0) {
        throw {
          code: "SLOT_ALREADY_APPROVED",
          message: "Another booking is already approved for this slot"
        };
      }
    }

    const result = await pool.query(
      `UPDATE bookings 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE booking_id = $2
       RETURNING *`,
      [newStatus, bookingId]
    );

    return result.rows[0];

  } catch (error) {
    console.error("Error updating booking status:", error);
    throw error;
  }
}

// =============================================================================
// USER FUNCTIONS
// =============================================================================

export async function createUser(name, email, password, role = "user") {
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id`,
      [name, email, hashedPassword, role]
    );
    return result.rows[0].user_id;
  } catch (error) {
    if (error.code === "23505") { // Unique violation
      throw { message: "Email already exists" };
    }
    throw error;
  }
}

export async function findUserByEmail(email) {
  try {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error finding user:", error);
    return null;
  }
}

export async function verifyPassword(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

export async function getUserById(id) {
  try {
    const result = await pool.query(
      `SELECT user_id, name, email, role FROM users WHERE user_id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

// =============================================================================
// RESOURCE FUNCTIONS
// =============================================================================

export async function getAllResources() {
  try {
    const result = await pool.query(`SELECT * FROM resources ORDER BY type, name`);
    return result.rows;
  } catch (error) {
    console.error("Error getting resources:", error);
    return [];
  }
}

export async function getResourcesByType(type) {
  try {
    const result = await pool.query(
      `SELECT * FROM resources WHERE type = $1 ORDER BY name`,
      [type]
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting resources by type:", error);
    return [];
  }
}

export async function getResourceById(id) {
  try {
    const result = await pool.query(
      `SELECT * FROM resources WHERE resource_id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error getting resource:", error);
    return null;
  }
}

export async function updateResourceStatus(id, status) {
  try {
    const result = await pool.query(
      `UPDATE resources SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE resource_id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error updating resource status:", error);
    return null;
  }
}

// =============================================================================
// MAINTENANCE FUNCTIONS
// =============================================================================

export async function createMaintenanceRequest(request) {
  try {
    const result = await pool.query(
      `INSERT INTO maintenance_requests 
       (resource_id, resource_name, issue, description, user_id, user_name, user_email, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING request_id`,
      [
        request.resourceId,
        request.resourceName,
        request.issue,
        request.description,
        request.userId,
        request.userName,
        request.userEmail
      ]
    );
    return result.rows[0].request_id;
  } catch (error) {
    console.error("Error creating maintenance request:", error);
    throw error;
  }
}

export async function getAllMaintenanceRequests() {
  try {
    const result = await pool.query(
      `SELECT * FROM maintenance_requests ORDER BY created_at DESC`
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting maintenance requests:", error);
    return [];
  }
}

export async function getUserMaintenanceRequests(userId) {
  try {
    const result = await pool.query(
      `SELECT * FROM maintenance_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error("Error getting user maintenance requests:", error);
    return [];
  }
}

export async function updateMaintenanceStatus(id, status) {
  try {
    const result = await pool.query(
      `UPDATE maintenance_requests 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE request_id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error updating maintenance status:", error);
    return null;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
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
  getUserMaintenanceRequests,
  updateMaintenanceStatus,
  isSlotAvailable,
  getSlotBooking,
  pool
};

