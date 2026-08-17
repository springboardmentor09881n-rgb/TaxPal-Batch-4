import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, firstValueFrom, of } from 'rxjs';
import { User, Transaction, Budget, Category, TaxEstimate } from '../models';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  public readonly currentUser = signal<User | null>(null);
  public readonly transactions = signal<Transaction[]>([]);
  public readonly budgets = signal<Budget[]>([]);
  public readonly categories = signal<Category[]>([]);
  public readonly estimates = signal<TaxEstimate[]>([]);

  private readonly apiUrl = environment.apiUrl;
  private readonly toastService = inject(ToastService);

  constructor(private http: HttpClient) {
    this.initDatabase();
  }

  private initDatabase(): void {
    const sessionUser = sessionStorage.getItem('tp_active_user');
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser) as User;
      parsedUser.id = parsedUser.id || (parsedUser as any)._id;
      this.currentUser.set(parsedUser);
      this.loadUserData(parsedUser.id);
    }
  }

  public loadUserData(userId: string): void {
    this.loadTransactionsFromServer();
    this.loadBudgetsFromServer();
    this.loadCategoriesFromServer();
    this.loadEstimatesFromServer();
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
      // Return false on login error
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
      // Return false on signup error
    }
    return false;
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
    this.categories.set([]);
    this.estimates.set([]);
  }

  private loadTransactionsFromServer(): void {
    const user = this.currentUser();
    if (!user) return;

    this.http.get<Transaction[]>(`${this.apiUrl}/transactions`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to load transactions from server.');
        return of([]);
      })
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
      catchError((err) => {
        this.toastService.showError(err?.error?.message || 'Failed to load budgets from server.');
        return of([]);
      })
    ).subscribe(data => {
      const mapped: Budget[] = data.map(b => ({
        id: b._id || b.id,
        userId: b.userId ? String(b.userId) : (user?.id || (user as any)?._id || ''),
        category: b.category,
        budget_amount: b.budget_amount !== undefined ? Number(b.budget_amount) : (Number(b.limit) || 0),
        month: b.month,
        description: b.description,
        spent: b.spent !== undefined ? Number(b.spent) : 0,
        remaining: b.remaining !== undefined ? Number(b.remaining) : (Number(b.budget_amount) || 0)
      }));
      this.budgets.set(mapped);
    });
  }

  private loadCategoriesFromServer(): void {
    const user = this.currentUser();
    if (!user) return;

    this.http.get<Category[]>(`${this.apiUrl}/categories`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to load categories from server.');
        return of([]);
      })
    ).subscribe(data => {
      const mapped = data.map(c => ({
        ...c,
        id: c.id || (c as any)._id
      }));
      this.categories.set(mapped);
    });
  }

  private loadEstimatesFromServer(): void {
    const user = this.currentUser();
    if (!user) return;

    this.http.get<any>(`${this.apiUrl}/taxes/estimates`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to load tax estimates from server.');
        return of([]);
      })
    ).subscribe(res => {
      const list = res.estimates || res.data || res || [];
      this.estimates.set(Array.isArray(list) ? list : []);
    });
  }

  public addTransaction(tx: Omit<Transaction, 'id' | 'userId'>): void {
    const user = this.currentUser();
    if (!user) return;

    const payload = {
      ...tx,
      userId: user.id || (user as any)._id
    };

    this.http.post<any>(`${this.apiUrl}/transactions`, payload, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to add transaction to server.');
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const created: Transaction = {
          ...res,
          id: res._id || res.id || ('tx_' + Date.now())
        };
        this.transactions.update(items => [created, ...items]);
        this.toastService.showSuccess('Transaction added successfully.');
      }
    });
  }

  public deleteTransaction(id: string): void {
    this.http.delete(`${this.apiUrl}/transactions/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to delete transaction from server.');
        return of(null);
      })
    ).subscribe(res => {
      if (res !== null) {
        this.transactions.update(items => items.filter(t => t.id !== id && (t as any)._id !== id));
        this.toastService.showSuccess('Transaction deleted.');
      }
    });
  }

  public updateTransaction(id: string, changes: Omit<Transaction, 'id' | 'userId'>): void {
    this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}`, changes, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to update transaction on server.');
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const updated: Transaction = {
          ...res,
          id: res.id || (res as any)._id || id
        };
        this.transactions.update(items => items.map(t => (t.id === id || (t as any)._id === id ? updated : t)));
        this.toastService.showSuccess('Transaction updated.');
      }
    });
  }

  public addBudget(budget: Omit<Budget, 'id' | 'userId'>): void {
    const user = this.currentUser();
    const backendPayload = {
      category: budget.category,
      budget_amount: budget.budget_amount,
      month: budget.month,
      description: budget.description
    };

    this.http.post<any>(`${this.apiUrl}/budgets`, backendPayload, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to save budget to server.');
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const created: Budget = {
          id: res._id || res.id,
          userId: res.userId ? String(res.userId) : (user?.id || (user as any)?._id || ''),
          category: res.category,
          budget_amount: res.budget_amount !== undefined ? Number(res.budget_amount) : (Number(res.limit) || 0),
          month: res.month,
          description: res.description,
          spent: res.spent !== undefined ? Number(res.spent) : 0,
          remaining: res.remaining !== undefined ? Number(res.remaining) : (Number(res.budget_amount) || 0)
        };
        this.budgets.update(items => [...items, created]);
        this.toastService.showSuccess('Budget added successfully.');
      }
    });
  }

  public deleteBudget(id: string): void {
    this.http.delete(`${this.apiUrl}/budgets/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to delete budget from server.');
        return of(null);
      })
    ).subscribe(res => {
      if (res !== null) {
        this.budgets.update(items => items.filter(b => b.id !== id && b._id !== id));
        this.toastService.showSuccess('Budget deleted.');
      }
    });
  }

  public updateBudget(id: string, changes: Omit<Budget, 'id' | 'userId'>): void {
    const user = this.currentUser();
    const backendPayload = {
      category: changes.category,
      budget_amount: changes.budget_amount,
      month: changes.month,
      description: changes.description
    };

    this.http.put<any>(`${this.apiUrl}/budgets/${id}`, backendPayload, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to update budget on server.');
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const updated: Budget = {
          id: res._id || res.id || id,
          userId: res.userId ? String(res.userId) : (user?.id || (user as any)?._id || ''),
          category: res.category,
          budget_amount: res.budget_amount !== undefined ? Number(res.budget_amount) : (Number(res.limit) || 0),
          month: res.month,
          description: res.description,
          spent: res.spent !== undefined ? Number(res.spent) : 0,
          remaining: res.remaining !== undefined ? Number(res.remaining) : 0
        };
        this.budgets.update(items => items.map(b => (b.id === id || b._id === id ? updated : b)));
        this.toastService.showSuccess('Budget updated.');
      }
    });
  }

  public renameCategoryCascade(oldName: string, newName: string, type: 'income' | 'expense'): void {
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

    if (type === 'expense') {
      const budgetsToUpdate = this.budgets().filter(b => b.category === oldName);
      budgetsToUpdate.forEach(b => {
        const targetId = b.id || b._id;
        if (targetId) {
          this.updateBudget(targetId, {
            category: newName,
            budget_amount: b.budget_amount,
            month: b.month,
            description: b.description
          });
        }
      });
    }
  }

  public addCategory(cat: Omit<Category, 'id' | 'userId'>): void {
    this.http.post<any>(`${this.apiUrl}/categories`, cat, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to save category to server.');
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        const created: Category = {
          ...res,
          id: res._id || res.id
        };
        this.categories.update(items => [...items, created]);
        this.toastService.showSuccess('Category added successfully.');
      }
    });
  }

  public deleteCategory(id: string): void {
    this.http.delete(`${this.apiUrl}/categories/${id}`, { headers: this.getAuthHeaders() }).pipe(
      catchError(() => {
        this.toastService.showError('Failed to delete category from server.');
        return of(null);
      })
    ).subscribe(res => {
      if (res !== null) {
        this.categories.update(items => items.filter(c => c.id !== id && (c as any)._id !== id));
        this.toastService.showSuccess('Category deleted.');
      }
    });
  }
}
