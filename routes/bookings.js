// ====================================================================
// STUDYSPOT CAFE - BOOKING ROUTES
// Mounted at: /bookings
// ====================================================================

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const {
    validateBooking,
    validateIdParam
} = require('../middleware/validation');

// GET /bookings - Retrieve all bookings
router.get('/', bookingController.getAllBookings);

// GET /bookings/details - Real SQL JOIN between bookings, students, and carrels
// CRITICAL: Must be registered BEFORE /bookings/:id so 'details' is not parsed as an ID parameter!
router.get('/details', bookingController.getBookingDetails);

// POST /bookings/:id/return - Special Twist: Return booking flow
router.post('/:id/return', validateIdParam('id'), bookingController.returnBooking);

// GET /bookings/:id - Retrieve one booking by ID
router.get('/:id', validateIdParam('id'), bookingController.getBookingById);

// POST /bookings - Create a new booking
router.post('/', validateBooking, bookingController.createBooking);

module.exports = router;
