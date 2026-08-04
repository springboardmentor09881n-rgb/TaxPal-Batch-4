import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TaxEstimate, TaxAlert } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaxEstimateService {
  private http = inject(HttpClient);

  readonly estimates = signal<TaxEstimate[]>([]);
  readonly alerts = signal<TaxAlert[]>([]);

  loadEstimates(): void {
    this.http.get<any>(`${environment.apiUrl}/taxes/estimates`).subscribe({
      next: (res: any) => {
        const data = res.data || res.taxEstimates || res || [];
        this.estimates.set(Array.isArray(data) ? data : []);
      },
      error: (err: unknown) => console.error('Failed to load tax estimates', err)
    });
  }

  saveEstimate(estimate: TaxEstimate): Observable<TaxEstimate> {
    return this.http.post<any>(`${environment.apiUrl}/taxes/estimate`, estimate).pipe(
      map((res: any) => (res.data || res.taxEstimate || res) as TaxEstimate),
      tap((saved: TaxEstimate) => {
        this.estimates.update(current => [saved, ...current.filter(e => e._id !== saved._id)]);
        this.loadAlerts();
      })
    );
  }

  deleteEstimate(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/taxes/estimates/${id}`).pipe(
      tap(() => {
        this.estimates.update(current => current.filter((item: TaxEstimate) => item._id !== id));
      })
    );
  }

  loadAlerts(): void {
    this.http.get<any>(`${environment.apiUrl}/taxes/alerts`).subscribe({
      next: (res: any) => {
        const data = res.data || res.alerts || res || [];
        this.alerts.set(Array.isArray(data) ? data : []);
      },
      error: (err: unknown) => console.error('Failed to load tax alerts', err)
    });
  }

  dismissAlert(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/taxes/alerts/${id}`).pipe(
      tap(() => {
        this.alerts.update(current => current.filter((item: TaxAlert) => item._id !== id));
      })
    );
  }
}
