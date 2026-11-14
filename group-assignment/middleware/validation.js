// ====================================================================
// STUDYSPOT CAFE - REQUEST VALIDATION MIDDLEWARE
// ====================================================================

/**
 * Validates request body for student creation (POST /students)
 */
function validateStudent(req, res, next) {
    const { name, email, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Student name is required' });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ message: 'Student email is required' });
    }

    // Standard email pattern check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'A valid email address is required' });
    }

    if (phone !== undefined && phone !== null && typeof phone !== 'string') {
        return res.status(400).json({ message: 'Phone must be a valid text string' });
    }

    req.body.name = name.trim();
    req.body.email = email.trim();
    if (phone) req.body.phone = phone.trim();

    next();
}

/**
 * Validates request body for student update (PUT /students/:id)
 */
function validateStudentUpdate(req, res, next) {
    const { name, email, phone } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Student name is required' });
    }

    if (!email || typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({ message: 'Student email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'A valid email address is required' });
    }

    req.body.name = name.trim();
    req.body.email = email.trim();
    if (phone !== undefined && phone !== null) req.body.phone = String(phone).trim();

    next();
}

/**
 * Validates request body for carrel creation (POST /carrels)
 */
function validateCarrel(req, res, next) {
    const { name, zone, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Carrel name is required' });
    }

    if (!zone || typeof zone !== 'string' || zone.trim() === '') {
        return res.status(400).json({ message: 'Carrel zone is required' });
    }

    if (status !== undefined && status !== null) {
        const allowedStatuses = ['available', 'occupied'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Carrel status must be either 'available' or 'occupied'"
            });
        }
    }

    req.body.name = name.trim();
    req.body.zone = zone.trim();
    req.body.status = status ? status.toLowerCase() : 'available';

    next();
}

/**
 * Validates request body for carrel update (PUT /carrels/:id)
 */
function validateCarrelUpdate(req, res, next) {
    const { name, zone, status } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Carrel name is required' });
    }

    if (!zone || typeof zone !== 'string' || zone.trim() === '') {
        return res.status(400).json({ message: 'Carrel zone is required' });
    }

    if (status !== undefined && status !== null) {
        const allowedStatuses = ['available', 'occupied'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Carrel status must be either 'available' or 'occupied'"
            });
        }
    }

    req.body.name = name.trim();
    req.body.zone = zone.trim();
    if (status) req.body.status = status.toLowerCase();

    next();
}

/**
 * Validates request body for booking creation (POST /bookings)
 */
function validateBooking(req, res, next) {
    const { student_id, carrel_id } = req.body;

    if (student_id === undefined || student_id === null || isNaN(Number(student_id)) || Number(student_id) <= 0) {
        return res.status(400).json({ message: 'Valid student_id is required' });
    }

    if (carrel_id === undefined || carrel_id === null || isNaN(Number(carrel_id)) || Number(carrel_id) <= 0) {
        return res.status(400).json({ message: 'Valid carrel_id is required' });
    }

    req.body.student_id = parseInt(student_id, 10);
    req.body.carrel_id = parseInt(carrel_id, 10);

    next();
}

/**
 * Validates that an ID path parameter is a valid positive integer
 */
function validateIdParam(paramName = 'id') {
    return (req, res, next) => {
        const val = req.params[paramName];
        const num = Number(val);
        if (!val || isNaN(num) || !Number.isInteger(num) || num <= 0) {
            return res.status(400).json({
                message: `Invalid ${paramName} parameter: must be a positive integer`
            });
        }
        next();
    };
}

module.exports = {
    validateStudent,
    validateStudentUpdate,
    validateCarrel,
    validateCarrelUpdate,
    validateBooking,
    validateIdParam
};
