# TaxPal - Backend API

This is the backend REST API for **TaxPal**, an internship project developed for Batch 4. The server handles data processing, secure user authentication, database operations, category budgeting, smart transaction processing, multi-country tax calculations, tax due calendar events, and SMTP email notifications.

---

## 🛠️ Tech Stack

- **Node.js**: JavaScript runtime environment.
- **Express.js (v5.x)**: Web application framework for routing and middleware.
- **MongoDB & Mongoose (v8.x)**: NoSQL database and Object Data Modeling (ODM) library.
- **JSON Web Tokens (JWT)**: Stateless token-based user authentication.
- **Bcrypt (v6.x)**: Password hashing and security.
- **Nodemailer**: SMTP email transport service for password recovery reset links.
- **Dotenv**: Environment variable management.
- **CORS**: Cross-Origin Resource Sharing middleware.

---

## 📁 Architecture & File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection initialization
│   ├── controllers/
│   │   ├── authController.js     # User Auth, Signup, Login, Password Reset & SMTP logic
│   │   ├── budgetController.js   # Budget creation, calculation of spent vs target, updates
│   │   ├── categoryController.js # Custom Income/Expense category CRUD operations
│   │   ├── taxController.js      # US, India, UK, Canada tax estimation & calendar generator
│   │   └── transactionController.js # Transaction CRUD operations
│   ├── middleware/
│   │   └── authMiddleware.js     # Express middleware verifying JWT bearer tokens
│   ├── models/
│   │   ├── User.model.js         # User account schema with password reset tokens
│   │   ├── Transaction.model.js  # Income & Expense records schema
│   │   ├── budgets.model.js      # Category monthly budget schema
│   │   ├── categories.model.js   # Custom user category schema with hex colors
│   │   ├── taxEstimates.model.js # Quarterly tax estimate calculation schema
│   │   └── alerts.model.js       # System notifications & tax due date alerts schema
│   ├── routes/
│   │   ├── auth.js               # Auth routes (`/api/auth`)
│   │   ├── budgets.js            # Budget routes (`/api/budgets`)
│   │   ├── categories.js         # Category routes (`/api/categories`)
│   │   ├── tax.js                # Tax estimator routes (`/api/taxes`)
│   │   └── transactions.js       # Transaction routes (`/api/transactions`)
│   └── app.js                    # Main Express application config & route mounting
├── server.js                     # Server entry point (DNS setServers + port listener)
├── package.json
└── README.md
```

---

## 🔑 Environment Variables Setup

Create a `.env` file in the root of the `backend/` directory:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key
MONGODB_URI=mongodb://localhost:27017/taxpal
DB_NAME=taxpal
DB_HOST=localhost
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_app_password
FRONTEND_URL=http://localhost:4200
```

### Environment Variables Glossary

| Variable | Required | Description | Example |
|---|---|---|---|
| `PORT` | No | Port on which the API server listens | `5000` |
| `JWT_SECRET` | Yes | Secret key used to sign and verify JWT authentication tokens | `taxpal_jwt_secret_key` |
| `MONGODB_URI` | Yes | MongoDB connection string (local instance or MongoDB Atlas URI) | `mongodb://localhost:27017/taxpal` |
| `DB_NAME` | No | MongoDB database name | `taxpal` |
| `DB_HOST` | No | MongoDB database host | `localhost` |
| `SMTP_HOST` | No | Host address of SMTP server for sending reset emails | `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP server port | `587` (TLS) or `465` (SSL) |
| `SMTP_USER` | No | Sender email address for authentication emails | `noreply@taxpal.com` |
| `SMTP_PASSWORD` | No | SMTP password or Google App Password | `xxxx-xxxx-xxxx-xxxx` |
| `FRONTEND_URL` | No | Base URL of the Angular frontend application | `http://localhost:4200` |

---

## 🗄️ Database Schemas Overview

- **User (`User.model.js`)**: Stores user profile details (`username`, `fullName`, `email`, `password` hashed with bcrypt, `country`, `incomeBracket`, `resetPasswordToken`, `resetPasswordExpires`).
- **Transaction (`Transaction.model.js`)**: Manages individual transactions (`userId`, `type` [`income`/`expense`], `amount`, `category`, `date`, `description`, `notes`).
- **Budget (`budgets.model.js`)**: Tracks monthly budget goals per category (`userId`, `category`, `budget_amount`, `month`, `description`). Unique compound index on `(userId, category, month)`.
- **Category (`categories.model.js`)**: Custom categories per user (`userId`, `type` [`income`/`expense`], `name`, `color` hex string). Unique index on `(userId, type, name)`.
- **TaxEstimate (`taxEstimates.model.js`)**: Saves quarterly tax estimates (`userId`, `country`, `quarter` [`Q1`-`Q4`], `estimatedTax`, `dueDate`, `state`, `filingStatus`, deduction fields). Unique index on `(userId, quarter, dueDate)`.
- **Alert (`alerts.model.js`)**: System and tax reminders (`userId`, `type`, `message`, `alertDate`, `isRead`).

---

## 📡 REST API Reference

All requests requiring authentication must pass a valid JWT token in the header:
`Authorization: Bearer <your_jwt_token>`

### 1. Authentication Routes (`/api/auth`)
- **`POST /api/auth/register`**: Register a new user account.
  - *Body*: `{ username, password, fullName, email, country, incomeBracket }`
- **`POST /api/auth/login`**: Authenticate credentials and receive a JWT token.
  - *Body*: `{ username, password }` or `{ email, password }`
- **`POST /api/auth/forgot-password`**: Request a password reset link sent to registered email.
  - *Body*: `{ email }`
- **`POST /api/auth/reset-password`**: Set a new password using reset token.
  - *Body*: `{ token, newPassword }`
- **`PUT /api/auth/change-password`**: Update password for authenticated user (Private).
  - *Body*: `{ currentPassword, newPassword }`

### 2. Transaction Routes (`/api/transactions`)
- **`GET /api/transactions`**: Fetch all user transactions (supports query filtering).
- **`POST /api/transactions`**: Create a new transaction record.
  - *Body*: `{ type, amount, category, date, description, notes }`
- **`PUT /api/transactions/:id`**: Update an existing transaction entry.
- **`DELETE /api/transactions/:id`**: Delete a transaction entry.

### 3. Budget Routes (`/api/budgets`)
- **`GET /api/budgets`**: Get budgets for user including calculated month-to-date spent amounts.
- **`POST /api/budgets`**: Create/set category monthly budget target.
  - *Body*: `{ category, budget_amount, month, description }`
- **`PUT /api/budgets/:id`**: Update existing category budget target.
- **`DELETE /api/budgets/:id`**: Delete budget limit.

### 4. Category Routes (`/api/categories`)
- **`GET /api/categories`**: Fetch user-defined custom categories.
- **`POST /api/categories`**: Add a custom category.
  - *Body*: `{ type, name, color }`
- **`PUT /api/categories/:id`**: Update category name or color.
- **`DELETE /api/categories/:id`**: Delete custom category.

### 5. Tax Estimator & Calendar Routes (`/api/taxes`)
- **`POST /api/taxes/estimate`**: Calculate & save quarterly advance tax estimate.
  - *Body*: `{ country, state, filingStatus, quarter, grossIncomeForQuarter, businessExpenses, retirementContributions, healthInsurancePremiums, homeOfficeDeductions }`
- **`GET /api/taxes/estimates`**: Fetch all saved tax estimates.
- **`DELETE /api/taxes/estimates/:id`**: Remove a saved tax estimate.
- **`GET /api/taxes/calendar`**: Retrieve tax deadline calendar events & alerts.

---

## ⚙️ Running Commands

```bash
# Install dependencies
npm install

# Run server in production mode
npm start

# Run server in development mode (with Nodemon hot-reloading)
npm run dev
```
