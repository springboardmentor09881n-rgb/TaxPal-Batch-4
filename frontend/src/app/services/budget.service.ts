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
        this.budgets.set([newBudget, ...current]);
      })
    );
  }

  updateBudget(id: string, budget: any): Observable<Budget> {
    return this.http.put<Budget>(`${environment.apiUrl}/budgets/${id}`, budget).pipe(
      tap((updatedBudget) => {
        const current = this.budgets().map(b => b._id === id || b.id === id ? { ...b, ...updatedBudget } : b);
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
