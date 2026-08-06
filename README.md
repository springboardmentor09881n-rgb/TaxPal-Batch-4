# 💰 TaxPal - Full-Stack Financial & Tax Management Application

**TaxPal** is a modern, comprehensive full-stack web application designed for personal finance tracking, category budgeting, smart transaction auto-categorization, multi-country advance tax estimation, tax calendar scheduling, and financial reporting. Developed as an internship project by **Batch 4**, TaxPal empowers users to seamlessly manage their money, track monthly expenses against customizable budget limits, and stay tax-ready year-round.

---

## 🌟 Key Features

### 📊 1. Interactive Financial Dashboard
- **Real-Time Financial Metrics**: Instant access to KPI summary cards showing **Total Monthly Income**, **Total Monthly Expenses**, **Estimated Advance Tax**, and **Savings Rate**.
- **Dynamic Cash Flow & Expense Analytics**: Visual breakdown charts showing income vs. expenses, net balances, and category-wise spending distribution with custom color tags.
- **Quick Action Modals**: One-click modal dialogs to record new income or expense transactions directly from the main view.
- **Live Activity Feed**: Real-time transaction history showcasing recent financial entries with category badges and timestamps.

### 💳 2. Transaction Management & Smart Auto-Categorization
- **Full CRUD Operations**: Add, view, edit, and delete transactions with customizable date, description, category, amount, notes, and transaction type (*Income* vs *Expense*).
- **Smart Auto-Categorization Engine**: Intelligent keyword-matching algorithm (`suggestCategory`) that automatically suggests the appropriate category based on item descriptions (e.g., *Swiggy/Zomato* ➔ *Meals & Entertainment*, *AWS/Cloud* ➔ *Business Expenses*, *Uber/Ola* ➔ *Travel*, *Udemy/Coursera* ➔ *Professional Development*).
- **Advanced Search & Filtering**: Filter entries by type, category, date range, or keyword search query with paginated results.

### 🎯 3. Category Budgeting & Progress Indicators
- **Monthly Category Limits**: Set category-specific expense caps for any month (e.g., `May, 2025`).
- **Automated Expense Tracking**: Aggregates month-to-date spending dynamically per category.
- **Visual Budget Warnings**: Color-coded progress bars and status indicators highlighting safe spending, near-limit warnings, and over-budget alerts.

### 🧮 4. Multi-Country Advance Tax Estimator & Tax Calendar
- **Multi-Jurisdiction Support**:
  - **USA**: Federal income tax brackets (Single, Married Filing Jointly, Head of Household, Married Filing Separately) + State income tax rates for all 50 US States + Washington D.C.
  - **India**: New Tax Regime income tax slabs & exemptions.
  - **UK**: Standard UK income tax rates & personal allowance deductions.
  - **Canada**: Federal income tax brackets.
- **Tax Deductions & Savings Calculator**: Factors in business expenses, retirement contributions, health insurance premiums, and home office deductions.
- **Quarterly Calculations**: Calculates estimated quarterly payments (`Q1`, `Q2`, `Q3`, `Q4`) and tax liability.
- **Tax Calendar & Alerts**: Integrated interactive quarterly due date calendar with automated reminder alerts for upcoming tax deadlines.

### 📈 5. Financial Reports & Analytics
- Visual breakdown of income vs. expense trends over time.
- Detailed spending breakdown by category with financial health metrics.
- Exportable/printable summary reports.

### ⚙️ 6. Custom Category & User Profile Management
- **Custom Category Creation**: Add, edit, and delete custom income/expense categories with personalized hex colors.
- **User Profile Settings**: Update personal details including Name, Email, Country, State, and Income Bracket.
- **Security & Password Management**: Secure in-app password changes.

### 🔐 7. Authentication & Security
- **JWT Authentication**: User registration and login secured with JSON Web Tokens (JWT) and **Bcrypt** password hashing.
- **Password Recovery via SMTP**: Token-based forgot-password and password reset workflow sent directly via email with expiration handling.
- **Route Guards & Session Persistence**: Protected client-side routes via Angular Auth Guards with secure `sessionStorage` management.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Angular (v21+, Standalone Components, Angular Signals API)
- **Styling**: TailwindCSS v4, PostCSS, Custom Utility CSS
- **Language**: TypeScript (v5.9+)
- **State & HTTP**: Angular Signals, RxJS, HttpClient, HTTP Interceptors
- **Build & Test**: Angular CLI, Vitest

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (v5.x REST API)
- **Database & ODM**: MongoDB & Mongoose (v8.x)
- **Security**: JWT (JSON Web Tokens), Bcrypt password hashing
- **Email Transport**: Nodemailer (SMTP integration for reset token emails)
- **Environment**: Dotenv

---

## 📁 Project Structure

```
TaxPal-Batch-4/
├── backend/                  # Express.js REST API Backend
│   ├── src/
│   │   ├── config/           # Database connection setup (db.js)
│   │   ├── controllers/      # Route logic (auth, budget, category, tax, transaction)
│   │   ├── middleware/       # JWT Auth middleware (authMiddleware.js)
│   │   ├── models/           # Mongoose Schemas (User, Transaction, Budget, Category, TaxEstimate, Alert)
│   │   ├── routes/           # Express API endpoints (auth, budgets, categories, tax, transactions)
│   │   └── app.js            # Express app configuration & middleware routing
│   ├── server.js             # Node.js server entry point
│   ├── package.json
│   └── README.md             # Backend documentation & API guide
│
├── frontend/                 # Angular Standalone Frontend Client
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Modular UI components (Dashboard, Transactions, Budgets, Tax Estimator, Settings, Reports, Sidebar, Toast)
│   │   │   ├── pages/        # Router page views & layout shells
│   │   │   ├── services/     # Angular Services (Auth, Data, Transaction, Budget, Category, TaxEstimate, Toast)
│   │   │   ├── app.routes.ts # Frontend routing definitions & Auth Guard
│   │   │   ├── auth.guard.ts # Session route protection
│   │   │   └── models.ts     # TypeScript interfaces & data models
│   ├── angular.json
│   ├── package.json
│   └── README.md             # Frontend setup & architecture guide
│
└── README.md                 # Main Project Documentation
```

---

## 🔌 REST API Endpoints Overview

| Module | Method | Endpoint | Description | Access |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register a new user | Public |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & receive JWT token | Public |
| **Auth** | `POST` | `/api/auth/forgot-password` | Request password reset token via email | Public |
| **Auth** | `POST` | `/api/auth/reset-password` | Reset user password using valid token | Public |
| **Auth** | `PUT` | `/api/auth/change-password` | Change current password | Private |
| **Transactions** | `GET` | `/api/transactions` | Fetch user transactions (with search/filters) | Private |
| **Transactions** | `POST` | `/api/transactions` | Add a new transaction record | Private |
| **Transactions** | `PUT` | `/api/transactions/:id` | Update an existing transaction | Private |
| **Transactions** | `DELETE` | `/api/transactions/:id` | Remove a transaction | Private |
| **Budgets** | `GET` | `/api/budgets` | Get category budgets with month-to-date spent | Private |
| **Budgets** | `POST` | `/api/budgets` | Set category monthly budget limit | Private |
| **Budgets** | `PUT` | `/api/budgets/:id` | Update category budget entry | Private |
| **Budgets** | `DELETE` | `/api/budgets/:id` | Delete category budget entry | Private |
| **Categories** | `GET` | `/api/categories` | Retrieve custom categories | Private |
| **Categories** | `POST` | `/api/categories` | Create custom category with custom color | Private |
| **Categories** | `PUT` | `/api/categories/:id` | Edit custom category | Private |
| **Categories** | `DELETE` | `/api/categories/:id` | Remove custom category | Private |
| **Tax Estimator**| `POST` | `/api/taxes/estimate` | Calculate & save advance tax estimate | Private |
| **Tax Estimator**| `GET` | `/api/taxes/estimates` | Get all saved tax estimates for user | Private |
| **Tax Estimator**| `DELETE`| `/api/taxes/estimates/:id`| Remove a saved tax estimate | Private |
| **Tax Estimator**| `GET` | `/api/taxes/calendar` | Retrieve tax calendar events & reminder alerts | Private |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18.x or v20.x recommended)
- **npm** (v10+ packaged with Node)
- **MongoDB** running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

---

### 1. Backend Installation & Setup

1. Open terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` configuration file inside `backend/` (refer to `.env.example`):
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   MONGODB_URI=mongodb://localhost:27017/taxpal
   DB_NAME=taxpal
   DB_HOST=localhost
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   FRONTEND_URL=http://localhost:4200
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend API will run on `http://localhost:5000`.

---

### 2. Frontend Installation & Setup

1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Angular development server:
   ```bash
   npm start
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:4200
   ```

---

## 👥 Development Team

Developed as an Internship Project by **Batch 4**.
