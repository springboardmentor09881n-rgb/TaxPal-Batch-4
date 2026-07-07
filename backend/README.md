# TaxPal Backend

This is the Node.js and Express backend API for the TaxPal application. It provides secure user authentication and transaction management.

## Tech Stack
- **Node.js & Express**: API framework.
- **MySQL**: Relational database.
- **Sequelize**: Node.js ORM for SQL.
- **JSON Web Tokens (JWT)**: Secure user authentication.
- **Bcrypt**: Password hashing.

## Setup Instructions

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- [MySQL](https://www.mysql.com/) installed and running locally.

### 2. Database Creation
Before running the application, you must create an empty database in your MySQL server. Open your MySQL command line or MySQL Workbench and run:
```sql
CREATE DATABASE taxpal;
```

### 3. Install Dependencies
Navigate to the backend directory and install the required packages:
```bash
npm install
```

### 4. Environment Variables
Create a `.env` file in the root of your project directory and add the following configuration. Update the `DB_USER` and `DB_PASS` if your MySQL credentials differ:

```env
PORT=5000
JWT_SECRET=supersecretjwtkeyforlocaldev123
DB_NAME=taxpal
DB_USER=
DB_PASS=
DB_HOST=localhost
```

### 5. Running the Application
Start the server in development mode using nodemon:
```bash
npm run dev
```
*(Or use `npm start` to run the standard node process).*

When the server starts successfully, Sequelize will automatically synchronize your models and create the `Users` and `Transactions` tables inside the `taxpal` database!
