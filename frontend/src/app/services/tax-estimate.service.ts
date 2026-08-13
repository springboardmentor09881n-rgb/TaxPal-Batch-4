import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { TaxEstimate } from '../models';
import { environment } from '../../environments/environment';
import { DataService } from './data.service';
import { ToastService } from './toast.service';

export interface TaxCalendarEvent {
  type: 'payment' | 'reminder';
  title: string;
  description?: string;
  date: string;
  quarter?: string;
  isRead?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaxEstimateService {
  private http = inject(HttpClient);
  private dataService = inject(DataService);
  private toastService = inject(ToastService);

  readonly estimates = this.dataService.estimates;
  readonly calendarEvents = signal<TaxCalendarEvent[]>([]);

  private getAuthOptions() {
    const token = localStorage.getItem('tp_token') || sessionStorage.getItem('tp_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  loadEstimates(): void {
    this.http.get<any>(`${environment.apiUrl}/taxes/estimates`, this.getAuthOptions()).pipe(
      catchError((err: unknown) => {
        this.toastService.showError('Failed to load tax estimates from backend. Using local backup.');
        const userId = this.dataService.currentUser()?.id;
        if (userId) {
          const local = JSON.parse(localStorage.getItem('tp_estimates') || '[]');
          this.dataService.estimates.set(local.filter((e: any) => e.userId === userId));
        }
        return of({ estimates: [] });
      })
    ).subscribe({
      next: (res: any) => {
        const data = res.estimates || res.data || res || [];
        const finalData = Array.isArray(data) ? data : [];
        this.dataService.estimates.set(finalData);
        localStorage.setItem('tp_estimates', JSON.stringify(finalData));
      }
    });
  }

  saveEstimate(estimatePayload: any): Observable<TaxEstimate> {
    return this.http.post<any>(`${environment.apiUrl}/taxes/estimate`, estimatePayload, this.getAuthOptions()).pipe(
      map((res: any) => (res.data || res.taxEstimate || res) as TaxEstimate),
      tap((saved: TaxEstimate) => {
        this.dataService.estimates.update(current => {
          const idx = current.findIndex(e => e._id === saved._id || (e.quarter === saved.quarter && e.dueDate === saved.dueDate));
          if (idx >= 0) {
            const updated = [...current];
            updated[idx] = saved;
            return updated;
          }
          return [saved, ...current];
        });

        // Sync local storage
        const local = JSON.parse(localStorage.getItem('tp_estimates') || '[]');
        const idx = local.findIndex((e: any) => e._id === saved._id || (e.quarter === saved.quarter && e.dueDate === saved.dueDate));
        if (idx >= 0) {
          local[idx] = saved;
        } else {
          local.unshift(saved);
        }
        localStorage.setItem('tp_estimates', JSON.stringify(local));

        this.loadCalendar();
      }),
      catchError((err: any) => {
        this.toastService.showError('Failed to save tax estimate to server.');
        throw err;
      })
    );
  }

  loadCalendar(): void {
    this.http.get<any>(`${environment.apiUrl}/taxes/calendar`, this.getAuthOptions()).pipe(
      catchError((err: unknown) => {
        this.toastService.showError('Failed to load tax calendar events.');
        return of([]);
      })
    ).subscribe({
      next: (res: any) => {
        const data = res.data || res || [];
        this.calendarEvents.set(Array.isArray(data) ? data : []);
      }
    });
  }

  deleteEstimate(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/taxes/estimates/${id}`, this.getAuthOptions()).pipe(
      tap(() => {
        this.dataService.estimates.update(current => current.filter((item: TaxEstimate) => item._id !== id));

        // Sync local storage
        const local = JSON.parse(localStorage.getItem('tp_estimates') || '[]');
        localStorage.setItem('tp_estimates', JSON.stringify(local.filter((item: any) => item._id !== id)));
      }),
      catchError((err: any) => {
        this.toastService.showError('Failed to delete tax estimate on server.');
        throw err;
      })
    );
  }
}
