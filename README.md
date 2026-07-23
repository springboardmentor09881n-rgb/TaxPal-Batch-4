# 💰 TaxPal - Full-Stack Financial & Tax Management Application

**TaxPal** is a comprehensive MEAN-stack web application designed for personal finance tracking, budget management, smart transaction categorization, advance tax estimation, and financial reporting. Developed as an internship project by **Batch 4**, TaxPal empowers users to take control of their finances and stay tax-ready year-round.

---

## 🌟 Key Application Features

### 📊 1. Interactive Financial Dashboard
- **Real-Time Financial Overview**: High-level KPI cards displaying **Monthly Income**, **Monthly Expenses**, **Estimated Advance Tax**, and **Savings Rate**.
- **Visual Analytics**: Dynamic breakdown charts contrasting income vs. expenses and category-wise spending percentage distribution with color-coded tags.
- **Quick Actions**: One-click modal dialogs to record incoming revenues or outgoing expenses instantly from the dashboard.
- **Recent Transactions Feed**: Live activity log showcasing recent financial entries with category icons and timestamps.

### 💳 2. Transaction Management & Smart Auto-Categorization
- **Full CRUD Operations**: Create, read, update, and delete income and expense records with customizable dates, descriptions, categories, amounts, and notes.
- **Smart Auto-Categorization Engine**: Intelligent rule-based keyword matching algorithm (`suggestCategory`) that automatically suggests the ideal category based on transaction descriptions (e.g., *Swiggy/Zomato* ➔ *Meals & Entertainment*, *AWS/Cloud* ➔ *Business Expenses*, *Uber/Ola* ➔ *Travel*, *Udemy/Coursera* ➔ *Professional Development*).
- **Advanced Filtering & Search**: Filter transactions by type (Income vs Expense), date ranges, search query keywords, and pagination controls.

### 🎯 3. Category-Based Budgeting & Real-Time Progress
- **Monthly Budget Planning**: Set monthly expense limits per category (e.g., *May 2025*).
- **Automated Expense Aggregation**: Server and client dynamically calculate total month-to-date spent amounts against budget goals based on recorded transactions.
- **Visual Budget Progress & Alerts**: Color-coded progress indicators highlighting safe spending, near-limit warnings, and over-budget alerts.

### ⚙️ 4. Custom Category & Profile Management
- **Custom Categories**: Create, edit, and delete personalized income and expense categories complete with custom hex colors.
- **User Profile Settings**: Update personal details including Name, Email, Country, State, and Income Bracket.
- **Security Settings**: Secure in-app password update functionality.

### 🔐 5. Authentication & Security
- **Secure Access**: User registration and login powered by JSON Web Tokens (JWT) and **Bcrypt** password hashing.
- **Password Recovery**: Token-based forgot-password and reset-password workflow with expiration limits.
- **Session Management & Route Guards**: Frontend Angular Auth Guards protecting private routes and ensuring safe session restoration (`sessionStorage`).

--Till here we have completed our project and other features are yet to be implemented.

## 🚀 Tech Stack

### Frontend
- **Framework**: Angular (v19+, Standalone Components & Signals API)
- **Styling**: TailwindCSS & Custom Responsive CSS
- **Language**: TypeScript
- **State & HTTP**: Angular Signals, RxJS, HttpClient, Interceptors

### Backend
- **Runtime & Server**: Node.js & Express.js REST API
- **Database & ODM**: MongoDB & Mongoose
- **Security**: JWT (JSON Web Tokens), Bcrypt hashing
- **Email Service**: Nodemailer (SMTP transport for reset tokens)

---

## 📁 Project Structure

```
TaxPal-Batch-4/
├── backend/                  # Node.js / Express.js Backend API
│   ├── src/
│   │   ├── config/           # Database configuration
│   │   ├── controllers/      # Route controllers (Auth, Budget, Category, Transaction)
│   │   ├── middleware/       # JWT Auth middleware
│   │   ├── models/           # Mongoose schemas (User, Transaction, Budget, Category)
│   │   └── routes/           # Express API endpoints
│   ├── server.js             # API entry point
│   ├── package.json
│   └── README.md             # Backend setup documentation
│
├── frontend/                 # Angular Frontend Client App
│   ├── src/
│   │   └── app/
│   │       ├── components/   # UI components (Dashboard, Transactions, Budgets, Tax Estimator, Settings, Reports)
│   │       ├── pages/        # Router pages & layouts
│   │       ├── services/     # Angular Services (Auth, Data, Transaction, Budget, Category)
│   │       ├── app.routes.ts # App routing definition
│   │       └── models.ts     # TypeScript interfaces
│   ├── angular.json
│   ├── package.json
│   └── README.md             # Frontend setup documentation
│
└── README.md                 # Project README
```

---

## 🔌 API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| **POST** | `/api/auth/register` | Register a new user | Public |
| **POST** | `/api/auth/login` | Authenticate user & get JWT | Public |
| **POST** | `/api/auth/forgot-password` | Request password reset email token | Public |
| **POST** | `/api/auth/reset-password` | Reset password using token | Public |
| **PUT** | `/api/auth/change-password` | Update current password | Private |
| **GET** | `/api/transactions` | Fetch user transactions | Private |
| **POST** | `/api/transactions` | Add a new transaction | Private |
| **PUT** | `/api/transactions/:id` | Update an existing transaction | Private |
| **DELETE** | `/api/transactions/:id` | Delete a transaction | Private |
| **GET** | `/api/budgets` | Get budgets with calculated spent amounts | Private |
| **POST** | `/api/budgets` | Create category budget | Private |
| **PUT** | `/api/budgets/:id` | Update budget entry | Private |
| **DELETE** | `/api/budgets/:id` | Remove a budget entry | Private |
| **GET** | `/api/categories` | Get user custom categories | Private |
| **POST** | `/api/categories` | Add a new category | Private |
| **PUT** | `/api/categories/:id` | Update custom category | Private |
| **DELETE** | `/api/categories/:id` | Delete custom category | Private |

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** running locally or a MongoDB Atlas URI

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_key
   MONGODB_URI=mongodb://localhost:27017/taxpal
   ```
4. Start backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Angular development server:
   ```bash
   npm start
   ```
4. Access application at: `http://localhost:4200`

---

## 👥 Development Team

Developed as an Internship Project by **Batch 4**.
