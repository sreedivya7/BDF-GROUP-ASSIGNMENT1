// ====================================================================
// STUDYSPOT CAFE - BOOKING CONTROLLER
// ====================================================================

const { db } = require('../config/database');

/**
 * GET /bookings
 * Retrieve all bookings
 */
async function getAllBookings(req, res) {
    try {
        const bookings = await db.allAsync('SELECT * FROM bookings ORDER BY booking_id ASC');
        res.status(200).json(bookings);
    } catch (err) {
        console.error('Error fetching bookings:', err.message);
        res.status(500).json({ message: 'Internal server error while fetching bookings' });
    }
}

/**
 * GET /bookings/details
 * Real SQL JOIN between bookings, students, and carrels.
 * Returns enriched booking records with student and carrel details.
 * (Registered before /bookings/:id in routes)
 */
async function getBookingDetails(req, res) {
    try {
        const query = `
            SELECT 
                b.booking_id,
                b.student_id,
                s.name AS student_name,
                s.email AS student_email,
                b.carrel_id,
                c.name AS carrel_name,
                c.zone AS carrel_zone,
                b.booked_at,
                b.returned_at,
                c.status AS carrel_status
            FROM bookings b
            JOIN students s ON b.student_id = s.student_id
            JOIN carrels c ON b.carrel_id = c.carrel_id
            ORDER BY b.booking_id ASC
        `;

        const details = await db.allAsync(query);
        res.status(200).json(details);
    } catch (err) {
        console.error('Error fetching booking details with SQL JOIN:', err.message);
        res.status(500).json({ message: 'Internal server error while fetching booking details' });
    }
}

/**
 * GET /bookings/:id
 * Retrieve a single booking by ID
 */
async function getBookingById(req, res) {
    try {
        const bookingId = parseInt(req.params.id, 10);
        const booking = await db.getAsync('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json(booking);
    } catch (err) {
        console.error('Error fetching booking by ID:', err.message);
        res.status(500).json({ message: 'Internal server error while fetching booking' });
    }
}

/**
 * POST /bookings
 * Create a new booking
 * Performs required 6-step verification:
 * 1. Check whether student exists
 * 2. Check whether carrel exists
 * 3. Check whether carrel is available
 * 4. Ensure carrel does not already have an active booking
 * 5. Create booking record
 * 6. Update carrel status to 'occupied'
 */
async function createBooking(req, res) {
    try {
        const { student_id, carrel_id } = req.body;

        // Step 1: Check whether student exists
        const student = await db.getAsync(
            'SELECT * FROM students WHERE student_id = ?',
            [student_id]
        );
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Step 2: Check whether carrel exists
        const carrel = await db.getAsync(
            'SELECT * FROM carrels WHERE carrel_id = ?',
            [carrel_id]
        );
        if (!carrel) {
            return res.status(404).json({ message: 'Carrel not found' });
        }

        // Step 3: Check whether carrel is available
        if (carrel.status !== 'available') {
            return res.status(400).json({
                message: 'Carrel is currently occupied and not available for booking'
            });
        }

        // Step 4: Ensure the carrel does not already have an active booking
        const activeBooking = await db.getAsync(
            'SELECT * FROM bookings WHERE carrel_id = ? AND returned_at IS NULL',
            [carrel_id]
        );
        if (activeBooking) {
            return res.status(409).json({
                message: 'Carrel already has an active booking'
            });
        }

        // Step 5: Create the booking
        const result = await db.runAsync(
            'INSERT INTO bookings (student_id, carrel_id, booked_at, returned_at) VALUES (?, ?, CURRENT_TIMESTAMP, NULL)',
            [student_id, carrel_id]
        );

        // Step 6: Update carrel status to occupied
        await db.runAsync(
            "UPDATE carrels SET status = 'occupied' WHERE carrel_id = ?",
            [carrel_id]
        );

        const newBooking = await db.getAsync(
            'SELECT * FROM bookings WHERE booking_id = ?',
            [result.lastID]
        );

        res.status(201).json({
            message: 'Booking created successfully',
            booking: newBooking
        });
    } catch (err) {
        console.error('Error creating booking:', err.message);
        if (err.message && err.message.includes('idx_active_carrel_booking')) {
            return res.status(409).json({
                message: 'Carrel already has an active booking (constraint violation)'
            });
        }
        res.status(500).json({ message: 'Internal server error while creating booking' });
    }
}

/**
 * POST /bookings/:id/return
 * Special Assignment Twist: Return Flow
 * 1. Find the booking
 * 2. Check whether it exists (404 if not found)
 * 3. Check whether it has already been returned (409 "Already returned" if returned_at IS NOT NULL)
 * 4. Set returned_at to current timestamp
 * 5. Update carrel status to 'available'
 * 6. Return HTTP 200 with message "Booking returned successfully"
 */
async function returnBooking(req, res) {
    try {
        const bookingId = parseInt(req.params.id, 10);

        // Step 1: Find the booking
        const booking = await db.getAsync(
            'SELECT * FROM bookings WHERE booking_id = ?',
            [bookingId]
        );

        // Step 2: Check whether booking exists
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Step 3: Check whether it has already been returned
        if (booking.returned_at !== null) {
            return res.status(409).json({
                message: 'Already returned'
            });
        }

        // Step 4: Set returned_at to the current timestamp
        await db.runAsync(
            'UPDATE bookings SET returned_at = CURRENT_TIMESTAMP WHERE booking_id = ?',
            [bookingId]
        );

        // Step 5: Update the corresponding carrel status to 'available'
        await db.runAsync(
            "UPDATE carrels SET status = 'available' WHERE carrel_id = ?",
            [booking.carrel_id]
        );

        // Step 6: Return HTTP 200
        res.status(200).json({
            message: 'Booking returned successfully'
        });
    } catch (err) {
        console.error('Error returning booking:', err.message);
        res.status(500).json({ message: 'Internal server error while returning booking' });
    }
}

module.exports = {
    getAllBookings,
    getBookingDetails,
    getBookingById,
    createBooking,
    returnBooking
};
