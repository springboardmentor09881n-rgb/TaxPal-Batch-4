export type Page = 'Dashboard' | 'Transactions' | 'Budgets' | 'Tax Estimate' | 'Reports';

export type Transaction = {
  id: number;
  type: 'Income' | 'Expense';
  description: string;
  category: string;
  amount: number;
  date: string;
};

export type Budget = {
  id: number;
  category: string;
  limit: number;
  month: string;
};
