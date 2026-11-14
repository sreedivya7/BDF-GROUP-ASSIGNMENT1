// ====================================================================
// STUDYSPOT CAFE - DATABASE CONFIGURATION & INITIALIZATION
// ====================================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Path to SQLite database file in the project root
const dbPath = path.join(__dirname, '..', 'studyspot.db');

// Create or open the SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error opening SQLite database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database:', dbPath);
        // Ensure foreign keys are always enabled on connection
        db.run('PRAGMA foreign_keys = ON;', (fkErr) => {
            if (fkErr) console.error('Failed to enable foreign keys:', fkErr.message);
        });
    }
});

// Wrap sqlite3 callback methods in Promises for clean async/await usage
db.runAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                return reject(err);
            }
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

db.getAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                return reject(err);
            }
            resolve(row);
        });
    });
};

db.allAsync = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                return reject(err);
            }
            resolve(rows);
        });
    });
};

/**
 * Initializes the database tables and populates seed data if empty.
 */
async function initDatabase() {
    try {
        // Enforce SQLite Foreign Key constraints
        await db.runAsync('PRAGMA foreign_keys = ON;');

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Execute table and index creation statements sequentially
        await new Promise((resolve, reject) => {
            db.exec(schemaSql, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });

        // Seed initial data if tables are empty
        const studentCount = await db.getAsync('SELECT COUNT(*) as count FROM students');
        if (studentCount.count === 0) {
            console.log('🌱 Seeding initial sample data for StudySpot Cafe...');

            // Seed sample students
            await db.runAsync('INSERT INTO students (name, email, phone) VALUES (?, ?, ?)', [
                'Alice Johnson',
                'alice.johnson@campus.edu',
                '555-0101'
            ]);
            await db.runAsync('INSERT INTO students (name, email, phone) VALUES (?, ?, ?)', [
                'Bob Smith',
                'bob.smith@campus.edu',
                '555-0102'
            ]);
            await db.runAsync('INSERT INTO students (name, email, phone) VALUES (?, ?, ?)', [
                'Charlie Davis',
                'charlie.davis@campus.edu',
                '555-0103'
            ]);
            await db.runAsync('INSERT INTO students (name, email, phone) VALUES (?, ?, ?)', [
                'Diana Prince',
                'diana.prince@campus.edu',
                '555-0104'
            ]);

            // Seed sample carrels across zones
            await db.runAsync('INSERT INTO carrels (name, zone, status) VALUES (?, ?, ?)', [
                'Carrel A-01',
                'Quiet Zone',
                'occupied'
            ]);
            await db.runAsync('INSERT INTO carrels (name, zone, status) VALUES (?, ?, ?)', [
                'Carrel A-02',
                'Quiet Zone',
                'available'
            ]);
            await db.runAsync('INSERT INTO carrels (name, zone, status) VALUES (?, ?, ?)', [
                'Carrel B-01',
                'Collaborative Zone',
                'available'
            ]);
            await db.runAsync('INSERT INTO carrels (name, zone, status) VALUES (?, ?, ?)', [
                'Carrel B-02',
                'Collaborative Zone',
                'available'
            ]);
            await db.runAsync('INSERT INTO carrels (name, zone, status) VALUES (?, ?, ?)', [
                'Carrel C-01',
                'Silent Pod',
                'available'
            ]);

            // Seed an active initial booking for Student 1 and Carrel 1
            await db.runAsync('INSERT INTO bookings (student_id, carrel_id, booked_at, returned_at) VALUES (?, ?, datetime("now", "-2 hours"), NULL)', [
                1,
                1
            ]);

            console.log('✅ Initial seed data populated successfully.');
        }

        console.log('✅ Database initialized successfully with foreign key constraints enabled.');
        return db;
    } catch (err) {
        console.error('❌ Failed to initialize database schema:', err.message);
        throw err;
    }
}

/**
 * Resets database tables and re-populates seed data for a fresh testing state.
 */
async function resetDatabase() {
    try {
        await db.runAsync('PRAGMA foreign_keys = OFF;');
        await db.runAsync('DROP TABLE IF EXISTS bookings;');
        await db.runAsync('DROP TABLE IF EXISTS carrels;');
        await db.runAsync('DROP TABLE IF EXISTS students;');
        await db.runAsync('PRAGMA foreign_keys = ON;');
        await initDatabase();
        return db;
    } catch (err) {
        console.error('❌ Failed to reset database:', err.message);
        throw err;
    }
}

module.exports = {
    db,
    initDatabase,
    resetDatabase
};
