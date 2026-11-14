// ====================================================================
// STUDYSPOT CAFE - DATABASE VERIFICATION TEST SUITE
// Tests SQLite connection, tables, foreign keys, unique index, and constraints
// ====================================================================

const { db, initDatabase, resetDatabase } = require('../config/database');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passedTests++;
    } else {
        console.error(`  ❌ FAIL: ${testName}`);
        failedTests++;
    }
}

async function runDatabaseTests() {
    console.log('\n======================================================');
    console.log('🧪 RUNNING DATABASE TEST SUITE (tests/test-db.js)');
    console.log('======================================================\n');

    try {
        // Test 1: Initialize Database to a clean known state
        await resetDatabase();
        assert(true, 'Database initialized successfully');

        // Test 2: Verify Foreign Key Enforcement is Enabled
        const fkStatus = await db.getAsync('PRAGMA foreign_keys');
        assert(fkStatus && (fkStatus.foreign_keys === 1 || fkStatus.foreign_keys === '1'), 'Foreign key enforcement is enabled (PRAGMA foreign_keys = 1)');

        // Test 3: Verify All Three Tables Exist
        const tables = await db.allAsync(
            "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('students', 'carrels', 'bookings')"
        );
        const tableNames = tables.map(t => t.name);
        assert(tableNames.includes('students'), 'Table "students" exists');
        assert(tableNames.includes('carrels'), 'Table "carrels" exists');
        assert(tableNames.includes('bookings'), 'Table "bookings" exists');

        // Test 4: Verify Unique Index for Active Carrel Bookings
        const indexes = await db.allAsync(
            "SELECT name FROM sqlite_master WHERE type='index' AND name='idx_active_carrel_booking'"
        );
        assert(indexes.length > 0, 'Unique index "idx_active_carrel_booking" exists');

        // Test 5: Verify Students Table Structure
        const studentCols = await db.allAsync('PRAGMA table_info(students)');
        const sColNames = studentCols.map(c => c.name);
        assert(
            sColNames.includes('student_id') &&
            sColNames.includes('name') &&
            sColNames.includes('email') &&
            sColNames.includes('phone'),
            'Students table contains all required columns: student_id, name, email, phone'
        );

        // Test 6: Verify Carrels Table Structure
        const carrelCols = await db.allAsync('PRAGMA table_info(carrels)');
        const cColNames = carrelCols.map(c => c.name);
        assert(
            cColNames.includes('carrel_id') &&
            cColNames.includes('name') &&
            cColNames.includes('zone') &&
            cColNames.includes('status'),
            'Carrels table contains all required columns: carrel_id, name, zone, status'
        );

        // Test 7: Verify Bookings Table Structure
        const bookingCols = await db.allAsync('PRAGMA table_info(bookings)');
        const bColNames = bookingCols.map(c => c.name);
        assert(
            bColNames.includes('booking_id') &&
            bColNames.includes('student_id') &&
            bColNames.includes('carrel_id') &&
            bColNames.includes('booked_at') &&
            bColNames.includes('returned_at'),
            'Bookings table contains all required columns: booking_id, student_id, carrel_id, booked_at, returned_at'
        );

        // Test 8: Foreign Key Constraint Enforcement
        let fkBlocked = false;
        try {
            // Attempt inserting booking with invalid student_id 999999 and available carrel 3
            await db.runAsync('INSERT INTO bookings (student_id, carrel_id) VALUES (999999, 3)');
        } catch (err) {
            fkBlocked = err.message.includes('FOREIGN KEY constraint failed');
        }
        assert(fkBlocked, 'Foreign key constraint blocks booking with non-existent student_id');

        // Test 9: Active Booking Uniqueness Constraint Enforcement
        // Carrel 1 has an active booking from initial seed. Trying to insert another active booking on carrel 1 should fail.
        let activeBlocked = false;
        try {
            await db.runAsync('INSERT INTO bookings (student_id, carrel_id) VALUES (2, 1)');
        } catch (err) {
            activeBlocked = err.message.includes('UNIQUE constraint failed') || err.message.includes('idx_active_carrel_booking');
        }
        assert(activeBlocked, 'Unique index prevents multiple active bookings for the same carrel');

        console.log('\n------------------------------------------------------');
        console.log(`Database Tests Finished: ${passedTests} Passed, ${failedTests} Failed`);
        console.log('------------------------------------------------------\n');

        if (failedTests > 0) {
            process.exit(1);
        }
    } catch (err) {
        console.error('Fatal error during database tests:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    runDatabaseTests();
}

module.exports = runDatabaseTests;
