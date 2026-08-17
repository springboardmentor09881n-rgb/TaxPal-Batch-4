# 🎨 TaxPal - Frontend Angular Client Application Documentation

The **TaxPal Frontend Application** is a responsive web client built with **Angular v21**, featuring **Standalone Components**, the reactive **Angular Signals API**, **RxJS state streams**, and styled with **TailwindCSS v4**. It provides a user experience for managing personal finances, category budgeting, smart transaction auto-categorization, advance tax estimations, tax calendar alerts, interactive report exports, and an embedded AI chatbot assist widget.

---

## 🚀 Live Production Deployment

- 🌐 **Live Application URL**: [https://taxpal-blue.vercel.app](https://taxpal-blue.vercel.app)
- 🖥️ **Hosting Provider**: **Vercel**
- ⚡ **Target Backend REST API**: `https://taxpal-f8g1.onrender.com/api`
- ⚙️ **SPA Routing Config**: Managed via [`vercel.json`](file:///c:/Users/igved/Documents/infosys-project/TaxPal-Batch-4/frontend/vercel.json)

---

## 🛠️ Technology Stack & Key Libraries

| Category | Technology | Version | Description / Purpose |
|---|---|---|---|
| **Framework** | Angular | `v21.2.0` | Client-side Single Page Application (SPA) framework |
| **Architecture** | Standalone Components | — | Modern Angular modular structure without standard `NgModule` boilerplate |
| **State Management** | Angular Signals & RxJS | `^7.8.0` | Reactive state management (`signal`, `computed`, `effect`, `BehaviorSubject`) |
| **Styling** | TailwindCSS & PostCSS | `^4.1.12` / `^8.5.3` | Utility-first CSS framework with `@tailwindcss/postcss` |
| **Language** | TypeScript | `~5.9.2` | Strongly typed JavaScript |
| **HTTP & Routing** | Angular `HttpClient` & Router | `v21.2.0` | REST API communication, interceptors, and protected client routes |
| **PDF Client Export** | jsPDF | `^4.2.1` | Client-side PDF preview and document utilities |
| **Build & Test** | Angular CLI & Vitest | `v21.2.18` / `^4.0.8` | Fast building, hot-reloading development server, and unit testing |

---

## ⚙️ Environment Configuration & Deployment Setup

### 1. Production API Endpoint (`environment.ts`)
The API base URL used by Angular services is defined in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://taxpal-f8g1.onrender.com/api'
};
```

### 2. Vercel SPA Routing Configuration (`vercel.json`)
To support Angular client-side deep linking without 404 page refreshes, `vercel.json` maps all incoming web paths back to `index.html`:

```json
{
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

---

## 📁 Repository Architecture & Directory Tree

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/                     # Modular, presentation-layer UI components
│   │   │   ├── budgets-page/               # Category budget limits UI, progress bars & warnings
│   │   │   ├── chatbot-widget/             # Interactive floating AI assistant widget & query stream
│   │   │   ├── dashboard/                  # Dashboard KPI summary cards, cash flow & expense charts
│   │   │   ├── login/                      # User sign-in card component
│   │   │   ├── reports-page/               # Financial report builder, period selector & PDF/CSV exporter
│   │   │   ├── settings-page/              # User profile details, password update & custom category builder
│   │   │   ├── sidebar/                    # Navigation sidebar layout & brand header
│   │   │   ├── signup/                     # New user account registration form
│   │   │   ├── tax-estimator-page/         # Advance tax calculator UI, state rates & tax calendar
│   │   │   ├── tax-notification-panel/      # Drawer for upcoming tax deadlines & over-budget alerts
│   │   │   └── transactions-page/          # Transaction table, search, category filter & modal dialog
│   │   ├── pages/                          # Container pages & router layout shells
│   │   │   ├── budgets-page/               # Budget container shell page
│   │   │   ├── dashboard-layout/           # Protected layout wrapper with sidebar, chatbot & notifications
│   │   │   ├── dashboard-page/             # Main dashboard container page
│   │   │   ├── forgot-password-page/       # Request password reset token view
│   │   │   ├── login-page/                 # Login view container
│   │   │   ├── reports-page/               # Financial reports container page
│   │   │   ├── reset-password-page/        # Password reset token validation view
│   │   │   ├── settings-page/              # User settings container page
│   │   │   ├── signup-page/                # Account registration view container
│   │   │   ├── tax-estimator-page/         # Tax estimator container page
│   │   │   └── transactions-page/          # Transactions container page
│   │   ├── services/                       # Client state management & REST API communication services
│   │   │   ├── auth.service.ts             # Auth state, login/signup HTTP calls, JWT `sessionStorage`
│   │   │   ├── budget.service.ts           # Monthly budget CRUD & MTD spent aggregation
│   │   │   ├── category.service.ts         # Custom category store & hex color palette manager
│   │   │   ├── chatbot.service.ts          # TaxPal Assist query service
│   │   │   ├── data.service.ts             # Central reactive state coordinator & signals store
│   │   │   ├── report.service.ts           # Report generation & binary blob file downloader
│   │   │   ├── tax-estimate.service.ts     # Quarterly advance tax calculator API client
│   │   │   ├── toast.service.ts            # Client toast notification manager (success/error)
│   │   │   └── transaction.service.ts      # Transaction CRUD API endpoints wrapper
│   │   ├── app.routes.ts                   # Angular route declarations & guard mappings
│   │   ├── auth.guard.ts                   # Route guard protecting authenticated pages
│   │   ├── models.ts                       # TypeScript interfaces (`User`, `Transaction`, `Budget`, etc.)
│   │   ├── app.config.ts                   # Client providers (HttpClient, Router, Animations)
│   │   └── app.ts                          # Root component host
│   ├── environments/                       # Environment configuration files
│   │   └── environment.ts                  # Target API base URL setup
│   ├── public/                             # Static assets (brand icons, images)
│   ├── index.html                          # Single page HTML entry file
│   └── styles.css                          # Global Tailwind imports & custom scrollbar styles
├── angular.json                            # Angular CLI workspace configuration
├── vercel.json                             # Vercel deployment SPA rewrite rules
├── package.json                            # Package scripts & dependencies
├── tsconfig.json                           # TypeScript compiler settings
└── README.md                               # Frontend architecture guide
```

---

## 🗺️ Application Routes & Protection Matrix

All protected routes are wrapped inside `DashboardLayoutComponent` and guarded by `authGuard` (verifying token presence in `sessionStorage`):

| Route Path | Component View | Guard | Description |
|---|---|---|---|
| `/login` | `LoginPageComponent` | None | User authentication sign-in page |
| `/signup` | `SignupPageComponent` | None | Account registration page |
| `/forgot-password` | `ForgotPasswordComponent` | None | Password reset request token form |
| `/reset-password` | `ResetPasswordComponent` | None | Password reset form requiring token query parameter |
| `/` | `DashboardLayoutComponent` | `authGuard` | Main protected master layout shell |
| `/dashboard` | `DashboardPageComponent` | `authGuard` | Overview stats, KPI summary cards, and quick add modals |
| `/transactions` | `TransactionsPageShellComponent` | `authGuard` | Transaction log, multi-field search, filters & CRUD modal |
| `/budgets` | `BudgetsPageShellComponent` | `authGuard` | Monthly category spending caps & status progress indicators |
| `/tax-estimator` | `TaxEstimatorPageComponent` | `authGuard` | Multi-country tax estimator, deductions & tax calendar |
| `/reports` | `ReportsPageShellComponent` | `authGuard` | Financial report generator & PDF/CSV downloader |
| `/settings` | `SettingsPageComponent` | `authGuard` | Profile settings, password change & custom categories |
| `**` | Redirect to `/dashboard` | — | Fallback route handler |

---

## ⚡ Angular Services Architecture

- **`AuthService`**: Manages user login, registration, JWT token storage in `sessionStorage`, profile retrieval, and password recovery workflows.
- **`DataService`**: The primary reactive hub using Angular Signals (`signal`, `computed`). Coordinates transactions, budgets, categories, and tax estimates across components to ensure real-time UI synchronization without page refreshes.
- **`TransactionService`**: Communicates with `/api/transactions` for transaction creation, updates, deletion, and query parameter filtering.
- **`BudgetService`**: Fetches monthly budget goals, aggregates month-to-date spending from transaction history, and calculates budget status warnings.
- **`CategoryService`**: Manages default and custom income/expense categories, hex colors, and custom icon tags.
- **`TaxEstimateService`**: Communicates with `/api/taxes` to run multi-country tax calculations, compute deductible expenses, and retrieve tax calendar events.
- **`ReportService`**: Triggers report generation API requests and handles binary response streams (`Blob`) to seamlessly prompt browser PDF/CSV file downloads.
- **`ChatbotService`**: Sends user prompts to `/api/chatbot/query` and manages chat history state.
- **`ToastService`**: Displays feedback toast notifications (success, error, info, warning) in the top-right corner of the application.

---

## 🧠 Smart Client-Side Features

### 1. Smart Auto-Categorization Engine (`suggestCategory`)
As the user types a transaction description in the **Record Transaction** modal, the frontend runs a merchant matching function:

- **Meals & Entertainment**: *Swiggy, Zomato, Starbucks, Restaurant, Cafe, Dining, UberEats, McDonald's*
- **Travel & Transportation**: *Uber, Ola, Lyft, Petrol, Fuel, Gas, Flight, Train, Indigo, Metro*
- **Business Expenses**: *AWS, Google Cloud, Azure, Hostinger, Domain, SaaS, Software, Zoom, GitHub*
- **Professional Development**: *Udemy, Coursera, Pluralsight, Book, Kindle, Certification, Course*
- **Utilities**: *Electricity, Water, Internet, Broadband, Wifi, Mobile, Recharge*
- **Groceries**: *Supermarket, Grocery, Walmart, Target, Blinkit, Zepto, D-Mart*

### 2. TaxPal Assist AI Floating Chatbot Widget (`ChatbotWidget`)
- Positioned in the bottom-right corner of protected pages.
- Toggles an interactive messaging panel supporting markdown rendering, auto-scrolling streams, quick suggestion chips, and dynamic navigation buttons (e.g., clicking "Go to Transactions" routes the user directly to `/transactions`).

### 3. Financial Reports & Export Engine (`ReportsPageComponent`)
- Allows users to select report types (*Income Statement*, *Expense Report*, *Tax Summary*), time periods (*Current Month*, *Last Month*, *Current Quarter*, *Last Quarter*, *Year to Date*), and format (*PDF*, *CSV*).
- Downloads generated reports directly using browser `Blob` creation and Object URLs.

### 4. Over-Budget & Tax Deadline Drawer (`TaxNotificationPanel`)
- Slides out from the top-right header to show urgent tax deadlines (e.g., Q1/Q2/Q3/Q4 estimated tax due dates) and warning badges for budget categories exceeding 75% or 100% of their limit.

---

## 🚀 Deploying Frontend to Vercel

```bash
# 1. Install Vercel CLI (optional)
npm install -g vercel

# 2. Deploy directly from command line
vercel --prod
```

Or connect your GitHub repository directly to Vercel dashboard.

---

## 🛠️ Developer CLI Commands

```bash
# 1. Install frontend dependencies
npm install

# 2. Start local Angular development server
npm start
# Server available at http://localhost:4200/ with hot reloading

# 3. Build optimized production bundle
npm run build
# Compiled output saved in dist/ directory

# 4. Watch mode development build
npm run watch

# 5. Run Vitest unit test suite
npm test
```
