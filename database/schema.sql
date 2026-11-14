-- ====================================================================
-- STUDYSPOT CAFE - DATABASE SCHEMA
-- Backend Development Fundamentals (Modules 1 - 3)
-- ====================================================================

-- 1. Enable SQLite Foreign Key Constraints Enforcement
PRAGMA foreign_keys = ON;

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT
);

-- 3. Study Carrels Table
CREATE TABLE IF NOT EXISTS carrels (
    carrel_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied'))
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    carrel_id INTEGER NOT NULL,
    booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME DEFAULT NULL,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE RESTRICT,
    FOREIGN KEY (carrel_id) REFERENCES carrels(carrel_id) ON DELETE RESTRICT
);

-- 5. Unique Index to Prevent Simultaneous Active Bookings on the Same Carrel
-- An active booking is one where returned_at IS NULL.
-- Multiple past/returned bookings for the same carrel are allowed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_carrel_booking 
ON bookings (carrel_id) 
WHERE returned_at IS NULL;
