import { Injectable, inject } from '@angular/core';
import { User, Transaction, Budget, Category, TaxEstimate } from '../models';
import { AuthService } from './auth.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { TaxEstimateService } from './tax-estimate.service';

/**
 * DataService - Lightweight Facade / Coordinator Service
 * Delegating state and domain operations to dedicated domain services
 * (AuthService, TransactionService, BudgetService, CategoryService, TaxEstimateService)
 * eliminating the Monolithic God Service anti-pattern.
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private authService = inject(AuthService);
  private transactionService = inject(TransactionService);
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private taxEstimateService = inject(TaxEstimateService);

  // Delegated signals - Single source of truth in domain services
  readonly currentUser = this.authService.currentUser;
  readonly transactions = this.transactionService.transactions;
  readonly budgets = this.budgetService.budgets;
  readonly categories = this.categoryService.categories;
  readonly estimates = this.taxEstimateService.estimates;

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.loadUserData();
    }
  }

  public loadUserData(userId?: string): void {
    this.transactionService.loadTransactions();
    this.budgetService.loadBudgets();
    this.categoryService.loadCategories();
    this.taxEstimateService.loadEstimates();
  }

  // --- Authentication Operations ---
  public async login(username: string, password: string): Promise<boolean> {
    const success = await this.authService.login(username, password);
    if (success) {
      this.loadUserData();
    }
    return success;
  }

  public async signup(signupData: any): Promise<boolean> {
    const success = await this.authService.signup(signupData);
    if (success) {
      this.loadUserData();
    }
    return success;
  }

  public forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.authService.forgotPassword(email);
  }

  public resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.authService.resetPassword(token, newPassword);
  }

  public changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.authService.changePassword(currentPassword, newPassword);
  }

  public logout(): void {
    this.authService.logout();
    this.transactionService.transactions.set([]);
    this.budgetService.budgets.set([]);
    this.categoryService.categories.set([]);
    this.taxEstimateService.estimates.set([]);
  }

  // --- Transaction Operations ---
  public addTransaction(tx: Omit<Transaction, 'id' | 'userId'>): void {
    this.transactionService.addTransaction(tx).subscribe();
  }

  public updateTransaction(id: string, updated: Partial<Transaction>): void {
    this.transactionService.updateTransaction(id, updated).subscribe();
  }

  public deleteTransaction(id: string): void {
    this.transactionService.deleteTransaction(id).subscribe();
  }

  // --- Budget Operations ---
  public addBudget(budget: any): void {
    this.budgetService.addBudget(budget).subscribe();
  }

  public updateBudget(id: string, budget: any): void {
    this.budgetService.updateBudget(id, budget).subscribe();
  }

  public deleteBudget(id: string): void {
    this.budgetService.deleteBudget(id).subscribe();
  }

  // --- Category Operations ---
  public addCategory(category: any): void {
    this.categoryService.addCategory(category).subscribe();
  }

  public deleteCategory(id: string): void {
    this.categoryService.deleteCategory(id).subscribe();
  }

  public renameCategoryCascade(oldName: string, newName: string, type: 'income' | 'expense'): void {
    this.categoryService.renameCategoryCascade(oldName, newName, type);
  }

  // --- Tax Estimate Operations ---
  public addTaxEstimate(estimate: any): void {
    this.taxEstimateService.saveEstimate(estimate).subscribe();
  }

  public deleteTaxEstimate(id: string): void {
    this.taxEstimateService.deleteEstimate(id).subscribe();
  }
}
