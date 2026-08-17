import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Transaction } from '../models';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private readonly apiUrl = environment.apiUrl;

  readonly transactions = signal<Transaction[]>([]);

  loadTransactions(): void {
    this.http.get<Transaction[]>(`${this.apiUrl}/transactions`).pipe(
      catchError((err) => {
        this.toastService.showError('Failed to load transactions from server.');
        return of([]);
      })
    ).subscribe((data) => {
      const mapped = data.map(tx => ({
        ...tx,
        id: tx.id || (tx as any)._id
      }));
      this.transactions.set(mapped);
    });
  }

  addTransaction(tx: Omit<Transaction, 'id' | 'userId'>): Observable<Transaction | null> {
    return this.http.post<any>(`${this.apiUrl}/transactions`, tx).pipe(
      tap((res) => {
        if (res) {
          const created: Transaction = {
            ...res,
            id: res._id || res.id || ('tx_' + Date.now())
          };
          this.transactions.update(items => [created, ...items]);
        }
      }),
      catchError((err) => {
        this.toastService.showError('Failed to add transaction to server.');
        return of(null);
      })
    );
  }

  updateTransaction(id: string, updatedFields: Partial<Transaction>): Observable<Transaction | null> {
    return this.http.put<any>(`${this.apiUrl}/transactions/${id}`, updatedFields).pipe(
      tap((res) => {
        if (res) {
          const updated: Transaction = {
            ...res,
            id: res._id || res.id || id
          };
          this.transactions.update(items => items.map(t => (t.id === id || (t as any)._id === id) ? { ...t, ...updated } : t));
        }
      }),
      catchError((err) => {
        this.toastService.showError('Failed to update transaction on server.');
        return of(null);
      })
    );
  }

  deleteTransaction(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/transactions/${id}`).pipe(
      tap(() => {
        this.transactions.update(items => items.filter(t => t.id !== id && (t as any)._id !== id));
      }),
      catchError((err) => {
        this.toastService.showError('Failed to delete transaction from server.');
        return of(false);
      })
    );
  }
}
