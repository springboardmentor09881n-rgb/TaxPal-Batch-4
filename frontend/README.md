# TaxPal - Frontend Application

This repository contains the standalone client-side user interface for **TaxPal**, an internship project developed for Batch 4. The application is built using **Angular v21** with **Standalone Components**, the **Angular Signals API**, and **TailwindCSS v4**.

---

## 🛠️ Tech Stack

- **Framework**: Angular (v21+, Standalone Component Architecture)
- **State Management**: Angular Signals (`signal`, `computed`, `effect`) & RxJS (`BehaviorSubject`, `Observable`)
- **Styling**: TailwindCSS (v4.x) & `@tailwindcss/postcss`
- **Language**: TypeScript (v5.9+)
- **HTTP Client**: Angular `HttpClient` with Interceptors & JWT authorization headers
- **Routing**: Angular Router with Auth Route Guards
- **Testing & Tooling**: Vitest, Angular CLI, Prettier

---

## 📁 Application Architecture

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/                # Reusable modular UI components
│   │   │   ├── budgets-page/          # Category budget limits UI & visual progress bars
│   │   │   ├── dashboard/             # Core dashboard overview cards & cash flow charts
│   │   │   ├── login/                 # User sign-in form
│   │   │   ├── reports-page/          # Analytics & financial reports overview
│   │   │   ├── settings-page/         # User profile update & category management
│   │   │   ├── sidebar/               # Navigation sidebar layout component
│   │   │   ├── signup/                # New account registration form
│   │   │   ├── tax-estimator-page/    # Advance tax calculator UI & tax calendar
│   │   │   ├── tax-notification-panel/ # Notification drawer for tax deadlines & warnings
│   │   │   └── transactions-page/     # Transactions table, search, filters & CRUD modal
│   │   ├── pages/                     # Page view containers & router layouts
│   │   │   ├── budgets-page/          # Budget shell page
│   │   │   ├── dashboard-layout/      # Protected dashboard main layout wrapper
│   │   │   ├── dashboard-page/        # Main dashboard container page
│   │   │   ├── forgot-password-page/  # Request password reset token page
│   │   │   ├── login-page/            # Login page view
│   │   │   ├── reports-page/          # Financial reports container page
│   │   │   ├── reset-password-page/   # Password reset form page
│   │   │   ├── settings-page/         # Settings & profile container page
│   │   │   ├── signup-page/           # Signup page view
│   │   │   ├── tax-estimator-page/    # Tax estimator container page
│   │   │   └── transactions-page/     # Transactions container page
│   │   ├── services/                  # Angular Services for API & State
│   │   │   ├── auth.service.ts        # Authentication state, login, register, reset token
│   │   │   ├── budget.service.ts      # Budget creation, spending aggregation
│   │   │   ├── category.service.ts    # Custom categories & color palette management
│   │   │   ├── data.service.ts        # Central application data & sync state
│   │   │   ├── tax-estimate.service.ts# Quarterly tax calculator API connection
│   │   │   ├── toast.service.ts       # Application toast notifications
│   │   │   └── transaction.service.ts # Transaction CRUD API methods
│   │   ├── app.routes.ts              # Route declarations & route guards
│   │   ├── auth.guard.ts              # Session route protection guard
│   │   └── models.ts                  # TypeScript interfaces (User, Transaction, Budget, etc.)
│   ├── public/                        # Static assets (images, icons)
│   ├── index.html                     # HTML root template
│   └── styles.css                     # Global CSS & Tailwind imports
├── angular.json                       # Angular CLI configuration
├── package.json
└── README.md
```

---

## 🗺️ Application Routes

| Path | Component | Guard | Description |
|---|---|---|---|
| `/login` | `LoginPageComponent` | None | User authentication login page |
| `/signup` | `SignupPageComponent` | None | User account creation page |
| `/forgot-password` | `ForgotPasswordComponent` | None | Password reset request form |
| `/reset-password` | `ResetPasswordComponent` | None | Token-validated password reset page |
| `/` | `DashboardLayoutComponent` | `authGuard` | Protected dashboard master layout |
| `/dashboard` | `DashboardPageComponent` | `authGuard` | Overview stats, KPI cards & quick add modals |
| `/transactions` | `TransactionsPageShellComponent` | `authGuard` | Complete transaction history, search & filter |
| `/budgets` | `BudgetsPageShellComponent` | `authGuard` | Category monthly budgets & spent progress |
| `/tax-estimator` | `TaxEstimatorPageComponent` | `authGuard` | Multi-country advance tax calculator & calendar |
| `/settings` | `SettingsPageComponent` | `authGuard` | Profile settings, password change & custom categories |

---

## ⚡ Core Angular Services

- **`AuthService`**: Handles user login, registration, JWT token storage in `sessionStorage`, profile retrieval, and password reset workflows.
- **`TransactionService`**: Communicates with `/api/transactions` to fetch, create, update, and delete financial entries.
- **`BudgetService`**: Manages category budget targets, month-to-date calculation of spending against limits, and alert triggers.
- **`CategoryService`**: Manages custom category creations, color assignments, and default category icons.
- **`TaxEstimateService`**: Executes multi-country advance tax calculations, calculates quarterly estimates (`Q1`-`Q4`), deductions, and tax calendar alerts.
- **`DataService`**: Central reactive store coordinating state signals across components.
- **`ToastService`**: Provides user notifications for success/error feedback across the UI.

---

## 🧠 Smart Auto-Categorization Feature

The frontend features an embedded rule-based auto-categorization algorithm (`suggestCategory`) that analyzes user transaction descriptions in real-time and recommends appropriate categories:

- **Meals & Entertainment**: *Swiggy, Zomato, Starbucks, Restaurant, Cafe, Dining, UberEats, McDonald's*
- **Travel & Transportation**: *Uber, Ola, Lyft, Petrol, Fuel, Gas, Flight, Train, Indigo, Metro*
- **Business Expenses**: *AWS, Google Cloud, Azure, Hostinger, Domain, SaaS, Software, Zoom, GitHub*
- **Professional Development**: *Udemy, Coursera, Pluralsight, Book, Kindle, Certification, Course*
- **Utilities**: *Electricity, Water, Internet, Broadband, Wifi, Mobile, Recharge*
- **Groceries**: *Supermarket, Grocery, Walmart, Target, Blinkit, Zepto, D-Mart*

---

## 🛠️ CLI Development Commands

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm start
# App running at http://localhost:4200/ (hot reloads on file save)

# 3. Build for Production
npm run build
# Compiled bundle output generated in dist/ directory

# 4. Watch build in development mode
npm run watch

# 5. Execute Unit Tests
npm test
```
