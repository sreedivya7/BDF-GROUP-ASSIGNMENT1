// ====================================================================
// STUDYSPOT CAFE - CARREL CONTROLLER
// ====================================================================

const { db } = require('../config/database');

/**
 * GET /carrels
 * Retrieve all carrels, with optional case-insensitive zone search query:
 * e.g. GET /carrels?zone=quiet
 */
async function getAllCarrels(req, res) {
    try {
        const { zone } = req.query;

        if (zone !== undefined && zone !== null && zone.trim() !== '') {
            // Case-insensitive zone search using SQL LIKE
            const searchQuery = `
                SELECT * FROM carrels 
                WHERE LOWER(zone) LIKE LOWER(?) 
                ORDER BY carrel_id ASC
            `;
            const carrels = await db.allAsync(searchQuery, [`%${zone.trim()}%`]);
            return res.status(200).json(carrels);
        }

        // Standard retrieval of all carrels
        const carrels = await db.allAsync('SELECT * FROM carrels ORDER BY carrel_id ASC');
        res.status(200).json(carrels);
    } catch (err) {
        console.error('Error fetching carrels:', err.message);
        res.status(500).json({ message: 'Internal server error while fetching carrels' });
    }
}

/**
 * GET /carrels/:id
 * Retrieve a single carrel by ID
 */
async function getCarrelById(req, res) {
    try {
        const carrelId = parseInt(req.params.id, 10);
        const carrel = await db.getAsync('SELECT * FROM carrels WHERE carrel_id = ?', [carrelId]);

        if (!carrel) {
            return res.status(404).json({ message: 'Carrel not found' });
        }

        res.status(200).json(carrel);
    } catch (err) {
        console.error('Error fetching carrel by ID:', err.message);
        res.status(500).json({ message: 'Internal server error while fetching carrel' });
    }
}

/**
 * POST /carrels
 * Create a new study carrel
 */
async function createCarrel(req, res) {
    try {
        const { name, zone, status = 'available' } = req.body;

        const result = await db.runAsync(
            'INSERT INTO carrels (name, zone, status) VALUES (?, ?, ?)',
            [name, zone, status]
        );

        const newCarrel = await db.getAsync(
            'SELECT * FROM carrels WHERE carrel_id = ?',
            [result.lastID]
        );

        res.status(201).json({
            message: 'Carrel created successfully',
            carrel: newCarrel
        });
    } catch (err) {
        console.error('Error creating carrel:', err.message);
        res.status(500).json({ message: 'Internal server error while creating carrel' });
    }
}

/**
 * PUT /carrels/:id
 * Update an existing carrel's information
 */
async function updateCarrel(req, res) {
    try {
        const carrelId = parseInt(req.params.id, 10);
        const { name, zone, status } = req.body;

        // Check if carrel exists
        const existingCarrel = await db.getAsync(
            'SELECT * FROM carrels WHERE carrel_id = ?',
            [carrelId]
        );

        if (!existingCarrel) {
            return res.status(404).json({ message: 'Carrel not found' });
        }

        const newStatus = status ? status : existingCarrel.status;

        await db.runAsync(
            'UPDATE carrels SET name = ?, zone = ?, status = ? WHERE carrel_id = ?',
            [name, zone, newStatus, carrelId]
        );

        const updatedCarrel = await db.getAsync(
            'SELECT * FROM carrels WHERE carrel_id = ?',
            [carrelId]
        );

        res.status(200).json({
            message: 'Carrel updated successfully',
            carrel: updatedCarrel
        });
    } catch (err) {
        console.error('Error updating carrel:', err.message);
        res.status(500).json({ message: 'Internal server error while updating carrel' });
    }
}

/**
 * DELETE /carrels/:id
 * Delete a carrel when database relationships permit it.
 * Returns HTTP 409 if deletion is blocked by existing bookings.
 */
async function deleteCarrel(req, res) {
    try {
        const carrelId = parseInt(req.params.id, 10);

        // Check if carrel exists
        const carrel = await db.getAsync(
            'SELECT * FROM carrels WHERE carrel_id = ?',
            [carrelId]
        );

        if (!carrel) {
            return res.status(404).json({ message: 'Carrel not found' });
        }

        // Check for existing bookings
        const bookingCount = await db.getAsync(
            'SELECT COUNT(*) as count FROM bookings WHERE carrel_id = ?',
            [carrelId]
        );

        if (bookingCount.count > 0) {
            return res.status(409).json({
                message: 'Cannot delete carrel: existing booking records are associated with this carrel'
            });
        }

        await db.runAsync('DELETE FROM carrels WHERE carrel_id = ?', [carrelId]);

        res.status(200).json({ message: 'Carrel deleted successfully' });
    } catch (err) {
        console.error('Error deleting carrel:', err.message);
        if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
            return res.status(409).json({
                message: 'Cannot delete carrel: foreign key constraint violation'
            });
        }
        res.status(500).json({ message: 'Internal server error while deleting carrel' });
    }
}

module.exports = {
    getAllCarrels,
    getCarrelById,
    createCarrel,
    updateCarrel,
    deleteCarrel
};
