import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TaxEstimate } from '../models';
import { environment } from '../../environments/environment';

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

  readonly estimates = signal<TaxEstimate[]>([]);
  readonly calendarEvents = signal<TaxCalendarEvent[]>([]);

  loadEstimates(): void {
    this.http.get<any>(`${environment.apiUrl}/taxes/estimates`).subscribe({
      next: (res: any) => {
        const data = res.estimates || res.data || res || [];
        this.estimates.set(Array.isArray(data) ? data : []);
      },
      error: (err: unknown) => console.error('Failed to load tax estimates', err)
    });
  }

  saveEstimate(estimatePayload: any): Observable<TaxEstimate> {
    return this.http.post<any>(`${environment.apiUrl}/taxes/estimate`, estimatePayload).pipe(
      map((res: any) => (res.data || res.taxEstimate || res) as TaxEstimate),
      tap((saved: TaxEstimate) => {
        this.estimates.update(current => {
          const idx = current.findIndex(e => e._id === saved._id || (e.quarter === saved.quarter && e.dueDate === saved.dueDate));
          if (idx >= 0) {
            const updated = [...current];
            updated[idx] = saved;
            return updated;
          }
          return [saved, ...current];
        });
        this.loadCalendar();
      })
    );
  }

  loadCalendar(): void {
    this.http.get<any>(`${environment.apiUrl}/taxes/calendar`).subscribe({
      next: (res: any) => {
        const data = res.data || res || [];
        this.calendarEvents.set(Array.isArray(data) ? data : []);
      },
      error: (err: unknown) => console.error('Failed to load tax calendar events', err)
    });
  }

  deleteEstimate(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/taxes/estimates/${id}`).pipe(
      tap(() => {
        this.estimates.update(current => current.filter((item: TaxEstimate) => item._id !== id));
      })
    );
  }
}
