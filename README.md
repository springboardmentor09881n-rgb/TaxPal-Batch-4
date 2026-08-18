# 💰 TaxPal - Full-Stack Financial & Tax Management Application

**TaxPal** is a state-of-the-art full-stack web application designed for personal finance tracking, category budgeting, smart merchant transaction auto-categorization, multi-country advance tax estimation, interactive tax calendar management, AI chatbot assistance, and downloadable financial reporting.

Developed as a flagship internship project by **Batch 4**, TaxPal empowers individuals, freelancers, and small business owners to seamlessly manage their money, track monthly expenses against budget limits, stay tax-ready year-round across international jurisdictions, and generate audit-ready financial statements in PDF or CSV format.

---

## 🚀 Live Production Deployment

TaxPal is fully deployed and accessible live online:

- 🌐 **Live Web Application (Frontend)**: [https://taxpal-blue.vercel.app](https://taxpal-blue.vercel.app) *(Hosted on Vercel)*
- ⚡ **Live REST API (Backend)**: [https://taxpal-f8g1.onrender.com/api](https://taxpal-f8g1.onrender.com/api) *(Hosted on Render Web Service)*
- 🗄️ **Cloud Database**: **MongoDB Atlas Cluster** (`taxpal.m7jzazy.mongodb.net`)

---

## 🌟 Key Platform Features

### 📊 1. Interactive Financial Dashboard
- **Real-Time Financial Metrics**: Instant access to KPI summary cards displaying **Total Monthly Income**, **Total Monthly Expenses**, **Estimated Quarterly Advance Tax**, and **Savings Rate**.
- **Dynamic Cash Flow & Expense Analytics**: Visual breakdown charts showing income vs. expenses, net cash balance, and category-wise spending distribution with custom color badges.
- **Quick Action Modals**: One-click modal dialogs to record new income or expense transactions directly from the main view.
- **Live Activity Feed**: Real-time transaction history showcasing recent financial entries with category tags and timestamps.

### 💳 2. Transaction Management & Smart Auto-Categorization
- **Full CRUD Operations**: Create, view, edit, and delete transactions with customizable date, description, category, amount, notes, and transaction type (*Income* vs. *Expense*).
- **Smart Auto-Categorization Engine**: Intelligent keyword-matching algorithm (`suggestCategory`) that automatically detects and assigns appropriate categories as you type transaction descriptions:
  - 🍔 *Swiggy / Zomato / Starbucks / Restaurant* ➔ **Meals & Entertainment**
  - 🚗 *Uber / Ola / Fuel / Gas / Flight / Metro* ➔ **Travel & Transportation**
  - 💻 *AWS / Google Cloud / Azure / SaaS / Software* ➔ **Business Expenses**
  - 📚 *Udemy / Coursera / Books / Certification* ➔ **Professional Development**
  - 🛍️ *Amazon / Walmart / Blinkit / Supermarket* ➔ **Groceries & Shopping**
- **Advanced Search & Filtering**: Filter entries by type (*Income* / *Expense*), category, date range, or keyword search query with instant updates.

### 🎯 3. Category Budgeting & Visual Warnings
- **Monthly Category Limits**: Set category-specific spending caps for any month (e.g., `2025-05`).
- **Automated MTD Tracking**: Aggregates month-to-date spending dynamically per category.
- **Visual Status Progress Bars**:
  - 🟢 **Safe (< 75%)**: Spending is well within the allocated budget cap.
  - 🟡 **Near Limit (75% - 100%)**: Visual warning alert notifying the user of approaching budget cap.
  - 🔴 **Over Budget (> 100%)**: Critical status badge highlighting budget overrun.

### 🧮 4. Multi-Country Advance Tax Estimator & Tax Calendar
- **Multi-Jurisdiction Tax Bracket Support**:
  - 🇺🇸 **USA**: Federal income tax brackets (`Single`, `Married Filing Jointly`, `Head of Household`, `Married Filing Separately`) + State income tax rates for all **50 US States + District of Columbia** + Self-Employment Tax (15.3%).
  - 🇮🇳 **India**: New Tax Regime income tax slabs (0% to 30%) + 4% Health & Education Cess.
  - 🇬🇧 **UK**: Standard UK income tax brackets + Scotland tax brackets + Corporation Tax (25%) + National Insurance (6%).
  - 🇩🇪 **Germany / EU**: Progressive Einkommensteuer brackets (14% to 45%) + 5.5% Solidarity Surcharge.
  - 🇯🇵 **Japan**: Progressive national income tax + 10% Local Inhabitant Tax + 5% Enterprise Tax.
  - 🇨🇦 **Canada**: Federal progressive brackets + Provincial rates for all **13 Provinces & Territories** + CPP (11.9%).
  - 🇦🇺 **Australia**: Progressive brackets (16% to 45%) + 2% Medicare Levy.
  - 🇸🇬 **Singapore**: Progressive brackets (2% to 24%) + 6% Medisave Levy.
  - 🇦🇪 **UAE**: 0% personal income tax; 9% Corporate Tax for business income above 375,000 AED.
- **Tax Deductions & Savings Calculator**: Factors in business expenses, retirement contributions (401k/IRA/EPF), health insurance premiums, and home office deductions.
- **Quarterly Tax Breakdown**: Computes estimated quarterly tax liability (`Q1`, `Q2`, `Q3`, `Q4`) and taxable net income.
- **Tax Calendar & Due Date Drawer**: Interactive quarterly due date calendar with automated reminder notifications for upcoming tax deadlines.

### 📈 5. Financial Reports & Export Engine
- **Report Types**: Generates **Income Statements**, **Expense Reports**, and **Tax Summaries**.
- **Time Periods**: Customizable date filtering (**Current Month**, **Last Month**, **Current Quarter**, **Last Quarter**, **Year to Date**).
- **Export Formats**: One-click download of audit-ready formatted **PDF** documents (built via PDFKit with user country currency symbol auto-formatting) or **CSV** files (built via json2csv) for external analysis.

### 🤖 6. TaxPal Assist AI Floating Chatbot Widget
- **Interactive Assistant Widget**: Bottom-right floating assistant panel embedded in the app layout.
- **Rule-Based Knowledge Engine**: Powered by regex and keyword scoring for navigation help, budget rules, transaction tips, and tax bracket explanations.
- **Quick Prompts & Navigation**: Provides quick follow-up prompt chips and clickable action buttons that navigate users directly to app pages (e.g., *Go to Transactions*, *Manage Budgets*).

### ⚙️ 7. Custom Category & User Profile Management
- **Custom Category Builder**: Create, edit, and delete custom income/expense categories with personalized hex colors.
- **User Profile Settings**: Update personal details including Name, Email, Country, State, and Income Bracket.
- **Password Security**: Secure in-app password changes.

### 🔐 8. Authentication & Password Recovery Workflow
- **JWT Token Authentication**: User registration and login secured with JSON Web Tokens (JWT) and **Bcrypt** password hashing.
- **Password Recovery via SMTP**: Token-based forgot-password and password reset workflow sent directly via email with expiration handling.
- **Route Protection**: Protected client-side routes via Angular Auth Guards with secure `sessionStorage` management.

---

## 🛠️ Tech Stack Overview

### Frontend Client
- **Framework**: Angular (`v21.2.0`, Standalone Components Architecture)
- **State Management**: Angular Signals (`signal`, `computed`, `effect`), RxJS State Streams
- **Styling**: TailwindCSS (`v4.1.12`), PostCSS (`v8.5.3`), Custom Utility CSS
- **Language**: TypeScript (`v5.9.2`)
- **HTTP & Routing**: Angular `HttpClient`, HTTP Interceptors, Angular Router, Auth Guards
- **PDF Generation**: jsPDF (`v4.2.1`)
- **Testing & Tooling**: Vitest (`v4.0.8`), Angular CLI (`v21.2.18`)

### Backend REST API
- **Runtime Environment**: Node.js (`v18.x` / `v20.x`)
- **Web Framework**: Express.js (`v5.2.1` REST API)
- **Database & ODM**: MongoDB & Mongoose (`v8.0.0`)
- **Security & Auth**: JWT (`jsonwebtoken` `v9.0.3`), Bcrypt password hashing (`v6.0.0`), Express Rate Limit (`v8.6.2`)
- **Email Transport**: Nodemailer (`v9.0.3` SMTP integration for reset token emails)
- **Document Exporters**: PDFKit (`v0.19.1` dynamic PDF builder), json2csv (`v6.0.0-alpha.2`)
- **Environment**: Dotenv (`v17.4.2`), CORS (`v2.8.6`)

---

## 🌐 Production Architecture & Deployment Matrix

```
                      +-----------------------------+
                      |    User Web Browser         |
                      +--------------+--------------+
                                     |
                    HTTPS Request    |    HTTPS REST API
                    (Single Page App)|    (JWT Auth)
                                     v
         +---------------------------+---------------------------+
         |                                                       |
         v                                                       v
+------------------------+                             +-------------------+
|  Vercel Frontend Host  |                             | Render API Host   |
|  taxpal-blue.vercel.app|                             | taxpal-f8g1.onrender.com |
|  (Angular SPA + vercel.json)                         | (Express REST API)|
+------------------------+                             +---------+---------+
                                                                 |
                                                          Mongoose ODM
                                                                 v
                                                       +-------------------+
                                                       | MongoDB Atlas DB  |
                                                       | Cloud Cluster     |
                                                       +-------------------+
```

- **Frontend Hosting (Vercel)**: Serves compiled Angular assets with URL rewriting via [`frontend/vercel.json`](file:///c:/Users/igved/Documents/infosys-project/TaxPal-Batch-4/frontend/vercel.json) to handle SPA client-side routing.
- **Backend Hosting (Render)**: Runs the Express REST API container. Reads configuration from environment variables (`FRONTEND_URL`, `MONGODB_URI`, `JWT_SECRET`, `PORT`).
- **Database (MongoDB Atlas)**: Cloud database cluster handling persistent collections for users, transactions, budgets, custom categories, tax estimates, reports, and alerts.
- **CORS Protection**: Express backend whitelist validates requests originating from `https://taxpal-blue.vercel.app` and local dev origins.

---

## 📁 Repository Directory Structure

```
TaxPal-Batch-4/
├── backend/                  # Express.js REST API Backend
│   ├── src/
│   │   ├── config/           # MongoDB connection setup (db.js)
│   │   ├── controllers/      # Route logic (auth, budget, category, chatbot, report, tax, transaction)
│   │   ├── middleware/       # JWT Auth middleware (authMiddleware.js)
│   │   ├── models/           # Mongoose Schemas (User, Transaction, Budget, Category, TaxEstimate, Alert, Report)
│   │   ├── routes/           # Express API endpoints (auth, budgets, categories, chatbot, reports, tax, transactions)
│   │   └── app.js            # Express app configuration & middleware routing
│   ├── server.js             # Node.js server entry point & HTTP listener
│   ├── package.json          # Backend dependencies & scripts
│   ├── .env.example          # Template for backend environment configuration
│   └── README.md             # Backend technical documentation & API guide
│
├── frontend/                 # Angular Standalone Frontend Client
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Modular UI components (Dashboard, Transactions, Budgets, Tax Estimator, Reports, Chatbot, Settings, Sidebar, Toast)
│   │   │   ├── pages/        # Router page views & layout shells
│   │   │   ├── services/     # Angular Services (Auth, Data, Transaction, Budget, Category, TaxEstimate, Report, Chatbot, Toast)
│   │   │   ├── app.routes.ts # Frontend routing definitions & Auth Guard
│   │   │   ├── auth.guard.ts # Session route protection guard
│   │   │   └── models.ts     # TypeScript interfaces & data models
│   │   ├── environments/     # Production & environment API endpoints (environment.ts)
│   │   ├── public/           # Static assets (icons, images)
│   │   └── styles.css        # TailwindCSS imports & global styles
│   ├── angular.json          # Angular CLI configuration
│   ├── vercel.json           # Vercel deployment & SPA rewrite routing config
│   ├── package.json          # Frontend dependencies & scripts
│   └── README.md             # Frontend setup & architecture guide
│
└── README.md                 # Main Project Full-Stack Documentation
```

---

## 🔌 Master REST API Endpoint Directory

All endpoints requiring authentication must pass a valid JWT token in the header:
`Authorization: Bearer <your_jwt_token>`

| Module | Method | Endpoint Path | Description | Access |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register a new user account | Public |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & receive JWT token | Public |
| **Auth** | `GET` | `/api/auth/profile` | Retrieve user profile information | Private |
| **Auth** | `PUT` | `/api/auth/profile` | Update profile information | Private |
| **Auth** | `POST` | `/api/auth/forgot-password` | Request password reset token via SMTP email | Public |
| **Auth** | `POST` | `/api/auth/reset-password` | Reset password using valid email token | Public |
| **Auth** | `PUT` | `/api/auth/change-password` | Update current account password | Private |
| **Transactions** | `GET` | `/api/transactions` | Fetch user transactions (supports query filters) | Private |
| **Transactions** | `POST` | `/api/transactions` | Add a new income or expense transaction record | Private |
| **Transactions** | `PUT` | `/api/transactions/:id` | Update an existing transaction record | Private |
| **Transactions** | `DELETE` | `/api/transactions/:id` | Delete a transaction record | Private |
| **Budgets** | `GET` | `/api/budgets` | Get category monthly budgets + MTD spent totals | Private |
| **Budgets** | `POST` | `/api/budgets` | Set or create category monthly budget limit | Private |
| **Budgets** | `PUT` | `/api/budgets/:id` | Update category budget limit amount | Private |
| **Budgets** | `DELETE` | `/api/budgets/:id` | Remove category budget limit | Private |
| **Categories** | `GET` | `/api/categories` | Retrieve custom income/expense categories | Private |
| **Categories** | `POST` | `/api/categories` | Create custom category with custom hex color | Private |
| **Categories** | `PUT` | `/api/categories/:id` | Edit custom category name or hex color | Private |
| **Categories** | `DELETE` | `/api/categories/:id` | Delete custom category | Private |
| **Tax Estimator** | `POST` | `/api/taxes/estimate` | Calculate & save advance quarterly tax estimate | Private |
| **Tax Estimator** | `GET` | `/api/taxes/estimates` | Retrieve all saved tax estimates for user | Private |
| **Tax Estimator** | `DELETE` | `/api/taxes/estimates/:id` | Delete a saved tax estimate | Private |
| **Tax Estimator** | `GET` | `/api/taxes/calendar` | Retrieve quarterly tax due dates & alerts | Private |
| **Chatbot** | `POST` | `/api/chatbot/query` | Query TaxPal Assist AI knowledge base | Public / Private |
| **Reports** | `GET` | `/api/reports` | Fetch generated financial reports history | Private |
| **Reports** | `POST` | `/api/reports/generate` | Generate a new financial report record | Private |
| **Reports** | `GET` | `/api/reports/download/:id` | Download generated report in PDF or CSV format | Private |

---

## 🛠️ Installation & Setup Guides

### Prerequisites
- **Node.js**: `v18.x` or `v20.x`
- **npm**: `v10+`
- **MongoDB**: Local instance (`mongodb://localhost:27017`) or MongoDB Atlas Cluster

---

### Local Development Quickstart

#### 1. Backend Setup
1. Navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file (refer to `.env.example`):
   ```env
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key
   MONGODB_URI=mongodb://localhost:27017/taxpal
   FRONTEND_URL=http://localhost:4200
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
   Backend listens at `http://localhost:5000`.

#### 2. Frontend Setup
1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Angular CLI development server:
   ```bash
   npm start
   ```
4. Open your browser at `http://localhost:4200`.

---

### Production Deployment Procedure

#### Deploying Backend REST API to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository and set root directory to `backend`.
3. Set Build Command: `npm install`
4. Set Start Command: `npm start`
5. Configure Environment Variables in Render Dashboard:
   - `PORT`: `10000` (or leave default, Render sets `PORT` automatically)
   - `JWT_SECRET`: `<your_production_jwt_secret>`
   - `MONGODB_URI`: `<your_mongodb_atlas_connection_string>`
   - `FRONTEND_URL`: `https://taxpal-blue.vercel.app`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`: `<your_smtp_credentials>`

#### Deploying Frontend Client to Vercel
1. Create a new project on [Vercel](https://vercel.com).
2. Connect repository and select the `frontend` directory as Root Directory.
3. Vercel automatically detects Angular configuration.
4. Verify build settings:
   - Build Command: `ng build`
   - Output Directory: `dist/taxpal-web/browser`
5. Deploy! Vercel uses `vercel.json` to configure SPA rewrites.

---

## 👥 Development & Project Credits

Developed as an Internship Project by **Batch 4**.
- Documentation maintained across root [`README.md`](file:///c:/Users/igved/Documents/infosys-project/TaxPal-Batch-4/README.md), [`backend/README.md`](file:///c:/Users/igved/Documents/infosys-project/TaxPal-Batch-4/backend/README.md), and [`frontend/README.md`](file:///c:/Users/igved/Documents/infosys-project/TaxPal-Batch-4/frontend/README.md).
