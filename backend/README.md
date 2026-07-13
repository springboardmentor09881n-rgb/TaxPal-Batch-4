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
Create a `.env` file in the root of the `backend` directory and add the following configuration:
```env
PORT=5000
JWT_SECRET=supersecretjwtkeyforlocaldev123
MONGODB_URI=mongodb://localhost:27017/taxpal
```
*(If using MongoDB Atlas, replace `MONGODB_URI` with your connection string).*

### 5. Run the Server
Start the development server:
```bash
npm run dev
```
The server will start running on `http://localhost:5000` (or the port specified in your `.env` file).
