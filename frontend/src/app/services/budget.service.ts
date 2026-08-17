import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Budget } from '../models';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DataService } from './data.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private http = inject(HttpClient);
  private dataService = inject(DataService);
  private toastService = inject(ToastService);

  readonly budgets = this.dataService.budgets;

  private getAuthOptions() {
    const token = sessionStorage.getItem('tp_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  loadBudgets(): void {
    this.http.get<Budget[]>(`${environment.apiUrl}/budgets`, this.getAuthOptions()).pipe(
      catchError((err) => {
        this.toastService.showError('Failed to load budgets from server.');
        return of([]);
      })
    ).subscribe((res) => {
      if (res && Array.isArray(res)) {
        this.dataService.budgets.set(res);
      }
    });
  }

  addBudget(budget: any): Observable<Budget> {
    return this.http.post<Budget>(`${environment.apiUrl}/budgets`, budget, this.getAuthOptions()).pipe(
      tap((newBudget) => {
        const current = this.dataService.budgets();
        const spent = newBudget.spent || 0;
        const remaining = newBudget.remaining !== undefined ? newBudget.remaining : ((newBudget.budget_amount || 0) - spent);
        const formatted = { ...newBudget, spent, remaining };
        this.dataService.budgets.set([formatted, ...current]);
      }),
      catchError((err) => {
        this.toastService.showError('Failed to save budget on server.');
        throw err;
      })
    );
  }

  updateBudget(id: string, budget: any): Observable<Budget> {
    return this.http.put<Budget>(`${environment.apiUrl}/budgets/${id}`, budget, this.getAuthOptions()).pipe(
      tap((updatedBudget) => {
        const current = this.dataService.budgets().map(b => {
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
        this.dataService.budgets.set(current);
      }),
      catchError((err) => {
        this.toastService.showError('Failed to update budget on server.');
        throw err;
      })
    );
  }

  deleteBudget(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/budgets/${id}`, this.getAuthOptions()).pipe(
      tap(() => {
        this.dataService.budgets.set(this.dataService.budgets().filter((item: Budget) => item._id !== id && item.id !== id));
      }),
      catchError((err) => {
        this.toastService.showError('Failed to delete budget on server.');
        throw err;
      })
    );
  }
}
