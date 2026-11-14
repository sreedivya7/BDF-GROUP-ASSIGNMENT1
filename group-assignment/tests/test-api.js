// ====================================================================
// STUDYSPOT CAFE - COMPLETE API & RETURN-FLOW TEST SUITE
// Tests all endpoints, validations, zone search, SQL JOIN, and
// explicitly validates the 3 Mandatory Special Twist tests!
// ====================================================================

const { app, startServer } = require('../server');
const { db, resetDatabase } = require('../config/database');

let passedTests = 0;
let failedTests = 0;
const results = [];

function recordTest(passed, name, details = '') {
    if (passed) {
        console.log(`  ✅ PASS: ${name}`);
        passedTests++;
        results.push({ name, status: 'PASS', details });
    } else {
        console.error(`  ❌ FAIL: ${name} - ${details}`);
        failedTests++;
        results.push({ name, status: 'FAIL', details });
    }
}

async function runApiTests() {
    console.log('\n======================================================');
    console.log('🧪 RUNNING FULL API TEST SUITE (tests/test-api.js)');
    console.log('======================================================\n');

    const TEST_PORT = 3100;

    let serverInstance;
    try {
        console.log('🔄 Resetting database to clean testing state...');
        await resetDatabase();
        serverInstance = await startServer(TEST_PORT);
    } catch (err) {
        console.error('Failed to start server for test:', err);
        process.exit(1);
    }

    const baseUrl = `http://localhost:${TEST_PORT}`;

    try {
        // ----------------------------------------------------
        // 1. ROOT ENDPOINT
        // ----------------------------------------------------
        console.log('\n--- 1. Testing Root Endpoint ---');
        const rootRes = await fetch(`${baseUrl}/`);
        const rootData = await rootRes.json();
        recordTest(
            rootRes.status === 200 && rootData.project && rootData.documentation,
            'GET / returns 200 and project documentation',
            `Status: ${rootRes.status}`
        );

        // ----------------------------------------------------
        // 2. STUDENT CRUD & VALIDATION
        // ----------------------------------------------------
        console.log('\n--- 2. Testing Student Endpoints ---');

        // GET /students
        const studentsRes = await fetch(`${baseUrl}/students`);
        const studentsData = await studentsRes.json();
        recordTest(
            studentsRes.status === 200 && Array.isArray(studentsData) && studentsData.length >= 1,
            'GET /students returns 200 and student list',
            `Count: ${studentsData.length}`
        );

        // GET /students/1
        const student1Res = await fetch(`${baseUrl}/students/1`);
        const student1Data = await student1Res.json();
        recordTest(
            student1Res.status === 200 && student1Data.student_id === 1,
            'GET /students/1 returns student details',
            `Student Name: ${student1Data.name}`
        );

        // GET /students/9999 (Not Found)
        const studentNotFoundRes = await fetch(`${baseUrl}/students/9999`);
        recordTest(
            studentNotFoundRes.status === 404,
            'GET /students/9999 returns 404 Not Found',
            `Status: ${studentNotFoundRes.status}`
        );

        // POST /students - Validation Failure (Missing Email)
        const invalidStudentRes = await fetch(`${baseUrl}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Incomplete Student' })
        });
        const invalidStudentData = await invalidStudentRes.json();
        recordTest(
            invalidStudentRes.status === 400 && invalidStudentData.message.includes('email'),
            'POST /students validates required email with 400 Bad Request',
            `Message: ${invalidStudentData.message}`
        );

        // POST /students - Success
        const createStudentRes = await fetch(`${baseUrl}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Temp Student For Deletion',
                email: 'temp.del@campus.edu',
                phone: '555-9999'
            })
        });
        const createStudentData = await createStudentRes.json();
        const createdStudentId = createStudentData.student?.student_id;
        recordTest(
            createStudentRes.status === 201 && createdStudentId > 0,
            'POST /students creates new student with 201 Created',
            `Created ID: ${createdStudentId}`
        );

        // PUT /students/:id - Update
        const updateStudentRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Updated Temp Student',
                email: 'updated.temp@campus.edu',
                phone: '555-8888'
            })
        });
        const updateStudentData = await updateStudentRes.json();
        recordTest(
            updateStudentRes.status === 200 && updateStudentData.student?.name === 'Updated Temp Student',
            'PUT /students/:id updates student with 200 OK',
            `Updated Name: ${updateStudentData.student?.name}`
        );

        // DELETE /students/:id - Delete unattached student (Allowed)
        const deleteStudentRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
            method: 'DELETE'
        });
        recordTest(
            deleteStudentRes.status === 200,
            'DELETE /students/:id deletes student with no bookings (200 OK)',
            `Status: ${deleteStudentRes.status}`
        );

        // DELETE /students/1 - Attempt deleting student with bookings (Blocked)
        const deleteBlockedStudentRes = await fetch(`${baseUrl}/students/1`, {
            method: 'DELETE'
        });
        recordTest(
            deleteBlockedStudentRes.status === 409,
            'DELETE /students/1 blocked by existing bookings with 409 Conflict',
            `Status: ${deleteBlockedStudentRes.status}`
        );

        // ----------------------------------------------------
        // 3. CARREL CRUD, SEARCH & VALIDATION
        // ----------------------------------------------------
        console.log('\n--- 3. Testing Carrel Endpoints & Zone Search ---');

        // GET /carrels
        const carrelsRes = await fetch(`${baseUrl}/carrels`);
        const carrelsData = await carrelsRes.json();
        recordTest(
            carrelsRes.status === 200 && Array.isArray(carrelsData) && carrelsData.length >= 1,
            'GET /carrels returns 200 and carrels list',
            `Count: ${carrelsData.length}`
        );

        // GET /carrels/:id
        const carrel1Res = await fetch(`${baseUrl}/carrels/1`);
        const carrel1Data = await carrel1Res.json();
        recordTest(
            carrel1Res.status === 200 && carrel1Data.carrel_id === 1,
            'GET /carrels/1 returns carrel details',
            `Carrel: ${carrel1Data.name}`
        );

        // Case-Insensitive Zone Search: GET /carrels?zone=quiet
        const zoneSearchRes = await fetch(`${baseUrl}/carrels?zone=quiet`);
        const zoneSearchData = await zoneSearchRes.json();
        recordTest(
            zoneSearchRes.status === 200 &&
            Array.isArray(zoneSearchData) &&
            zoneSearchData.length > 0 &&
            zoneSearchData.every(c => c.zone.toLowerCase().includes('quiet')),
            'GET /carrels?zone=quiet performs case-insensitive zone search',
            `Found ${zoneSearchData.length} quiet carrels`
        );

        // Zone Search: Non-matching returns empty array
        const emptyZoneRes = await fetch(`${baseUrl}/carrels?zone=NonExistentZoneXYZ`);
        const emptyZoneData = await emptyZoneRes.json();
        recordTest(
            emptyZoneRes.status === 200 && Array.isArray(emptyZoneData) && emptyZoneData.length === 0,
            'GET /carrels?zone=NonExistentZoneXYZ returns empty array [] with 200 OK',
            `Length: ${emptyZoneData.length}`
        );

        // POST /carrels - Validation: Missing Name
        const missingNameRes = await fetch(`${baseUrl}/carrels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zone: 'Quiet Zone' })
        });
        const missingNameData = await missingNameRes.json();
        recordTest(
            missingNameRes.status === 400 && missingNameData.message === 'Carrel name is required',
            'POST /carrels rejects missing name with 400 Bad Request',
            `Message: ${missingNameData.message}`
        );

        // POST /carrels - Validation: Invalid Status
        const invalidStatusRes = await fetch(`${baseUrl}/carrels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Carrel X', zone: 'Silent', status: 'broken' })
        });
        const invalidStatusData = await invalidStatusRes.json();
        recordTest(
            invalidStatusRes.status === 400 && invalidStatusData.message.includes('available'),
            'POST /carrels rejects invalid status with 400 Bad Request',
            `Message: ${invalidStatusData.message}`
        );

        // POST /carrels - Success
        const createCarrelRes = await fetch(`${baseUrl}/carrels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Carrel Test-Del',
                zone: 'Testing Zone',
                status: 'available'
            })
        });
        const createCarrelData = await createCarrelRes.json();
        const createdCarrelId = createCarrelData.carrel?.carrel_id;
        recordTest(
            createCarrelRes.status === 201 && createdCarrelId > 0,
            'POST /carrels creates new carrel with 201 Created',
            `Created Carrel ID: ${createdCarrelId}`
        );

        // PUT /carrels/:id - Update
        const updateCarrelRes = await fetch(`${baseUrl}/carrels/${createdCarrelId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Carrel Test-Updated',
                zone: 'Testing Zone Renamed',
                status: 'available'
            })
        });
        const updateCarrelData = await updateCarrelRes.json();
        recordTest(
            updateCarrelRes.status === 200 && updateCarrelData.carrel?.name === 'Carrel Test-Updated',
            'PUT /carrels/:id updates carrel with 200 OK',
            `Updated Name: ${updateCarrelData.carrel?.name}`
        );

        // DELETE /carrels/:id - Allowed when no bookings
        const deleteCarrelRes = await fetch(`${baseUrl}/carrels/${createdCarrelId}`, {
            method: 'DELETE'
        });
        recordTest(
            deleteCarrelRes.status === 200,
            'DELETE /carrels/:id deletes carrel with no bookings (200 OK)',
            `Status: ${deleteCarrelRes.status}`
        );

        // DELETE /carrels/1 - Blocked when bookings exist
        const deleteBlockedCarrelRes = await fetch(`${baseUrl}/carrels/1`, {
            method: 'DELETE'
        });
        recordTest(
            deleteBlockedCarrelRes.status === 409,
            'DELETE /carrels/1 blocked by existing bookings with 409 Conflict',
            `Status: ${deleteBlockedCarrelRes.status}`
        );

        // ----------------------------------------------------
        // 4. BOOKINGS & SQL JOIN ENDPOINT
        // ----------------------------------------------------
        console.log('\n--- 4. Testing Bookings & SQL JOIN ---');

        // GET /bookings
        const bookingsRes = await fetch(`${baseUrl}/bookings`);
        const bookingsData = await bookingsRes.json();
        recordTest(
            bookingsRes.status === 200 && Array.isArray(bookingsData),
            'GET /bookings returns 200 and bookings array',
            `Count: ${bookingsData.length}`
        );

        // GET /bookings/details - Real SQL JOIN
        const detailsRes = await fetch(`${baseUrl}/bookings/details`);
        const detailsData = await detailsRes.json();
        const firstDetail = detailsData[0];
        recordTest(
            detailsRes.status === 200 &&
            Array.isArray(detailsData) &&
            firstDetail &&
            firstDetail.student_name !== undefined &&
            firstDetail.carrel_name !== undefined &&
            firstDetail.carrel_zone !== undefined &&
            firstDetail.booked_at !== undefined,
            'GET /bookings/details uses real SQL JOIN with student_name, carrel_name, carrel_zone',
            `First record student: ${firstDetail?.student_name}, carrel: ${firstDetail?.carrel_name}`
        );

        // POST /bookings - Try booking already occupied Carrel 1
        const bookOccupiedRes = await fetch(`${baseUrl}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: 2, carrel_id: 1 })
        });
        recordTest(
            bookOccupiedRes.status === 400 || bookOccupiedRes.status === 409,
            'POST /bookings prevents booking already occupied carrel',
            `Status: ${bookOccupiedRes.status}`
        );

        // POST /bookings - Book available Carrel 2
        const bookAvailableRes = await fetch(`${baseUrl}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: 2, carrel_id: 2 })
        });
        const bookAvailableData = await bookAvailableRes.json();
        recordTest(
            bookAvailableRes.status === 201 && bookAvailableData.booking?.booking_id > 0,
            'POST /bookings creates booking for available carrel and sets status to occupied',
            `Booking ID: ${bookAvailableData.booking?.booking_id}`
        );

        // Verify carrel 2 status changed to 'occupied'
        const carrel2CheckRes = await fetch(`${baseUrl}/carrels/2`);
        const carrel2CheckData = await carrel2CheckRes.json();
        recordTest(
            carrel2CheckData.status === 'occupied',
            'Carrel status automatically updated to "occupied" upon booking',
            `Carrel 2 Status: ${carrel2CheckData.status}`
        );

        // ----------------------------------------------------
        // 5. MANDATORY SPECIAL TWIST – RETURN FLOW (TESTS 1, 2, 3)
        // ----------------------------------------------------
        console.log('\n--- 5. MANDATORY SPECIAL TWIST: RETURN FLOW TESTS ---');

        // TEST 1 – FIRST RETURN: POST /bookings/1/return
        console.log('▶ TEST 1 – FIRST RETURN: POST /bookings/1/return');
        const returnTest1Res = await fetch(`${baseUrl}/bookings/1/return`, {
            method: 'POST'
        });
        const returnTest1Data = await returnTest1Res.json();

        // Also check DB that returned_at is set and carrel 1 is available
        const booking1Check = await db.getAsync('SELECT * FROM bookings WHERE booking_id = 1');
        const carrel1Check = await db.getAsync('SELECT * FROM carrels WHERE carrel_id = 1');

        recordTest(
            returnTest1Res.status === 200 &&
            returnTest1Data.message === 'Booking returned successfully' &&
            booking1Check.returned_at !== null &&
            carrel1Check.status === 'available',
            'TEST 1: POST /bookings/1/return returns HTTP 200, sets returned_at, and sets carrel status to "available"',
            `Message: "${returnTest1Data.message}", returned_at: ${booking1Check.returned_at}, carrel status: ${carrel1Check.status}`
        );

        // TEST 2 – SECOND RETURN: POST /bookings/1/return (Same request again)
        console.log('▶ TEST 2 – SECOND RETURN: POST /bookings/1/return (Duplicate)');
        const returnTest2Res = await fetch(`${baseUrl}/bookings/1/return`, {
            method: 'POST'
        });
        const returnTest2Data = await returnTest2Res.json();

        // Verify the original returned_at was not overwritten
        const booking1CheckAgain = await db.getAsync('SELECT * FROM bookings WHERE booking_id = 1');

        recordTest(
            returnTest2Res.status === 409 &&
            returnTest2Data.message === 'Already returned' &&
            booking1CheckAgain.returned_at === booking1Check.returned_at,
            'TEST 2: Second POST /bookings/1/return returns HTTP 409 "Already returned" without overwriting return date',
            `Status: ${returnTest2Res.status}, Message: "${returnTest2Data.message}"`
        );

        // TEST 3 – STUDENT HISTORY: GET /students/1/history
        console.log('▶ TEST 3 – STUDENT HISTORY: GET /students/1/history');
        const historyRes = await fetch(`${baseUrl}/students/1/history`);
        const historyData = await historyRes.json();

        const test3Passed =
            historyRes.status === 200 &&
            Array.isArray(historyData) &&
            historyData.length >= 1 &&
            historyData.every(item => item.returned_at !== null && item.student_id === 1) &&
            historyData[0].carrel_name !== undefined &&
            historyData[0].zone !== undefined;

        recordTest(
            test3Passed,
            'TEST 3: GET /students/1/history returns only returned bookings (returned_at IS NOT NULL) with carrel name and zone',
            `Found ${historyData.length} returned booking(s). First item carrel: ${historyData[0]?.carrel_name}, zone: ${historyData[0]?.zone}`
        );

        console.log('\n======================================================');
        console.log(`TOTAL TESTS: ${passedTests + failedTests}`);
        console.log(`PASSED: ${passedTests}`);
        console.log(`FAILED: ${failedTests}`);
        console.log('======================================================\n');

        if (failedTests > 0) {
            console.error('❌ Some tests failed!');
            process.exit(1);
        } else {
            console.log('🎉 All tests passed successfully with real SQLite database records!');
        }
    } catch (err) {
        console.error('Fatal error during API tests:', err);
        process.exit(1);
    } finally {
        if (serverInstance) {
            serverInstance.close();
        }
    }
}

if (require.main === module) {
    runApiTests();
}

module.exports = runApiTests;
