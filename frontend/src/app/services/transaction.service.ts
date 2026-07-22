import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction, Category, Budget, Report } from '../models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);

  readonly transactions = signal<Transaction[]>([]);
  readonly budgets = signal<Budget[]>([]);
  readonly reports = signal<Report[]>([]);
  readonly categories = signal<Category[]>([]);

  loadTransactions(): void {
    this.http.get<any>(`${environment.apiUrl}/transactions`).subscribe({
      next: (res) => {
        const data = res.transactions || res || [];
        this.transactions.set(data);
      },
      error: (err) => console.error('Failed to load transactions', err)
    });
  }

  addTransaction(tx: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/transactions`, tx).pipe(
      tap(newTx => {
        const current = this.transactions();
        this.transactions.set([newTx, ...current]);
      })
    );
  }

  deleteTransaction(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/transactions/${id}`).pipe(
      tap(() => {
        this.transactions.set(this.transactions().filter((item: any) => item._id !== id && item.id !== id));
      })
    );
  }
}
