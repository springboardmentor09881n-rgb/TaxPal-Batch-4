import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Budget } from '../models';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private readonly apiUrl = environment.apiUrl;

  readonly budgets = signal<Budget[]>([]);

  loadBudgets(): void {
    this.http.get<any[]>(`${this.apiUrl}/budgets`).pipe(
      catchError((err) => {
        this.toastService.showError(err?.error?.message || 'Failed to load budgets from server.');
        return of([]);
      })
    ).subscribe((data) => {
      if (data && Array.isArray(data)) {
        const mapped: Budget[] = data.map(b => ({
          id: b._id || b.id,
          userId: b.userId ? String(b.userId) : '',
          category: b.category,
          budget_amount: b.budget_amount !== undefined ? Number(b.budget_amount) : (Number(b.limit) || 0),
          month: b.month,
          description: b.description,
          spent: b.spent !== undefined ? Number(b.spent) : 0,
          remaining: b.remaining !== undefined ? Number(b.remaining) : (Number(b.budget_amount) || 0)
        }));
        this.budgets.set(mapped);
      }
    });
  }

  addBudget(budget: any): Observable<Budget> {
    return this.http.post<Budget>(`${this.apiUrl}/budgets`, budget).pipe(
      tap((newBudget) => {
        const current = this.budgets();
        const spent = newBudget.spent || 0;
        const remaining = newBudget.remaining !== undefined ? newBudget.remaining : ((newBudget.budget_amount || 0) - spent);
        const formatted = { ...newBudget, id: newBudget.id || (newBudget as any)._id, spent, remaining };
        this.budgets.set([formatted, ...current]);
      }),
      catchError((err) => {
        this.toastService.showError('Failed to save budget on server.');
        throw err;
      })
    );
  }

  updateBudget(id: string, budget: any): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/budgets/${id}`, budget).pipe(
      tap((updatedBudget) => {
        const current = this.budgets().map(b => {
          if (b._id === id || b.id === id) {
            const merged = { ...b, ...updatedBudget };
            const spent = merged.spent !== undefined ? merged.spent : (b.spent || 0);
            const budget_amount = merged.budget_amount !== undefined ? merged.budget_amount : (b.budget_amount || 0);
            merged.spent = spent;
            merged.remaining = budget_amount - spent;
            return merged;
          }
          return b;
        });
        this.budgets.set(current);
      }),
      catchError((err) => {
        this.toastService.showError('Failed to update budget on server.');
        throw err;
      })
    );
  }

  deleteBudget(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/budgets/${id}`).pipe(
      tap(() => {
        this.budgets.set(this.budgets().filter((item: Budget) => item._id !== id && item.id !== id));
      }),
      catchError((err) => {
        this.toastService.showError('Failed to delete budget on server.');
        throw err;
      })
    );
  }
}
