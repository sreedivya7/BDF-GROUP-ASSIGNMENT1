# StudySpot Cafe – Study Carrel Management System
**Backend Development Fundamentals (Modules 1 to 3) – Group Assignment**

---

## 1. Problem Statement

At StudySpot Cafe, college students frequently use individual study carrels to prepare for exams and complete assignments. Historically, study carrels were assigned on an informal first-come, first-served basis. This created several operational problems:
- Students frequently argued over carrel occupancy and reservation fairness.
- Café staff had no real-time visibility into which carrels were currently occupied and which were vacant.
- Students lacked a reliable record of their past study sessions.

To resolve these challenges, StudySpot Cafe required a lightweight, robust backend system that tracks students, study carrels, active bookings, carrel status transitions, and booking history.

---

## 2. Project Objectives

The primary objectives of this backend system are:
1. **Student Management**: Maintain student records and contact details.
2. **Carrel Inventory**: Track study carrels across different café zones (e.g., Quiet Zone, Collaborative Zone, Silent Pod) and manage their current operational status (`available` or `occupied`).
3. **Reservation Workflow**: Facilitate student bookings while ensuring a carrel cannot have more than one active booking simultaneously.
4. **Special Twist (Return Workflow)**: Provide an idempotent return endpoint (`POST /bookings/:id/return`) that marks bookings as returned, updates carrel availability, and blocks duplicate return attempts with HTTP 409 Conflict.
5. **Returned Session History**: Allow students to retrieve their historical returned study carrel sessions with full carrel and zone details (`GET /students/:id/history`).
6. **Detailed Reporting**: Provide an SQL JOIN endpoint (`GET /bookings/details`) to give staff a consolidated view of student names, carrels, zones, and booking timestamps.

---

## 3. Technologies Used

Strictly adheres to the Backend Development Fundamentals curriculum:
- **Runtime**: Node.js (v26 LTS / v18+)
- **Web Framework**: Express.js (v5)
- **Language**: JavaScript (CommonJS)
- **Database Engine**: SQLite3 (`sqlite3` package)
- **Database Architecture**: Relational schema with Foreign Key constraint enforcement and partial unique indexes
- **Development Tooling**: `nodemon` for auto-reloading during development
- **Testing**: Node.js automated test suites (`tests/test-db.js`, `tests/test-api.js`)
- **API Client**: Postman Collection v2.1.0 (`postman_collection.json`)

---

## 4. Database Structure

The database consists of **exactly three related tables** persisted in `studyspot.db`. Foreign key enforcement is enabled via `PRAGMA foreign_keys = ON;`.

```
+--------------------+        +---------------------+        +--------------------+
|      students      |        |       bookings      |        |      carrels       |
+--------------------+        +---------------------+        +--------------------+
| student_id (PK)    |<-------| student_id (FK)     |        | carrel_id (PK)     |
| name               |        | booking_id (PK)     |------->| name               |
| email              |        | carrel_id (FK)      |        | zone               |
| phone              |        | booked_at           |        | status             |
+--------------------+        | returned_at         |        +--------------------+
                              +---------------------+
```

### Table Definitions

#### 1. `students`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `student_id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each student |
| `name` | `TEXT` | `NOT NULL` | Full student name |
| `email` | `TEXT` | `NOT NULL` | Student email address |
| `phone` | `TEXT` | `NULL` | Student contact phone number |

#### 2. `carrels`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `carrel_id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each carrel |
| `name` | `TEXT` | `NOT NULL` | Name or desk code (e.g. Carrel A-01) |
| `zone` | `TEXT` | `NOT NULL` | Café zone (e.g. Quiet Zone) |
| `status` | `TEXT` | `NOT NULL DEFAULT 'available'` | Allowed values: `'available'`, `'occupied'` |

#### 3. `bookings`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `booking_id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Unique identifier for each reservation |
| `student_id` | `INTEGER` | `NOT NULL, FK -> students(student_id)` | Referenced student |
| `carrel_id` | `INTEGER` | `NOT NULL, FK -> carrels(carrel_id)` | Referenced carrel |
| `booked_at` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Time carrel reservation was initiated |
| `returned_at`| `DATETIME` | `DEFAULT NULL` | Time carrel was returned (`NULL` = active) |

#### Database Constraints & Indexes:
- **Foreign Key Enforcement**: `ON DELETE RESTRICT` prevents accidental deletion of students or carrels that have associated bookings.
- **Partial Unique Index**:
  ```sql
  CREATE UNIQUE INDEX IF NOT EXISTS idx_active_carrel_booking 
  ON bookings (carrel_id) 
  WHERE returned_at IS NULL;
  ```
  Guarantees that a carrel cannot have more than one active booking concurrently, while permitting multiple returned bookings for the same carrel over time.

---

## 5. Project Folder Structure

```
StudySpot-Cafe/
│
├── config/
│   └── database.js             # SQLite connection, async wrappers, and initialization logic
│
├── database/
│   └── schema.sql              # Table definitions, foreign keys, and unique partial indexes
│
├── routes/
│   ├── students.js             # Routes for student CRUD and returned booking history
│   ├── carrels.js              # Routes for carrel CRUD and zone search
│   └── bookings.js             # Routes for bookings, SQL JOIN details, and return twist
│
├── controllers/
│   ├── studentController.js    # Student business logic and SQLite queries
│   ├── carrelController.js     # Carrel management and case-insensitive zone query
│   └── bookingController.js    # 6-step booking creation, SQL JOIN, and return twist
│
├── middleware/
│   └── validation.js           # Request body validation and ID parameter checking
│
├── tests/
│   ├── test-db.js              # SQLite connection, schema, and constraint verification
│   └── test-api.js             # End-to-end HTTP test suite covering all routes & the twist
│
├── screenshots/
│   ├── member-1-server-and-routes/
│   ├── member-2-database/
│   ├── member-3-rest-endpoints/
│   └── member-4-validation-search-twist/
│
├── server.js                   # Main Express application entrypoint
├── package.json                # Project dependencies, metadata, and scripts
├── postman_collection.json     # Postman collection (20 requests across 5 folders)
├── .gitignore                  # Git ignore rules for node_modules and logs
├── studyspot.db                # SQLite database file
└── README.md                   # Complete assignment documentation
```

---

## 6. API Endpoint Documentation

Base URL: `http://localhost:3000`

### 1. General
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API status, project metadata, and endpoint directory | `200 OK` |

### 2. Students (`/students`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/students` | Retrieve all registered students | `200 OK` |
| `GET` | `/students/:id` | Retrieve student by ID | `200 OK`, `404 Not Found` |
| `POST` | `/students` | Register a new student | `201 Created`, `400 Bad Request` |
| `PUT` | `/students/:id` | Update student details | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE`| `/students/:id` | Delete student (blocked if bookings exist) | `200 OK`, `404 Not Found`, `409 Conflict` |
| `GET` | `/students/:id/history` | **Special Twist**: Return only completed returned bookings | `200 OK`, `404 Not Found` |

### 3. Study Carrels (`/carrels`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/carrels` | Retrieve all carrels | `200 OK` |
| `GET` | `/carrels?zone=quiet` | Case-insensitive zone search (`LIKE`) | `200 OK` (returns `[]` if no matches) |
| `GET` | `/carrels/:id` | Retrieve carrel by ID | `200 OK`, `404 Not Found` |
| `POST` | `/carrels` | Create a new carrel | `201 Created`, `400 Bad Request` |
| `PUT` | `/carrels/:id` | Update carrel details | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE`| `/carrels/:id` | Delete carrel (blocked if bookings exist) | `200 OK`, `404 Not Found`, `409 Conflict` |

### 4. Bookings (`/bookings`)
| Method | Endpoint | Description | Status Code |
| :--- | :--- | :--- | :--- |
| `GET` | `/bookings` | Retrieve all bookings | `200 OK` |
| `GET` | `/bookings/details` | **SQL JOIN**: Consolidated booking, student, & carrel info | `200 OK` |
| `GET` | `/bookings/:id` | Retrieve booking by ID | `200 OK`, `404 Not Found` |
| `POST` | `/bookings` | Create a new booking (verifies student, carrel availability) | `201 Created`, `400 Bad Request`, `404`, `409` |
| `POST` | `/bookings/:id/return`| **Special Twist**: Return booking and release carrel | `200 OK`, `404 Not Found`, `409 Conflict` |

> [!IMPORTANT]
> `/bookings/details` is registered **before** `/bookings/:id` in `routes/bookings.js` so that the Express router does not misinterpret `"details"` as a numeric booking ID parameter.

---

## 7. Example Request & Response Bodies

### 1. Create Student (`POST /students`)
**Request Body**:
```json
{
  "name": "Emma Watson",
  "email": "emma.watson@campus.edu",
  "phone": "555-0199"
}
```
**Response (`201 Created`)**:
```json
{
  "message": "Student created successfully",
  "student": {
    "student_id": 5,
    "name": "Emma Watson",
    "email": "emma.watson@campus.edu",
    "phone": "555-0199"
  }
}
```

### 2. Create Study Carrel (`POST /carrels`)
**Request Body**:
```json
{
  "name": "Carrel D-01",
  "zone": "Media Pod",
  "status": "available"
}
```
**Response (`201 Created`)**:
```json
{
  "message": "Carrel created successfully",
  "carrel": {
    "carrel_id": 6,
    "name": "Carrel D-01",
    "zone": "Media Pod",
    "status": "available"
  }
}
```

### 3. Create Booking (`POST /bookings`)
**Request Body**:
```json
{
  "student_id": 2,
  "carrel_id": 2
}
```
**Response (`201 Created`)**:
```json
{
  "message": "Booking created successfully",
  "booking": {
    "booking_id": 2,
    "student_id": 2,
    "carrel_id": 2,
    "booked_at": "2026-11-14 09:20:46",
    "returned_at": null
  }
}
```

### 4. Consolidated SQL JOIN Endpoint (`GET /bookings/details`)
**Response (`200 OK`)**:
```json
[
  {
    "booking_id": 1,
    "student_id": 1,
    "student_name": "Alice Johnson",
    "student_email": "alice.johnson@campus.edu",
    "carrel_id": 1,
    "carrel_name": "Carrel A-01",
    "carrel_zone": "Quiet Zone",
    "booked_at": "2026-11-14 07:20:46",
    "returned_at": null,
    "carrel_status": "occupied"
  }
]
```

---

## 8. Special Assignment Twist: Return Flow

The return flow manages the carrel checkout lifecycle and enforces strict idempotency.

```
       POST /bookings/:id/return
                 |
                 v
        Does booking exist?
             /        \
          No/          \Yes
           v            v
      HTTP 404     Is returned_at != null?
                   /             \
                Yes/              \No
                  v                v
             HTTP 409          1. Set returned_at = CURRENT_TIMESTAMP
        "Already returned"     2. Set carrels.status = 'available'
                               3. Return HTTP 200
```

### The Three Required Tests:

#### TEST 1 – First Return
- **Request**: `POST /bookings/1/return`
- **Controller Action**:
  1. Finds booking `1`.
  2. Confirms `returned_at IS NULL`.
  3. Updates `returned_at` to `CURRENT_TIMESTAMP`.
  4. Flips Carrel `1`'s status to `'available'`.
- **Expected Status**: `HTTP 200 OK`
- **Response**:
  ```json
  {
    "message": "Booking returned successfully"
  }
  ```

#### TEST 2 – Second Return (Duplicate Return Attempt)
- **Request**: `POST /bookings/1/return`
- **Controller Action**:
  1. Finds booking `1`.
  2. Detects that `returned_at` is already populated.
  3. Aborts operation; original `returned_at` timestamp is untouched.
- **Expected Status**: `HTTP 409 Conflict`
- **Response**:
  ```json
  {
    "message": "Already returned"
  }
  ```

#### TEST 3 – Student History
- **Request**: `GET /students/1/history`
- **Controller Action**:
  Executes SQL query filtering exclusively for records where `returned_at IS NOT NULL`:
  ```sql
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
  ORDER BY b.returned_at DESC;
  ```
- **Expected Status**: `HTTP 200 OK`
- **Response**:
  ```json
  [
    {
      "booking_id": 1,
      "student_id": 1,
      "carrel_id": 1,
      "carrel_name": "Carrel A-01",
      "zone": "Quiet Zone",
      "booked_at": "2026-11-14 07:20:46",
      "returned_at": "2026-11-14 09:20:46"
    }
  ]
  ```

---

## 9. HTTP Status Code Reference

| Status Code | Description | Where It Is Used |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Successful GET, PUT, DELETE, and return flow |
| `201 Created` | Resource created | Successful POST on `/students`, `/carrels`, `/bookings` |
| `400 Bad Request`| Missing or invalid payload | Validation middleware failures (missing name, invalid email, illegal status) |
| `404 Not Found` | Resource does not exist | Student, carrel, or booking ID not found |
| `409 Conflict` | Conflicting state / duplicate action | Duplicate booking return (`"Already returned"`), booking an occupied carrel, deleting a record blocked by foreign keys |
| `500 Server Error`| Unexpected server fault | Database query or unhandled runtime failure |

---

## 10. Installation & Running Instructions

### Prerequisites
- Node.js installed (v18+ or v26+)
- npm installed

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Test Suite
Verifies SQLite connection, tables, columns, foreign keys, and indexes:
```bash
npm run test:db
```

### 3. Run Full Automated API Test Suite
Executes all 27 tests covering all routes, zone search, SQL JOIN, and the 3 mandatory twist tests:
```bash
npm run test:api
```
Or run both suites together:
```bash
npm test
```

### 4. Start the Application Server
For production/standard execution:
```bash
npm start
```
For development with automatic reload via `nodemon`:
```bash
npm run dev
```

The server will start on `http://localhost:3000`.

---

## 11. Postman Testing Instructions

1. Open Postman.
2. Click **Import** in the upper left.
3. Select `postman_collection.json` located in the root directory.
4. The collection **"StudySpot Cafe API"** will appear with 5 organized folders:
   - **Students** (5 requests)
   - **Carrels** (5 requests)
   - **Bookings** (4 requests)
   - **Return Flow** (3 requests for Twist Tests 1, 2, and 3)
   - **Validation and Search** (3 requests: Root, Zone Search, Invalid Carrel)
5. Ensure the server is running (`npm start`), then execute the requests sequentially.

---

## 12. Four-Member Responsibility Division

| Member | Focus Area | Specific Contributions & Responsibilities |
| :--- | :--- | :--- |
| **MEMBER 1** | **Server and Routes** | - Configured Express application setup.<br>- Registered JSON body parsing middleware (`express.json()`).<br>- Created modular routers (`routes/students.js`, `routes/carrels.js`, `routes/bookings.js`).<br>- Mounted routes at base paths (`/students`, `/carrels`, `/bookings`).<br>- Configured server startup and port listening with clear console output.<br>- Integrated HTTP status codes.<br>- Authored README running and installation instructions. |
| **MEMBER 2** | **Database** | - Established SQLite3 connection configuration (`config/database.js`).<br>- Designed and implemented three tables (`students`, `carrels`, `bookings`) in `database/schema.sql`.<br>- Configured Primary Keys and Foreign Key relationships.<br>- Enabled foreign key enforcement (`PRAGMA foreign_keys = ON;`).<br>- Built unique partial index (`idx_active_carrel_booking`) to prevent duplicate active carrel bookings.<br>- Authored database initialization script and seed dataset.<br>- Created automated database unit test suite (`tests/test-db.js`). |
| **MEMBER 3** | **REST Endpoints** | - Developed Student CRUD controller operations (`getAllStudents`, `getStudentById`, `createStudent`, `updateStudent`, `deleteStudent`).<br>- Developed Carrel CRUD controller operations (`getAllCarrels`, `getCarrelById`, `createCarrel`, `updateCarrel`, `deleteCarrel`).<br>- Built 6-step booking reservation logic in `bookingController.js`.<br>- Implemented real SQL JOIN endpoint (`GET /bookings/details`).<br>- Connected controllers with database query execution layer. |
| **MEMBER 4** | **Validation, Search and Twist** | - Created validation middleware (`middleware/validation.js`) for students, carrels, and bookings.<br>- Implemented case-insensitive carrel zone search using SQL `LIKE`.<br>- Built mandatory Return Flow endpoint (`POST /bookings/:id/return`) with 200/409 handling.<br>- Implemented student returned booking history endpoint (`GET /students/:id/history`).<br>- Created Postman collection with 20 requests across 5 folders.<br>- Verified Twist Tests 1, 2, and 3 with real SQLite data in `tests/test-api.js`. |

---

## 13. Screenshots & Visual Artifacts

Screenshots are organized by member responsibility folders inside `screenshots/`.

### Member 1: Server and Routes
- **Server Startup**: `screenshots/member-1-server-and-routes/server-startup.png`
  ![Server Startup](screenshots/member-1-server-and-routes/server-startup.png)
- **Root Directory**: `screenshots/member-1-server-and-routes/root-endpoint.png`
  ![Root Endpoint](screenshots/member-1-server-and-routes/root-endpoint.png)

### Member 2: Database Schema & Tests
- **Database Schema**: `screenshots/member-2-database/schema-sqlite.png`
  ![Database Schema](screenshots/member-2-database/schema-sqlite.png)
- **Database Test Output**: `screenshots/member-2-database/database-test-output.png`
  ![Database Test Output](screenshots/member-2-database/database-test-output.png)

### Member 3: REST Endpoints
- **Student CRUD in Postman**: `screenshots/member-3-rest-endpoints/postman-get-students.png`
  ![Postman GET Students](screenshots/member-3-rest-endpoints/postman-get-students.png)
- **SQL JOIN Endpoint (`/bookings/details`)**: `screenshots/member-3-rest-endpoints/postman-join-endpoint.png`
  ![SQL JOIN Details](screenshots/member-3-rest-endpoints/postman-join-endpoint.png)

### Member 4: Validation, Search & Return Twist
- **Case-Insensitive Zone Search**: `screenshots/member-4-validation-search-twist/postman-zone-search.png`
  ![Zone Search](screenshots/member-4-validation-search-twist/postman-zone-search.png)
- **Test 1: First Return (HTTP 200)**: `screenshots/member-4-validation-search-twist/twist-test1-first-return.png`
  ![Twist Test 1](screenshots/member-4-validation-search-twist/twist-test1-first-return.png)
- **Test 2: Duplicate Return Attempt (HTTP 409)**: `screenshots/member-4-validation-search-twist/twist-test2-duplicate-return.png`
  ![Twist Test 2](screenshots/member-4-validation-search-twist/twist-test2-duplicate-return.png)
- **Test 3: Student Returned History (HTTP 200)**: `screenshots/member-4-validation-search-twist/twist-test3-student-history.png`
  ![Twist Test 3](screenshots/member-4-validation-search-twist/twist-test3-student-history.png)
