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
          name: response.user.name || response.user.fullName || response.user.username,
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
    ).subscribe(data => this.transactions.set(data));
  }

  public addTransaction(tx: Omit<Transaction, 'id' | 'userId'>): void {
    const user = this.currentUser();
    if (!user) return;

    const newTx: Transaction = {
      ...tx,
      id: 'tx_' + Date.now(),
      userId: user.id
    };

    const allTx = this.getData<Transaction>('tp_transactions');
    allTx.push(newTx);
    this.saveData('tp_transactions', allTx);
    this.transactions.update(items => [newTx, ...items]);

    this.http.post<Transaction>(`${this.apiUrl}/transactions`, newTx, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  public deleteTransaction(id: string): void {
    const allTx = this.getData<Transaction>('tp_transactions');
    const filtered = allTx.filter(t => t.id !== id);
    this.saveData('tp_transactions', filtered);
    this.transactions.update(items => items.filter(t => t.id !== id));

    this.http.delete(`${this.apiUrl}/transactions/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  public addBudget(budget: Omit<Budget, 'id' | 'userId'>): void {
    const user = this.currentUser();
    if (!user) return;

    const newBudget: Budget = {
      ...budget,
      id: 'bgt_' + Date.now(),
      userId: user.id
    };

    const allBudgets = this.getData<Budget>('tp_budgets');
    allBudgets.push(newBudget);
    this.saveData('tp_budgets', allBudgets);

    this.budgets.update(items => [...items, newBudget]);
  }

  public deleteBudget(id: string): void {
    const allBudgets = this.getData<Budget>('tp_budgets');
    const filtered = allBudgets.filter(b => b.id !== id);
    this.saveData('tp_budgets', filtered);

    this.budgets.update(items => items.filter(b => b.id !== id));
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
      { category: 'Office Rent', limit: 25000.00, month: currentMonth, description: 'Mumbai hotdesk' },
      { category: 'Business Expenses', limit: 20000.00, month: currentMonth, description: 'Server and advertising allotments' },
      { category: 'Software Subscriptions', limit: 8000.00, month: currentMonth },
      { category: 'Utilities', limit: 5000.00, month: currentMonth },
      { category: 'Meals & Entertainment', limit: 10000.00, month: currentMonth }
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

  public async recommendCategory(description: string, type: 'income' | 'expense'): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ category: string | null }>(
          `${this.apiUrl}/categories/recommend`,
          {
            headers: this.getAuthHeaders(),
            params: { description, type }
          }
        )
      );
      if (response && response.category) {
        return response.category;
      }
    } catch (e) {
      // fallback on error
    }
    return this.recommendCategoryLocally(description, type);
  }

  private recommendCategoryLocally(description: string, type: 'income' | 'expense'): string | null {
    const descLower = description.toLowerCase();
    const defaults = [
      { name: 'Office Rent', type: 'expense', keywords: ['rent', 'office', 'hotdesk', 'coworking', 'lease', 'desk', 'workspace'] },
      { name: 'Business Expenses', type: 'expense', keywords: ['aws', 'server', 'hosting', 'cloud', 'azure', 'database', 'domain', 'ssl'] },
      { name: 'Utilities', type: 'expense', keywords: ['electricity', 'water', 'wifi', 'internet', 'broadband', 'phone', 'mobile'] },
      { name: 'Food', type: 'expense', keywords: ['food', 'restaurant', 'lunch', 'dinner', 'breakfast', 'meal', 'cafe', 'swiggy', 'zomato'] },
      { name: 'Software Subscriptions', type: 'expense', keywords: ['github', 'slack', 'zoom', 'figma', 'copilot', 'openai', 'adobe', 'subscriptions'] },
      { name: 'Professional Development', type: 'expense', keywords: ['course', 'book', 'udemy', 'training', 'ebook'] },
      { name: 'Marketing', type: 'expense', keywords: ['ads', 'marketing', 'facebook ads', 'google ads', 'promotion', 'sponsor'] },
      { name: 'Travel', type: 'expense', keywords: ['ola', 'uber', 'taxi', 'cab', 'flight', 'train', 'travel'] },
      { name: 'Meals & Entertainment', type: 'expense', keywords: ['client dinner', 'movie', 'client lunch', 'cafe'] },
      { name: 'Consulting', type: 'income', keywords: ['consulting', 'consult', 'advise', 'advice', 'session'] },
      { name: 'Design Project', type: 'income', keywords: ['design', 'logo', 'mockup', 'wireframe', 'frontend', 'landing page'] },
      { name: 'SaaS Subscriptions', type: 'income', keywords: ['saas', 'subscriptions', 'stripe'] },
      { name: 'Ad Revenue', type: 'income', keywords: ['ad', 'adsense', 'youtube', 'sponsorship'] }
    ];

    let bestMatch = null;
    let maxScore = 0;

    const filtered = defaults.filter(d => d.type === type);
    for (const item of filtered) {
      let score = 0;
      for (const kw of item.keywords) {
        if (descLower.includes(kw)) {
          score += kw.length;
        }
      }
      if (score > maxScore) {
        maxScore = score;
        bestMatch = item.name;
      }
    }

    return bestMatch;
  }
}
