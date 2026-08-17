# ⚙️ TaxPal - Backend REST API & Server Documentation

The **TaxPal Backend REST API** is a high-performance Express.js server powering the **TaxPal** financial and tax management platform. It handles user authentication, session security, database operations, transaction categorization, category budget tracking, multi-country advance tax calculations, interactive tax calendar notifications, floating AI chatbot assist responses, and dynamic report generation (PDF & CSV).

---

## 🛠️ Technology Stack & Core Dependencies

| Component | Library / Framework | Version | Purpose |
|---|---|---|---|
| **Runtime Environment** | Node.js | `v18.x` / `v20.x` | Asynchronous JavaScript backend runtime |
| **Web Framework** | Express.js | `^5.0.0` | Middleware chaining, RESTful API routing, & HTTP utilities |
| **Database ODM** | Mongoose / MongoDB | `^8.10.0` | Object Data Modeling schema definitions & MongoDB driver |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) | `^9.0.2` | Stateless bearer token authentication & payload signing |
| **Password Security** | Bcrypt (`bcryptjs`) | `^3.0.0` | Password hashing algorithm with salt rounds |
| **Email Transport** | Nodemailer | `^6.10.0` | SMTP service integration for password reset emails |
| **PDF Generation** | PDFKit | `^0.16.0` | Dynamic document building for downloadable financial reports |
| **CSV Export** | json2csv | `^6.0.0-alpha.5` | JSON data transformer to CSV structured format |
| **CORS Middleware** | cors | `^2.8.5` | Cross-Origin Resource Sharing handling for Angular client |
| **Environment Mgmt** | dotenv | `^16.4.7` | `.env` environment variable loader |

---

## 📁 Repository Architecture & Directory Tree

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # Database connection initialization with Mongoose
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile, password reset & SMTP email logic
│   │   ├── budgetController.js   # Category monthly budget limit creation, MTD spent aggregation, CRUD
│   │   ├── categoryController.js # Custom category CRUD management & hex color assignments
│   │   ├── chatbotController.js  # TaxPal Assist rule-based knowledge engine & prompt router
│   │   ├── reportController.js   # PDF and CSV report builder & dynamic download stream generator
│   │   ├── taxController.js      # Multi-country tax calculation engine & tax calendar alerts
│   │   └── transactionController.js # Transaction CRUD operations & multi-field search/filtering
│   ├── middleware/
│   │   └── authMiddleware.js     # Express middleware validating JWT bearer authorization tokens
│   ├── models/
│   │   ├── User.model.js         # User account schema with password reset tokens & filing profile
│   │   ├── Transaction.model.js  # Income & expense records schema
│   │   ├── budgets.model.js      # Monthly category budget limits schema (compound index)
│   │   ├── categories.model.js   # User-defined custom categories schema (hex color, type)
│   │   ├── taxEstimates.model.js # Advance quarterly tax calculation history schema
│   │   ├── alerts.model.js       # System notifications & tax deadline alerts schema
│   │   └── report.model.js       # Generated financial report metadata schema
│   └── app.js                    # Express application configuration, middleware, & route declarations
├── server.js                     # Node.js server entry point & HTTP listener
├── package.json                  # Backend dependencies & script definitions
├── .env.example                  # Environment template file
└── README.md                     # Backend technical documentation
```

---

## 🔑 Environment Variables Setup

Create a `.env` file in the root of the `backend/` directory based on the `.env.example` template:

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

### Environment Glossary

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Local port on which the Express server listens |
| `JWT_SECRET` | **Yes** | — | Secret key used to sign and verify JWT authentication tokens |
| `MONGODB_URI` | **Yes** | — | MongoDB connection string (Local instance or MongoDB Atlas cluster) |
| `DB_NAME` | No | `taxpal` | Target MongoDB database name |
| `DB_HOST` | No | `localhost` | MongoDB host address |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP host server for sending token reset emails |
| `SMTP_PORT` | No | `587` | SMTP port (`587` for TLS, `465` for SSL) |
| `SMTP_USER` | No | — | Sender email address for SMTP authentication |
| `SMTP_PASSWORD` | No | — | Sender email password or Gmail App Password |
| `FRONTEND_URL` | No | `http://localhost:4200` | Client origin URL for CORS policy & email reset links |

---

## 🗄️ Database Schemas & Models Overview

The database is built on MongoDB using Mongoose ODM schemas:

### 1. User Model (`User.model.js`)
Stores user accounts, credentials, and tax profile preferences.
- `username` (`String`, required, unique, trimmed)
- `fullName` (`String`, required, trimmed)
- `email` (`String`, required, unique, lowercase, trimmed)
- `password` (`String`, required, hashed with Bcrypt salt rounds)
- `country` (`String`, default: `'United States'`)
- `incomeBracket` (`String`, optional)
- `resetPasswordToken` (`String`, default: `null`)
- `resetPasswordExpires` (`Date`, default: `null`)

### 2. Transaction Model (`Transaction.model.js`)
Tracks individual financial income and expense transactions.
- `userId` (`ObjectId` -> `User`, required, indexed)
- `type` (`String`, enum: `['income', 'expense']`, required)
- `amount` (`Number`, required, min: 0)
- `category` (`String`, required, trimmed)
- `date` (`Date`, default: `Date.now`)
- `description` (`String`, optional, trimmed)
- `notes` (`String`, optional, trimmed)

### 3. Budget Model (`budgets.model.js`)
Defines category monthly budget caps set by users.
- `userId` (`ObjectId` -> `User`, required, indexed)
- `category` (`String`, required, trimmed)
- `budget_amount` (`Number`, required, min: 0)
- `month` (`String`, required, format: `'YYYY-MM'`, e.g., `'2025-05'`)
- `description` (`String`, optional)
- *Compound Index*: `{ userId: 1, category: 1, month: 1 }` (unique constraint per user per month)

### 4. Category Model (`categories.model.js`)
Custom income and expense categories defined per user with custom styling.
- `userId` (`ObjectId` -> `User`, required, indexed)
- `type` (`String`, enum: `['income', 'expense']`, required)
- `name` (`String`, required, trimmed)
- `color` (`String`, default: `'#3B82F6'`, hex color code)
- *Compound Index*: `{ userId: 1, type: 1, name: 1 }` (unique constraint)

### 5. TaxEstimate Model (`taxEstimates.model.js`)
Records quarterly advance tax liability calculations and deduction breakdowns.
- `userId` (`ObjectId` -> `User`, required, indexed)
- `country` (`String`, required)
- `state` (`String`, optional)
- `filingStatus` (`String`, default: `'Single'`)
- `quarter` (`String`, enum: `['Q1', 'Q2', 'Q3', 'Q4']`, required)
- `grossIncomeForQuarter` (`Number`, required)
- `businessExpenses` (`Number`, default: 0)
- `retirementContributions` (`Number`, default: 0)
- `healthInsurancePremiums` (`Number`, default: 0)
- `homeOfficeDeductions` (`Number`, default: 0)
- `totalDeductions` (`Number`, required)
- `taxableIncomeForQuarter` (`Number`, required)
- `federalTax` (`Number`, required)
- `stateTax` (`Number`, default: 0)
- `selfEmploymentTax` (`Number`, default: 0)
- `totalEstimatedTax` (`Number`, required)
- `dueDate` (`Date`, required)
- *Compound Index*: `{ userId: 1, quarter: 1, dueDate: 1 }` (unique constraint)

### 6. Alert Model (`alerts.model.js`)
System notifications, over-budget warnings, and tax due date alerts.
- `userId` (`ObjectId` -> `User`, required, indexed)
- `type` (`String`, enum: `['TAX_DUE', 'BUDGET_WARNING', 'SYSTEM']`, default: `'TAX_DUE'`)
- `message` (`String`, required)
- `alertDate` (`Date`, required)
- `isRead` (`Boolean`, default: `false`)

### 7. Report Model (`report.model.js`)
Stores generated financial summary documents and file paths.
- `userId` (`ObjectId` -> `User`, required, indexed)
- `reportType` (`String`, enum: `['Income Statement', 'Expense Report', 'Tax Summary']`, required)
- `period` (`String`, required, e.g., `'Current Month'`, `'Last Quarter'`, `'Year to Date'`)
- `format` (`String`, enum: `['PDF', 'CSV']`, required)
- `name` (`String`, required)
- `startDate` (`Date`, required)
- `endDate` (`Date`, required)
- `generatedDate` (`Date`, default: `Date.now`)
- `filePath` (`String`, default: `null`)

---

## 📡 REST API Reference

All protected routes require a JWT token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

### 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description | Request Body Payload |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user account | `{ username, password, fullName, email, country, incomeBracket }` |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT token | `{ username, password }` or `{ email, password }` |
| `GET` | `/api/auth/profile` | Private | Get authenticated user profile | — |
| `PUT` | `/api/auth/profile` | Private | Update user profile details | `{ fullName, country, incomeBracket }` |
| `POST` | `/api/auth/forgot-password` | Public | Request reset token via SMTP email | `{ email }` |
| `POST` | `/api/auth/reset-password` | Public | Reset password using email token | `{ token, newPassword }` |
| `PUT` | `/api/auth/change-password` | Private | Change password for logged-in user | `{ currentPassword, newPassword }` |

### 2. Transaction Routes (`/api/transactions`)

| Method | Endpoint | Access | Description | Query Params / Request Body |
|---|---|---|---|---|
| `GET` | `/api/transactions` | Private | Fetch user transactions with filters | Query: `type`, `category`, `search`, `startDate`, `endDate` |
| `POST` | `/api/transactions` | Private | Create a new transaction | Body: `{ type, amount, category, date, description, notes }` |
| `PUT` | `/api/transactions/:id` | Private | Update an existing transaction | Body: `{ type, amount, category, date, description, notes }` |
| `DELETE` | `/api/transactions/:id` | Private | Remove a transaction entry | — |

### 3. Category Budget Routes (`/api/budgets`)

| Method | Endpoint | Access | Description | Request Body Payload |
|---|---|---|---|---|
| `GET` | `/api/budgets` | Private | Get category budgets + MTD spent totals | Query: `month` (Format: `'YYYY-MM'`) |
| `POST` | `/api/budgets` | Private | Set or create a monthly budget cap | Body: `{ category, budget_amount, month, description }` |
| `PUT` | `/api/budgets/:id` | Private | Update category budget cap amount | Body: `{ budget_amount, description }` |
| `DELETE` | `/api/budgets/:id` | Private | Delete a category budget cap | — |

### 4. Custom Category Routes (`/api/categories`)

| Method | Endpoint | Access | Description | Request Body Payload |
|---|---|---|---|---|
| `GET` | `/api/categories` | Private | Get custom user categories | — |
| `POST` | `/api/categories` | Private | Create custom category with custom color | Body: `{ type, name, color }` |
| `PUT` | `/api/categories/:id` | Private | Edit custom category name or color | Body: `{ name, color }` |
| `DELETE` | `/api/categories/:id` | Private | Remove a custom category | — |

### 5. Multi-Country Tax Estimator & Calendar Routes (`/api/taxes`)

| Method | Endpoint | Access | Description | Request Body Payload / Response |
|---|---|---|---|---|
| `POST` | `/api/taxes/estimate` | Private | Calculate & save advance tax estimate | Body: `{ country, state, filingStatus, quarter, grossIncomeForQuarter, businessExpenses, retirementContributions, healthInsurancePremiums, homeOfficeDeductions }` |
| `GET` | `/api/taxes/estimates` | Private | Retrieve all saved tax estimates | Returns array of `TaxEstimate` objects |
| `DELETE` | `/api/taxes/estimates/:id` | Private | Delete a saved tax estimate | — |
| `GET` | `/api/taxes/calendar` | Private | Get upcoming quarterly tax deadlines & alerts | Returns list of calendar events & alerts |

### 6. Chatbot Assist Knowledge Query Route (`/api/chatbot`)

| Method | Endpoint | Access | Description | Request Body Payload |
|---|---|---|---|---|
| `POST` | `/api/chatbot/query` | Public/Private | Query TaxPal Assist knowledge base | Body: `{ query: "How to set monthly budget limits?" }` |

- **Response Format**:
  ```json
  {
    "answer": "🎯 **Category Budgeting & Progress Warnings**\n\nTaxPal helps you control monthly spending with customizable budget caps...",
    "category": "Budgets",
    "actionRoute": "/budgets",
    "actionLabel": "Manage Budgets",
    "quickPrompts": ["How to add a transaction?", "How to create custom categories?"]
  }
  ```

### 7. Financial Reports Engine Routes (`/api/reports`)

| Method | Endpoint | Access | Description | Request Body Payload |
|---|---|---|---|---|
| `GET` | `/api/reports` | Private | Fetch history of generated reports | — |
| `POST` | `/api/reports/generate` | Private | Generate a new financial report record | Body: `{ reportType: "Income Statement", period: "Current Month", format: "PDF" }` |
| `GET` | `/api/reports/download/:id` | Private | Download report as formatted PDF/CSV file | Triggers binary stream download (`Content-Disposition: attachment`) |

---

## 🧮 Core Algorithms & Controller Details

### 1. Multi-Country Tax Calculation Engine (`taxController.js`)
Tax liability is calculated by annualizing quarterly net income ($Net \times 4$), applying regional tax brackets, dividing back into quarterly liability, and adding local levies:

- **USA**: 
  - Progressive Federal Brackets for `Single`, `Married Filing Jointly`, `Head of Household`, `Married Filing Separately`.
  - State income tax rates for all **50 US States + District of Columbia** (ranging from 0% in FL, TX, WA, NV to 9.3% in CA and 8.95% in DC).
  - Self-Employment Tax (15.3% Social Security & Medicare) for Sole Proprietorships/Firms.
- **India**:
  - New Tax Regime progressive slabs (0% up to ₹3L, 5% 3-7L, 10% 7-10L, 15% 10-12L, 20% 12-15L, 30% >₹15L).
  - 4% Health & Education Cess added to total tax liability.
- **United Kingdom**:
  - Standard UK Brackets vs. Scotland Brackets (19% starter rate up to 47% top rate).
  - 6% National Insurance contribution for individuals or 25% Corporation tax for firms.
- **Germany / EU**:
  - Progressive Einkommensteuer brackets (14% to 45%) + 5.5% Solidaritätszuschlag (Solidarity Surcharge).
- **Japan**:
  - Income Tax brackets (5% to 45%) + 10% Local Inhabitant Tax + 5% Enterprise Tax.
- **Canada**:
  - Federal progressive brackets + Provincial rates for all **13 Provinces & Territories** (e.g., ON 13.16%, QC 25.75%, AB 10%) + CPP contribution (11.9%).
- **Australia**: Progressive brackets (16% to 45%) + 2% Medicare Levy.
- **Singapore**: Progressive brackets (2% to 24%) + 6% Medisave Levy.
- **UAE**: 0% individual tax; 9% Corporate Tax for business income exceeding 375,000 AED.

### 2. PDF & CSV Report Generator (`reportController.js`)
- **PDF Generation**: Utilizes PDFKit to dynamically generate formatted document streams with headers, user currency symbol auto-detection based on user country (e.g., `$`, `₹`, `£`, `€`, `¥`, `CA$`, `A$`, `S$`, `AED`), period summary tables, net income calculation, and paginated transaction tables.
- **CSV Generation**: Utilizes `json2csv` parser to convert raw transaction records into formatted CSV format ready for spreadsheet software (Excel, Google Sheets).

### 3. TaxPal Assist Rule-Based Engine (`chatbotController.js`)
- Features a zero-dependency, local regex and keyword scoring algorithm that matches user input against curated knowledge items (Transactions, Auto-Categorization, Budgets, Tax Estimator, Tax Calendar, Profile Settings).
- Returns structured responses complete with markdown formatting, contextual action route links (`actionRoute`), and relevant follow-up prompts (`quickPrompts`).

---

## 🛠️ Execution & Setup Commands

```bash
# 1. Install Node.js dependencies
npm install

# 2. Start server in production mode
npm start

# 3. Start server in development mode (with Nodemon hot-reloading)
npm run dev
```
