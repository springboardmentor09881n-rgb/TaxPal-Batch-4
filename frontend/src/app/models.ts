export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  country: string;
  state: string;
  incomeBracket: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  description: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  month: string;
  description?: string;
}

export interface Report {
  id: string;
  userId: string;
  reportType: string;
  period: string;
  format: 'PDF' | 'CSV';
  generatedDate: string;
  name: string;
}

export interface Category {
  id: string;
  userId: string;
  type: 'income' | 'expense';
  name: string;
  color: string;
}
