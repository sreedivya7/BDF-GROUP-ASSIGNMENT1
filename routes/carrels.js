// ====================================================================
// STUDYSPOT CAFE - CARREL ROUTES
// Mounted at: /carrels
// ====================================================================

const express = require('express');
const router = express.Router();
const carrelController = require('../controllers/carrelController');
const {
    validateCarrel,
    validateCarrelUpdate,
    validateIdParam
} = require('../middleware/validation');

// GET /carrels - Retrieve all carrels or search by zone query (e.g. /carrels?zone=quiet)
router.get('/', carrelController.getAllCarrels);

// GET /carrels/:id - Retrieve one carrel
router.get('/:id', validateIdParam('id'), carrelController.getCarrelById);

// POST /carrels - Create a carrel
router.post('/', validateCarrel, carrelController.createCarrel);

// PUT /carrels/:id - Update a carrel
router.put('/:id', validateIdParam('id'), validateCarrelUpdate, carrelController.updateCarrel);

// DELETE /carrels/:id - Delete a carrel
router.delete('/:id', validateIdParam('id'), carrelController.deleteCarrel);

module.exports = router;
