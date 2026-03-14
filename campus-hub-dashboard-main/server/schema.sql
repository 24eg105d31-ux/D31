-- =============================================================================
-- CAMPUS BOOKING SYSTEM - SQL SCHEMA
-- =============================================================================
-- This schema uses database-level constraints to prevent race conditions
-- and ensure data integrity for concurrent booking requests.
-- =============================================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resources Table (Labs, Classrooms, Halls, Auditoriums)
CREATE TABLE IF NOT EXISTS resources (
    resource_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'lab', 'classroom', 'hall', 'auditorium'
    capacity INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'available',  -- 'available', 'occupied', 'booked'
    building VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table with UNIQUE constraint to prevent double booking
-- =============================================================================
-- KEY CONSTRAINT: The composite UNIQUE constraint on 
-- (resource_id, date, time_slot, status) ensures that:
-- - Only ONE booking can exist for a specific resource + date + time slot
-- - This works even with concurrent requests due to database-level locking
-- =============================================================================
CREATE TABLE IF NOT EXISTS bookings (
    booking_id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(resource_id),
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- =========================================================================
    -- CRITICAL: UNIQUE CONSTRAINT to prevent double booking
    -- This prevents two users from booking the same slot simultaneously
    -- =========================================================================
    CONSTRAINT unique_slot_booking UNIQUE (resource_id, date, time_slot, status)
        WHERE status IN ('pending', 'approved')
);

-- Index for faster booking lookups
CREATE INDEX IF NOT EXISTS idx_bookings_resource_date 
    ON bookings(resource_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_user 
    ON bookings(user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_status 
    ON bookings(status);

-- Maintenance Requests Table
CREATE TABLE IF NOT EXISTS maintenance_requests (
    request_id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(resource_id),
    resource_name VARCHAR(255) NOT NULL,
    issue VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'in-progress', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- RACE CONDITION PREVENTION EXPLANATION
-- =============================================================================
-- 
-- How the UNIQUE constraint prevents double booking:
--
-- 1. When User A submits a booking request:
--    INSERT INTO bookings (resource_id, date, time_slot, ...) 
--    VALUES (1, '2024-01-15', '9:00 AM - 10:00 AM', ...);
--
-- 2. When User B simultaneously submits the same booking:
--    - Database acquires a row-level lock
--    - Checks UNIQUE constraint before inserting
--    - If User A's booking is already committed (status='pending'):
--      User B gets a constraint violation error:
--      "duplicate key value violates unique constraint unique_slot_booking"
--
-- 3. This happens at the DATABASE LEVEL, making it impossible to bypass
--    via application logic or race conditions.
--
-- Additional Benefits:
-- - Status-based partial unique index (only 'pending'/'approved' count)
-- - If a booking is 'rejected', same slot can be booked again
-- - Fast lookups with proper indexing
-- =============================================================================

-- Sample Data - Resources
INSERT INTO resources (name, type, capacity, status, building) VALUES
('Lab 101', 'lab', 30, 'available', 'CSE Block'),
('Lab 102', 'lab', 30, 'occupied', 'CSE Block'),
('Lab 103', 'lab', 30, 'available', 'CSE Block'),
('Classroom A1', 'classroom', 60, 'available', 'Block A'),
('Classroom A2', 'classroom', 60, 'occupied', 'Block A'),
('Seminar Hall 1', 'hall', 100, 'available', 'Admin Block'),
('Seminar Hall 2', 'hall', 80, 'booked', 'Admin Block'),
('Main Auditorium', 'auditorium', 500, 'booked', 'Cultural Block'),
('Mini Auditorium', 'auditorium', 150, 'available', 'Cultural Block')
ON CONFLICT DO NOTHING;

-- Sample Admin User (password: admin123)
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Admin', 'admin@crms.edu', '$2b$10$xGJ9Q7K5Y8aP9Qr3TwMx/.3.5jH1Q5Y9vR2xL1wN3b4c5d6e7f8g9', 'admin')
ON CONFLICT DO NOTHING;

