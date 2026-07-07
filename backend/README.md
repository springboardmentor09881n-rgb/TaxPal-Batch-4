# TaxPal Backend

This is the Node.js and Express backend API for the TaxPal application. It provides secure user authentication and transaction management.

## Tech Stack

- **Node.js & Express**: API framework.
- **MongoDB**: NoSQL document database.
- **Mongoose**: Node.js ODM (Object Data Modeling) for MongoDB.
- **JSON Web Tokens (JWT)**: Secure user authentication.
- **Bcrypt**: Password hashing.

## Setup Instructions

### 1. Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally (or a MongoDB Atlas cloud cluster).

### 2. Database Setup

MongoDB will automatically create the database and collections when you first run the application. No manual database creation is needed.

**For local MongoDB:**

- Ensure MongoDB is running: `mongod`
- Default connection: `mongodb://localhost:27017/taxpal`

**For MongoDB Atlas (Cloud):**

- Create a cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Get your connection string and update `MONGODB_URI` in your `.env` file

### 3. Install Dependencies

Navigate to the backend directory and install the required packages:

```bash
npm install
```

### 4. Environment Variables

Create a `.env` file in the root of the backend directory and add the following configuration:

```env
PORT=5000
JWT_SECRET=supersecretjwtkeyforlocaldev123
MONGODB_URI=mongodb://localhost:27017/taxpal
DB_NAME=taxpal
DB_HOST=localhost
```

**For MongoDB Atlas, replace `MONGODB_URI` with your connection string:**

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taxpal?retryWrites=true&w=majority
```

### 5. Running the Application

Start the server in development mode using nodemon:

```bash
npm run dev
```

_(Or use `npm start` to run the standard node process)._

When the server starts successfully, Mongoose will automatically connect to MongoDB and create the necessary collections (`users` and `transactions`) inside the `taxpal` database!
