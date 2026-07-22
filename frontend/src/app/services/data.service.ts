import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';
import { User, Transaction, Budget, Report, Category } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public readonly currentUser = signal<User | null>(null);
  public readonly transactions = signal<Transaction[]>([]);
  public readonly budgets = signal<Budget[]>([]);
  public readonly reports = signal<Report[]>([]);
  public readonly categories = signal<Category[]>([]);

  private readonly apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {
    this.initDatabase();
  }

  private initDatabase(): void {
    const usersStr = localStorage.getItem('tp_users');
    let users = usersStr ? JSON.parse(usersStr) : [];

    if (users.length === 0) {
      users.push({
        id: 'user_demo',
        username: 'demo',
        password: 'password',
        name: 'Alex Morgan',
        email: 'alex@example.com',
        country: 'India',
        state: 'Maharashtra',
        incomeBracket: 'Medium'
      });
      localStorage.setItem('tp_users', JSON.stringify(users));

      this.seedDefaultCategories('user_demo');
      this.seedDefaultTransactions('user_demo');
      this.seedDefaultBudgets('user_demo');
    }

    const sessionUser = sessionStorage.getItem('tp_active_user');
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser) as User;
      parsedUser.id = parsedUser.id || (parsedUser as any)._id;
      this.currentUser.set(parsedUser);
      this.loadUserData(parsedUser.id);
    }
  }

  public loadUserData(userId: string): void {
    const allTx = this.getData<Transaction>('tp_transactions');
    this.transactions.set(allTx.filter(t => t.userId === userId));

    const allBudgets = this.getData<Budget>('tp_budgets');
    this.budgets.set(allBudgets.filter(b => b.userId === userId));

    const allReports = this.getData<Report>('tp_reports');
    this.reports.set(allReports.filter(r => r.userId === userId));

    const allCategories = this.getData<Category>('tp_categories');
    this.categories.set(allCategories.filter(c => c.userId === userId));

    this.loadTransactionsFromServer();
    this.loadBudgetsFromServer();
  }

  private getData<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private saveData<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('tp_token');
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  public async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ token: string; user: any }>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
          catchError(() => of(null))
        )
      );

      if (response?.token && response.user) {
        // Normalize: backend returns fullName, frontend expects name
        const normalizedUser = {
          ...response.user,
          id: response.user.id || response.user._id,
          name: response.user.name || response.user.fullName || response.user.username,
          token: response.token,
        };
        sessionStorage.setItem('tp_token', response.token);
        sessionStorage.setItem('tp_active_user', JSON.stringify(normalizedUser));
        this.currentUser.set(normalizedUser);
        this.loadUserData(normalizedUser.id || normalizedUser._id);
        return true;
      }
    } catch {
      // fallback below
    }

    const users = this.getData<any>('tp_users');
    const user = users.find((u: any) => u.username === username.trim() && u.password === password.trim());
    if (user) {
      const { password: _, ...userSession } = user;
      // Ensure name is always set
      const normalizedSession = {
        ...userSession,
        name: userSession.name || userSession.fullName || userSession.username,
      };
      sessionStorage.setItem('tp_active_user', JSON.stringify(normalizedSession));
      this.currentUser.set(normalizedSession);
      this.loadUserData(normalizedSession.id);
      return true;
    }
    return false;
  }

  public async signup(signupData: any): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/register`, {
          username: signupData.username,
          password: signupData.password,
          fullName: signupData.name,
          email: signupData.email,
          country: signupData.country || 'India',
          incomeBracket: signupData.incomeBracket || 'Medium'
        }).pipe(catchError(() => of(null)))
      );

      if (response) {
        return this.login(signupData.username, signupData.password);
      }
    } catch {
      // fallback below
    }

    const users = this.getData<any>('tp_users');
    if (users.some((u: any) => u.username === signupData.username)) {
      return false;
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username: signupData.username,
      password: signupData.password,
      name: signupData.name,
      email: signupData.email,
      country: signupData.country || 'India',
      incomeBracket: signupData.incomeBracket || 'Medium'
    };

    users.push(newUser);
    this.saveData('tp_users', users);
    this.seedDefaultCategories(newUser.id);
    this.seedDefaultBudgets(newUser.id);
    this.seedDefaultTransactions(newUser.id);

    return this.login(newUser.username, newUser.password);
  }

  public async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
          catchError((err) => of({ message: err?.error?.message || 'Error sending reset email.' }))
        )
      );
      return { success: true, message: response?.message || 'Reset email sent.' };
    } catch {
      return { success: false, message: 'Unable to connect. Please try again.' };
    }
  }

  public async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { token, newPassword }).pipe(
          catchError((err) => of({ message: err?.error?.message || 'Reset failed.', __error: true } as any))
        )
      );
      if ((response as any).__error) {
        return { success: false, message: response.message };
      }
      return { success: true, message: response.message };
    } catch {
      return { success: false, message: 'Unable to connect. Please try again.' };
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ message: string }>(
          `${this.apiUrl}/auth/change-password`,
          { currentPassword, newPassword },
          { headers: this.getAuthHeaders() }
        ).pipe(
          catchError((err) => of({ message: err?.error?.message || 'Password update failed.', __error: true } as any))
        )
      );
      if ((response as any).__error) {
        return { success: false, message: response.message };
      }
      return { success: true, message: response.message };
    } catch {
      return { success: false, message: 'Unable to connect. Please try again.' };
    }
  }

  public logout(): void {
    sessionStorage.removeItem('tp_token');
    sessionStorage.removeItem('tp_active_user');
    this.currentUser.set(null);
    this.transactions.set([]);
    this.budgets.set([]);
    this.reports.set([]);
    this.categories.set([]);
  }

  private loadTransactionsFromServer(): void {
    const user = this.currentUser();
    if (!user) return;

    this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(this.getData<Transaction>('tp_transactions').filter(tx => tx.userId === user.id)))
    ).subscribe(data => {
      const mapped = data.map(tx => ({
        ...tx,
        id: tx.id || (tx as any)._id
      }));
      this.transactions.set(mapped);
    });
  }

  private loadBudgetsFromServer(): void {
    const user = this.currentUser();
    if (!user) return;

    this.http.get<any[]>(`${this.apiUrl}/budgets`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        const userId = user.id || (user as any)._id;
        return of(this.getData<Budget>('tp_budgets').filter(b => b.userId === userId));
      })
    ).subscribe(data => {
      const mapped: Budget[] = data.map(b => ({
        id: b._id || b.id,
        userId: b.userId,
        category: b.category,
        limit: b.budget_amount !== undefined ? b.budget_amount : (b.limit || 0),
        month: b.month,
        description: b.description
      }));
      this.budgets.set(mapped);
    });
  }

  public addTransaction(tx: Omit<Transaction, 'id' | 'userId'>): void {
    const user = this.currentUser();
    if (!user) return;

    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now(),
      userId: user.id || (user as any)._id
    };

    const allTx = this.getData<Transaction>('tp_transactions');
    allTx.push(newTx);
    this.saveData('tp_transactions', allTx);
    this.transactions.update(items => [newTx, ...items]);

    this.http.post<any>(`${this.apiUrl}/transactions`, newTx, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      if (res) {
        const serverId = res._id || res.id;
        // Update local signal state ID
        this.transactions.update(items =>
          items.map(t => t.id === newTx.id ? { ...t, id: serverId } : t)
        );
        // Update localStorage ID
        const currentAll = this.getData<Transaction>('tp_transactions');
        const idx = currentAll.findIndex(t => t.id === newTx.id);
        if (idx !== -1) {
          currentAll[idx].id = serverId;
          this.saveData('tp_transactions', currentAll);
        }
      }
    });
  }

  public deleteTransaction(id: string): void {
    const allTx = this.getData<Transaction>('tp_transactions');
    const filtered = allTx.filter(t => t.id !== id && (t as any)._id !== id);
    this.saveData('tp_transactions', filtered);
    this.transactions.update(items => items.filter(t => t.id !== id && (t as any)._id !== id));

    this.http.delete(`${this.apiUrl}/transactions/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  public updateTransaction(id: string, changes: Omit<Transaction, 'id' | 'userId'>): void {
    const allTx = this.getData<Transaction>('tp_transactions');
    const index = allTx.findIndex(t => t.id === id);
    if (index === -1) return;

    const updatedTx: Transaction = { ...allTx[index], ...changes };
    allTx[index] = updatedTx;
    this.saveData('tp_transactions', allTx);
    this.transactions.update(items => items.map(t => (t.id === id ? updatedTx : t)));

    this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}`, updatedTx, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  public addBudget(budget: Omit<Budget, 'id' | 'userId'>): void {
    const user = this.currentUser();
    if (!user) return;

    const newBudget: Budget = {
      ...budget,
      id: 'bgt_' + Date.now(),
      userId: user.id || (user as any)._id
    };

    const allBudgets = this.getData<Budget>('tp_budgets');
    allBudgets.push(newBudget);
    this.saveData('tp_budgets', allBudgets);

    this.budgets.update(items => [...items, newBudget]);

    const backendPayload = {
      category: budget.category,
      budget_amount: budget.limit,
      month: budget.month,
      description: budget.description
    };

    this.http.post<any>(`${this.apiUrl}/budgets`, backendPayload, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(null))
    ).subscribe(res => {
      if (res) {
        const serverId = res._id || res.id;
        this.budgets.update(items =>
          items.map(b => b.id === newBudget.id ? { ...b, id: serverId } : b)
        );
        const currentAll = this.getData<Budget>('tp_budgets');
        const idx = currentAll.findIndex(b => b.id === newBudget.id);
        if (idx !== -1) {
          currentAll[idx].id = serverId;
          this.saveData('tp_budgets', currentAll);
        }
      }
    });
  }

  public deleteBudget(id: string): void {
    const allBudgets = this.getData<Budget>('tp_budgets');
    const filtered = allBudgets.filter(b => b.id !== id);
    this.saveData('tp_budgets', filtered);

    this.budgets.update(items => items.filter(b => b.id !== id));

    this.http.delete(`${this.apiUrl}/budgets/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  public updateBudget(id: string, changes: Omit<Budget, 'id' | 'userId'>): void {
    const allBudgets = this.getData<Budget>('tp_budgets');
    const index = allBudgets.findIndex(b => b.id === id);
    if (index === -1) return;

    const updatedBudget: Budget = { ...allBudgets[index], ...changes };
    allBudgets[index] = updatedBudget;
    this.saveData('tp_budgets', allBudgets);
    this.budgets.update(items => items.map(b => (b.id === id ? updatedBudget : b)));

    const backendPayload = {
      category: changes.category,
      budget_amount: changes.limit,
      month: changes.month,
      description: changes.description
    };

    this.http.put<any>(`${this.apiUrl}/budgets/${id}`, backendPayload, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  public renameCategoryCascade(oldName: string, newName: string, type: 'income' | 'expense'): void {
    // 1. Cascade rename in transactions
    const txsToUpdate = this.transactions().filter(t => t.category === oldName && t.type === type);
    txsToUpdate.forEach(t => {
      this.updateTransaction(t.id, {
        type: t.type,
        description: t.description,
        category: newName,
        amount: t.amount,
        date: t.date,
        notes: t.notes
      });
    });

    // 2. Cascade rename in budgets (expenses only)
    if (type === 'expense') {
      const budgetsToUpdate = this.budgets().filter(b => b.category === oldName);
      budgetsToUpdate.forEach(b => {
        this.updateBudget(b.id, {
          category: newName,
          limit: b.limit,
          month: b.month,
          description: b.description
        });
      });
    }
  }

  public addCategory(cat: Omit<Category, 'id' | 'userId'>): void {
    const user = this.currentUser();
    if (!user) return;

    const newCat: Category = {
      ...cat,
      id: 'cat_' + Date.now(),
      userId: user.id
    };

    const allCats = this.getData<Category>('tp_categories');
    allCats.push(newCat);
    this.saveData('tp_categories', allCats);

    this.categories.update(items => [...items, newCat]);
  }

  public deleteCategory(id: string): void {
    const allCats = this.getData<Category>('tp_categories');
    const filtered = allCats.filter(c => c.id !== id);
    this.saveData('tp_categories', filtered);

    this.categories.update(items => items.filter(c => c.id !== id));
  }

  public generateReport(reportType: string, period: string, format: 'PDF' | 'CSV'): void {
    const user = this.currentUser();
    if (!user) return;

    const formattedDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const newReport: Report = {
      id: 'rep_' + Date.now(),
      userId: user.id,
      reportType,
      period,
      format,
      generatedDate: formattedDate,
      name: `${reportType.replace(' ', '_')}_${period.replace(' ', '_')}_${Date.now().toString().slice(-4)}`
    };

    const allReports = this.getData<Report>('tp_reports');
    allReports.push(newReport);
    this.saveData('tp_reports', allReports);

    this.reports.update(items => [newReport, ...items]);
  }

  private seedDefaultCategories(userId: string): void {
    const defaults: Omit<Category, 'id' | 'userId'>[] = [
      { type: 'expense', name: 'Office Rent', color: '#3b82f6' },
      { type: 'expense', name: 'Business Expenses', color: '#10b981' },
      { type: 'expense', name: 'Utilities', color: '#f59e0b' },
      { type: 'expense', name: 'Food', color: '#ef4444' },
      { type: 'expense', name: 'Software Subscriptions', color: '#8b5cf6' },
      { type: 'expense', name: 'Professional Development', color: '#ec4899' },
      { type: 'expense', name: 'Marketing', color: '#06b6d4' },
      { type: 'expense', name: 'Travel', color: '#f97316' },
      { type: 'expense', name: 'Meals & Entertainment', color: '#6366f1' },
      { type: 'expense', name: 'Other', color: '#64748b' },
      { type: 'income', name: 'Consulting', color: '#10b981' },
      { type: 'income', name: 'Design Project', color: '#3b82f6' },
      { type: 'income', name: 'SaaS Subscriptions', color: '#8b5cf6' },
      { type: 'income', name: 'Ad Revenue', color: '#f59e0b' },
      { type: 'income', name: 'Other', color: '#64748b' }
    ];

    const allCats = this.getData<Category>('tp_categories');
    defaults.forEach(c => {
      allCats.push({
        ...c,
        id: 'cat_' + Math.random().toString(36).substring(2, 9),
        userId
      });
    });
    this.saveData('tp_categories', allCats);
  }

  private seedDefaultTransactions(userId: string): void {
    const today = new Date();
    const formatDateStr = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    const defaults: Omit<Transaction, 'id' | 'userId'>[] = [
      { type: 'income', description: 'Web Design Project - Payout', category: 'Design Project', amount: 120000.00, date: formatDateStr(3), notes: 'Milestone 2 payout from foreign client' },
      { type: 'income', description: 'Consulting Session - Architecture Review', category: 'Consulting', amount: 45000.00, date: formatDateStr(7), notes: 'Reviewed Bangalore startup backend scaling' },
      { type: 'income', description: 'Ad Revenue Payout', category: 'Ad Revenue', amount: 28000.00, date: formatDateStr(14) },
      { type: 'expense', description: 'Office Hotdesk Rental - Mumbai', category: 'Office Rent', amount: 22000.00, date: formatDateStr(1) },
      { type: 'expense', description: 'AWS Hosting - Asia Pacific (Mumbai) Node', category: 'Business Expenses', amount: 14500.00, date: formatDateStr(2), notes: 'Server nodes hosting' },
      { type: 'expense', description: 'Internet & Lease Line Utilities', category: 'Utilities', amount: 3500.00, date: formatDateStr(5) },
      { type: 'expense', description: 'Client Lunch - Colaba Cafe', category: 'Meals & Entertainment', amount: 6200.00, date: formatDateStr(6) },
      { type: 'expense', description: 'GitHub & Slack Pro Subscriptions', category: 'Software Subscriptions', amount: 4200.00, date: formatDateStr(8) },
      { type: 'expense', description: 'Travel Expense - Ola Outstation Trip', category: 'Travel', amount: 3800.00, date: formatDateStr(10) }
    ];

    const allTx = this.getData<Transaction>('tp_transactions');
    defaults.forEach((t, i) => {
      allTx.push({
        ...t,
        id: 'tx_' + i + '_' + Math.random().toString(36).substring(2, 5),
        userId
      });
    });
    this.saveData('tp_transactions', allTx);
  }

  private seedDefaultBudgets(userId: string): void {
    const currentMonth = new Date().toISOString().slice(0, 7);

    const defaults: Omit<Budget, 'id' | 'userId'>[] = [
      { category: 'Office Rent', budget_amount: 25000.00, month: currentMonth, description: 'Mumbai hotdesk' },
      { category: 'Business Expenses', budget_amount: 20000.00, month: currentMonth, description: 'Server and advertising allotments' },
      { category: 'Software Subscriptions', budget_amount: 8000.00, month: currentMonth },
      { category: 'Utilities', budget_amount: 5000.00, month: currentMonth },
      { category: 'Meals & Entertainment', budget_amount: 10000.00, month: currentMonth }
    ];

    const allBudgets = this.getData<Budget>('tp_budgets');
    defaults.forEach(b => {
      allBudgets.push({
        ...b,
        id: 'bgt_' + Math.random().toString(36).substring(2, 9),
        userId
      });
    });
    this.saveData('tp_budgets', allBudgets);
  }
}
