// ====================================================================
// STUDYSPOT CAFE – STUDY CARREL MANAGEMENT SYSTEM
// Main Express Server File
// Modules 1 to 3 Backend Development Fundamentals
// ====================================================================

const express = require('express');
const { initDatabase } = require('./config/database');

// Import route modules
const studentRoutes = require('./routes/students');
const carrelRoutes = require('./routes/carrels');
const bookingRoutes = require('./routes/bookings');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Configure JSON body parser middleware
app.use(express.json());

// Request logger middleware for development clarity
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Root endpoint: project information and available API routes
app.get('/', (req, res) => {
    res.status(200).json({
        project: 'StudySpot Cafe – Study Carrel Management System',
        course: 'Backend Development Fundamentals (Modules 1 - 3)',
        version: '1.0.0',
        status: 'Online & Ready',
        description: 'REST API for managing students, study carrels, reservations, returns, and history.',
        documentation: {
            students: {
                'GET /students': 'Retrieve all registered students',
                'GET /students/:id': 'Retrieve student details by ID',
                'POST /students': 'Register a new student (Body: name, email, phone)',
                'PUT /students/:id': 'Update student details by ID',
                'DELETE /students/:id': 'Delete student by ID (blocked if bookings exist)',
                'GET /students/:id/history': 'Retrieve returned-booking history for a student'
            },
            carrels: {
                'GET /carrels': 'Retrieve all carrels (Support zone filter: ?zone=quiet)',
                'GET /carrels/:id': 'Retrieve carrel details by ID',
                'POST /carrels': 'Create a new carrel (Body: name, zone, status)',
                'PUT /carrels/:id': 'Update carrel details by ID',
                'DELETE /carrels/:id': 'Delete carrel by ID (blocked if bookings exist)'
            },
            bookings: {
                'GET /bookings': 'Retrieve all bookings',
                'GET /bookings/details': 'Retrieve detailed bookings with Student & Carrel info (SQL JOIN)',
                'GET /bookings/:id': 'Retrieve booking details by ID',
                'POST /bookings': 'Create a new booking (Body: student_id, carrel_id)',
                'POST /bookings/:id/return': 'Return an active booking (Special Twist)'
            }
        }
    });
});

// Mount modular API routes at designated paths
app.use('/students', studentRoutes);
app.use('/carrels', carrelRoutes);
app.use('/bookings', bookingRoutes);

// 404 Handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        message: `Endpoint ${req.method} ${req.originalUrl} not found on StudySpot Cafe Server`
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

// Initialize database and start HTTP server
let server = null;

async function startServer(port = process.env.PORT || 3000) {
    try {
        console.log('🔄 Initializing StudySpot Cafe SQLite database...');
        await initDatabase();

        return new Promise((resolve, reject) => {
            const runningServer = app.listen(port, () => {
                console.log('====================================================');
                console.log(`🚀 StudySpot Cafe API Server is running!`);
                console.log(`📍 URL: http://localhost:${port}`);
                console.log(`📚 Environment: Backend Development Fundamentals`);
                console.log(`📋 Explore API: http://localhost:${port}/`);
                console.log('====================================================');
                server = runningServer;
                resolve(runningServer);
            });
            runningServer.on('error', reject);
        });
    } catch (err) {
        console.error('❌ Failed to start StudySpot Cafe Server:', err.message);
        process.exit(1);
    }
}

// Start server when run directly
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
