// ====================================================================
// STUDYSPOT CAFE - STUDENT ROUTES
// Mounted at: /students
// ====================================================================

const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const {
    validateStudent,
    validateStudentUpdate,
    validateIdParam
} = require('../middleware/validation');

// GET /students - Retrieve all students
router.get('/', studentController.getAllStudents);

// GET /students/:id/history - Return only that student's returned bookings (Special Twist)
// Placed before generic param route or with param middleware
router.get('/:id/history', validateIdParam('id'), studentController.getStudentHistory);

// GET /students/:id - Retrieve a particular student
router.get('/:id', validateIdParam('id'), studentController.getStudentById);

// POST /students - Create a student
router.post('/', validateStudent, studentController.createStudent);

// PUT /students/:id - Update a student
router.put('/:id', validateIdParam('id'), validateStudentUpdate, studentController.updateStudent);

// DELETE /students/:id - Delete a student
router.delete('/:id', validateIdParam('id'), studentController.deleteStudent);

module.exports = router;
