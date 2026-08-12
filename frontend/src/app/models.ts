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
  _id?: string;
  id?: string;
  userId: string;
  category: string;
  budget_amount: number;
  month: string;
  description?: string;
  spent?: number;
  remaining?: number;
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
  _id?: string;
  id?: string;
  userId?: string;
  type: 'income' | 'expense';
  name: string;
  color: string;
}

export type TaxEstimateFilingStatus =
  | 'SINGLE'
  | 'MARRIED_FILING_JOINTLY'
  | 'MARRIED_FILING_SEPARATELY'
  | 'HEAD_OF_HOUSEHOLD'
  | 'FIRM';

export interface TaxEstimate {
  _id?: string;
  userId?: string;
  country: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  estimatedTax: number;
  dueDate: string;
  state: string;
  filingStatus: TaxEstimateFilingStatus;
  grossIncomeForQuarter: number;
  businessExpenses: number;
  retirementContributions: number;
  healthInsurancePremiums: number;
  homeOfficeDeductions: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  category?: string;
  actionRoute?: string;
  actionLabel?: string;
  quickPrompts?: string[];
}

export interface QuickPrompt {
  label: string;
  query: string;
}

export interface ChatbotResponse {
  success: boolean;
  answer: string;
  category?: string;
  actionRoute?: string;
  actionLabel?: string;
  quickPrompts?: string[];
}

