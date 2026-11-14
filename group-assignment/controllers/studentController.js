// ====================================================================
// STUDYSPOT CAFE - STUDENT CONTROLLER
// ====================================================================

const { db } = require('../config/database');

/**
 * GET /students
 * Retrieve all students
 */
async function getAllStudents(req, res) {
    try {
        const students = await db.allAsync('SELECT * FROM students ORDER BY student_id ASC');
        res.status(200).json(students);
    } catch (err) {
        console.error('Error fetching students:', err.message);
        res.status(500).json({ message: 'Internal server error while fetching students' });
    }
}

/**
 * GET /students/:id
 * Retrieve a specific student by ID
 */
async function getStudentById(req, res) {
    try {
        const studentId = parseInt(req.params.id, 10);
        const student = await db.getAsync('SELECT * FROM students WHERE student_id = ?', [studentId]);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(student);
    } catch (err) {
        console.error('Error fetching student by ID:', err.message);
        res.status(500).json({ message: 'Internal server error while fetching student' });
    }
}

/**
 * POST /students
 * Register a new student
 */
async function createStudent(req, res) {
    try {
        const { name, email, phone = null } = req.body;

        const result = await db.runAsync(
            'INSERT INTO students (name, email, phone) VALUES (?, ?, ?)',
            [name, email, phone]
        );

        const newStudent = await db.getAsync(
            'SELECT * FROM students WHERE student_id = ?',
            [result.lastID]
        );

        res.status(201).json({
            message: 'Student created successfully',
            student: newStudent
        });
    } catch (err) {
        console.error('Error creating student:', err.message);
        res.status(500).json({ message: 'Internal server error while creating student' });
    }
}

/**
 * PUT /students/:id
 * Update an existing student's details
 */
async function updateStudent(req, res) {
    try {
        const studentId = parseInt(req.params.id, 10);
        const { name, email, phone = null } = req.body;

        // Check if student exists
        const existingStudent = await db.getAsync(
            'SELECT * FROM students WHERE student_id = ?',
            [studentId]
        );

        if (!existingStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        await db.runAsync(
            'UPDATE students SET name = ?, email = ?, phone = ? WHERE student_id = ?',
            [name, email, phone, studentId]
        );

        const updatedStudent = await db.getAsync(
            'SELECT * FROM students WHERE student_id = ?',
            [studentId]
        );

        res.status(200).json({
            message: 'Student updated successfully',
            student: updatedStudent
        });
    } catch (err) {
        console.error('Error updating student:', err.message);
        res.status(500).json({ message: 'Internal server error while updating student' });
    }
}

/**
 * DELETE /students/:id
 * Delete a student when database relationships permit it.
 * Returns HTTP 409 if deletion is blocked by existing bookings.
 */
async function deleteStudent(req, res) {
    try {
        const studentId = parseInt(req.params.id, 10);

        // Check if student exists
        const student = await db.getAsync(
            'SELECT * FROM students WHERE student_id = ?',
            [studentId]
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check for existing bookings to prevent foreign key constraint violation
        const bookingCount = await db.getAsync(
            'SELECT COUNT(*) as count FROM bookings WHERE student_id = ?',
            [studentId]
        );

        if (bookingCount.count > 0) {
            return res.status(409).json({
                message: 'Cannot delete student: existing booking records are associated with this student'
            });
        }

        await db.runAsync('DELETE FROM students WHERE student_id = ?', [studentId]);

        res.status(200).json({ message: 'Student deleted successfully' });
    } catch (err) {
        console.error('Error deleting student:', err.message);
        if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
            return res.status(409).json({
                message: 'Cannot delete student: foreign key constraint violation'
            });
        }
        res.status(500).json({ message: 'Internal server error while deleting student' });
    }
}

/**
 * GET /students/:id/history
 * Return only that student's returned bookings (returned_at IS NOT NULL).
 * Mandatory Special Twist Requirement.
 */
async function getStudentHistory(req, res) {
    try {
        const studentId = parseInt(req.params.id, 10);

        // Verify student exists
        const student = await db.getAsync(
            'SELECT * FROM students WHERE student_id = ?',
            [studentId]
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Retrieve only returned bookings with carrel information using SQL JOIN
        const query = `
            SELECT 
                b.booking_id,
                b.student_id,
                b.carrel_id,
                c.name AS carrel_name,
                c.zone,
                b.booked_at,
                b.returned_at
            FROM bookings b
            JOIN carrels c ON b.carrel_id = c.carrel_id
            WHERE b.student_id = ? AND b.returned_at IS NOT NULL
            ORDER BY b.returned_at DESC
        `;

        const history = await db.allAsync(query, [studentId]);

        res.status(200).json(history);
    } catch (err) {
        console.error('Error fetching student returned history:', err.message);
        res.status(500).json({ message: 'Internal server error while fetching student history' });
    }
}

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentHistory
};
