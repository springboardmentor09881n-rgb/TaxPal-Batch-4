# TaxPal-Batch-4

## Features
- User authentication (sign in / sign up)
- Dashboard, Transactions, Budgets, Tax Estimate, and Reports pages
- Multiple accounts support (switch accounts from the profile menu)

## Navigation
The sidebar order is:
1. Reports
2. Dashboard
3. Transactions
4. Budgets
5. Tax Estimate

## Tech Stack
- React + TypeScript
- Local storage persistence (see `frontend/src/services/storage.ts`)

## Run Locally
1. Install dependencies:
   - `cd frontend`
   - `npm install`
2. Start the dev server:
   - `npm run dev` (or `npm start` depending on package.json)

## Notes
- Data is persisted in the browser via localStorage.

