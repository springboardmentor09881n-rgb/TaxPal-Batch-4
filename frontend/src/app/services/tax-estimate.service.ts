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

export interface TaxReminder {
  id: string;
  message: string;
  dueDate: string;
  priority?: 'High' | 'Medium' | 'Low';
}

@Injectable({ providedIn: 'root' })
export class TaxEstimateService {
  private http = inject(HttpClient);
  private dataService = inject(DataService);
  private toastService = inject(ToastService);

  readonly estimates = this.dataService.estimates;
  readonly calendarEvents = signal<TaxCalendarEvent[]>([]);
  readonly notifications = signal<TaxReminder[]>([]);

  private daysUntil(date: Date): number {
    const today = new Date();
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const ms = d2.getTime() - d1.getTime();
    return Math.max(Math.ceil(ms / (1000 * 60 * 60 * 24)), 0);
  }

  public calendarEntries(country: string): any[] {
    const today = new Date();
    const year = today.getFullYear();
    if (country === 'India') {
      return [
        { quarter: 'Q1', label: '15% of Advance Tax', dueDate: new Date(year, 5, 15), description: 'First installment of advance tax for the financial year.' },
        { quarter: 'Q2', label: '45% of Advance Tax', dueDate: new Date(year, 8, 15), description: 'Cumulative advance tax payable by this date.' },
        { quarter: 'Q3', label: '75% of Advance Tax', dueDate: new Date(year, 11, 15), description: 'Cumulative advance tax payable by this date.' },
        { quarter: 'Q4', label: '100% of Advance Tax', dueDate: new Date(year + 1, 2, 15), description: 'Final installment covering the full year\'s advance tax.' }
      ];
    }
    return [
      { quarter: 'Q1', label: 'Jan-Mar', dueDate: new Date(year, 3, 15), description: 'Estimated tax payment for income earned Jan 1 - Mar 31.' },
      { quarter: 'Q2', label: 'Apr-Jun', dueDate: new Date(year, 5, 15), description: 'Estimated tax payment for income earned Apr 1 - May 31.' },
      { quarter: 'Q3', label: 'Jul-Sep', dueDate: new Date(year, 8, 15), description: 'Estimated tax payment for income earned Jun 1 - Aug 31.' },
      { quarter: 'Q4', label: 'Oct-Dec', dueDate: new Date(year + 1, 0, 15), description: 'Estimated tax payment for income earned Sep 1 - Dec 31.' }
    ];
  }

  public checkAndAutoNotify(): void {
    const user = this.dataService.currentUser();
    if (!user) return;

    const country = user.country || 'United States';
    const entries = this.calendarEntries(country);
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const activeNotifications: TaxReminder[] = [];
    const dismissed = JSON.parse(localStorage.getItem('tp_dismissed_notifications') || '[]');

    for (const entry of entries) {
      const entryMidnight = new Date(entry.dueDate.getFullYear(), entry.dueDate.getMonth(), entry.dueDate.getDate());
      if (entryMidnight < todayMidnight) continue;

      const days = this.daysUntil(entry.dueDate);
      if (days <= 15 && days >= 0) {
        const id = `${country}-${entry.quarter}-${entry.dueDate.getTime()}`;
        if (dismissed.includes(id)) continue;

        const locale = country === 'India' ? 'en-IN' : 'en-US';
        const priority = days <= 7 ? 'High' : 'Medium';
        activeNotifications.push({
          id,
          message: `Your ${entry.quarter} tax filing is due in ${days} day${days === 1 ? '' : 's'}.`,
          dueDate: entry.dueDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }),
          priority
        });
      }
    }
    this.notifications.set(activeNotifications);
  }

  public dismissNotification(id: string): void {
    const dismissed = JSON.parse(localStorage.getItem('tp_dismissed_notifications') || '[]');
    if (!dismissed.includes(id)) {
      dismissed.push(id);
      localStorage.setItem('tp_dismissed_notifications', JSON.stringify(dismissed));
    }
    this.notifications.update(list => list.filter(n => n.id !== id));
  }

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
