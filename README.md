# Server Prosjekt

This project is a backend-only REST API developed as part of the Server Course Assignment.  
The application allows an authenticated **Admin** user to manually capture and manage census participant data.

The API is hosted on **Render**, uses **MySQL on Aiven**, and is tested exclusively via **Postman**.

---

## Production URL (Render)

Base URL:  
https://server-prosjekt.onrender.com/

> Example: https://server-prosjekt.onrender.com/

---

## Technology Stack

- Node.js
- Express.js
- Sequelize ORM
- MySQL (Aiven)
- Render (hosting)
- HTTP Basic Authentication

---

## Authentication

All API endpoints are protected using **HTTP Basic Authentication**.



### Admin credentials (as required by assignment)
- **Login:** `admin`
- **Password:** `P4ssword`

The Admin user is **stored in the database** and is **automatically seeded at application startup**.

In Postman:
- Authorization → Type: **Basic Auth**
- Enter the credentials above


### Security Note

For the purpose of this course assignment, the admin password is stored in plaintext in the database, as explicitly specified in the assignment requirements.

In a real-world production application, passwords should always be hashed (e.g. using bcrypt) and never stored in plaintext.

---

## Health & Status

### GET `/`
Displays an informational HTML landing page in the browser describing the API and available endpoints.

### GET `/status`
Returns a JSON health response.

Example:
```json
{
  "status": "ok",
  "authHeaderPresent": true,
  "authHeaderIsBasic": true,
  "uptimeSeconds": 1234
}
```

---

## Data Model

### Participant
- email (string, unique)
- firstname (string)
- lastname (string)
- dob (string, YYYY-MM-DD)

### Work
- companyname (string)
- salary (number)
- currency (string)

### Home
- country (string)
- city (string)

Relations:
- Participant ↔ Work (1–1 via participant email)
- Participant ↔ Home (1–1 via participant email)

---

## Required JSON Structure (Nested)

All **POST** and **PUT** requests must include the following **nested JSON structure** in the request body:

```json
{
  "participant": {
    "email": "ola.nordmann@example.com",
    "firstname": "Ola",
    "lastname": "Nordmann",
    "dob": "1990-05-20"
  },
  "work": {
    "companyname": "ACME AS",
    "salary": 650000,
    "currency": "NOK"
  },
  "home": {
    "country": "Norway",
    "city": "Oslo"
  }
}
```

All properties are required.  
Invalid or missing data will result in a descriptive JSON error response.

---

## API Endpoints

> All endpoints require **Basic Auth**.

---

### POST

#### POST `/participants/add`
Creates a new participant including work and home details.

- Validates all fields
- Email must be unique
- DOB must be a valid date in `YYYY-MM-DD` format

---

### GET

#### GET `/participants/details`
Returns personal details of all participants:
- email
- firstname
- lastname

#### GET `/participants/details/:email`
Returns personal details for a specific participant:
- email
- firstname
- lastname
- dob

#### GET `/participants/work/:email`
Returns work details for the participant **if the record exists**:
- companyname
- salary
- currency

#### GET `/participants/home/:email`
Returns home details for the participant **if the record exists**:
- country
- city

---

### PUT

#### PUT `/participants/:email`
Updates an existing participant by email.

- Request body must follow the same JSON structure as `POST /participants/add`
- All fields are required
- Updates participant, work, and home details
- Returns an error if the participant does not exist

---

### DELETE

#### DELETE `/participants/:email`
Deletes a participant by email.

- Participant record is permanently deleted from the database
- Associated Work and Home records are also removed

After deletion:
- GET `/participants/work/:email` → 404
- GET `/participants/home/:email` → 404

Note: The application uses hard deletes. Deleted records are not retained in the database.

---

## Error Handling

All errors are returned as JSON objects with appropriate HTTP status codes:

- **400** Bad Request (validation errors)
- **401** Unauthorized (missing or invalid Basic Auth)
- **404** Not Found
- **409** Conflict (duplicate email)
- **500** Server Error

---

## Environment Variables

Environment variables are configured on **Render** and are not committed to GitHub.

Required variables:

```
DB_HOST=your-database-host
DB_PORT=3306
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_SSL=true

```

The `.env` file is excluded via `.gitignore`.

---

## Testing

All endpoints are tested using **Postman** against the Render deployment.

There is **no front-end requirement** for this assignment.

---

## Notes for Evaluators

- The application is hosted on Render
- Database is MySQL hosted on Aiven
- Admin authentication uses Basic Auth as specified
- All endpoints return JSON
- Nested JSON structure is enforced
- Validation and descriptive error handling are implemented
