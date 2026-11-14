# Member 4 Screenshots: Validation, Search, and Return Twist

Place the following screenshots here:
1. `postman-zone-search.png`: Postman test of `GET /carrels?zone=quiet` returning matching quiet zone carrels.
2. `postman-validation-error.png`: Postman test of `POST /carrels` with missing name returning HTTP 400 Bad Request.
3. `twist-test1-first-return.png`: Postman test of `POST /bookings/1/return` returning HTTP 200 "Booking returned successfully".
4. `twist-test2-duplicate-return.png`: Postman test of `POST /bookings/1/return` (second attempt) returning HTTP 409 "Already returned".
5. `twist-test3-student-history.png`: Postman test of `GET /students/1/history` returning only returned bookings with carrel details.
