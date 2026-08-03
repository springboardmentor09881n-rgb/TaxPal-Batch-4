import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Budget } from '../models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);

  readonly budgets = signal<Budget[]>([]);

  loadBudgets(): void {
    this.http.get<Budget[]>(`${environment.apiUrl}/budgets`).subscribe({
      next: (res) => {
        this.budgets.set(res || []);
      },
      error: (err) => console.error('Failed to load budgets', err)
    });
  }

  addBudget(budget: any): Observable<Budget> {
    return this.http.post<Budget>(`${environment.apiUrl}/budgets`, budget).pipe(
      tap((newBudget) => {
        const current = this.budgets();
        const spent = newBudget.spent || 0;
        const remaining = newBudget.remaining !== undefined ? newBudget.remaining : ((newBudget.budget_amount || 0) - spent);
        const formatted = { ...newBudget, spent, remaining };
        this.budgets.set([formatted, ...current]);
      })
    );
  }

  updateBudget(id: string, budget: any): Observable<Budget> {
    return this.http.put<Budget>(`${environment.apiUrl}/budgets/${id}`, budget).pipe(
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
      })
    );
  }

  deleteBudget(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/budgets/${id}`).pipe(
      tap(() => {
        this.budgets.set(this.budgets().filter((item: Budget) => item._id !== id && item.id !== id));
      })
    );
  }
}
