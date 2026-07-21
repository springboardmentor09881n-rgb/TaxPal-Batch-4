# TaxPal - Backend

This is the backend API for **TaxPal**, an internship project developed for Batch 4. It handles data processing, provides secure user authentication, and manages transactions.

## Tech Stack
- **Node.js & Express.js**
- **MongoDB** & **Mongoose** (Database & ODM)
- **JSON Web Tokens (JWT)** for authentication
- **Bcrypt** for password hashing

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a MongoDB Atlas cloud cluster.

### 2. Database Setup
No manual database creation is needed. The application will automatically create the database and collections on its first run. Just ensure your MongoDB instance is running.

### 3. Install Dependencies
Navigate to the `backend` directory and install the required packages:
```bash
npm install
```

### 4. Environment Variables
Create a `.env` file in the root of the `backend` directory and fill in your own values:
```env
PORT=
JWT_SECRET=
MONGODB_URI=
DB_NAME=
DB_HOST=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
FRONTEND_URL=
```

| Variable | Description |
|---|---|
| `PORT` | Port the backend server runs on (e.g. `5000`) |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |
| `MONGODB_URI` | MongoDB connection string (local or Atlas) |
| `DB_NAME` | Name of the MongoDB database |
| `DB_HOST` | MongoDB host (e.g. `localhost`) |
| `SMTP_HOST` | SMTP server host for sending emails (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (e.g. `587` for TLS) |
| `SMTP_USER` | Email address used to send emails |
| `SMTP_PASSWORD` | App password for the SMTP email account |
| `FRONTEND_URL` | Base URL of the frontend app (e.g. `http://localhost:4200`) |

*(If using MongoDB Atlas, set `MONGODB_URI` to your Atlas connection string).*

### 5. Run the Server
Start the development server:
```bash
npm run dev
```
The server will start running on `http://localhost:5000` (or the port specified in your `.env` file).
