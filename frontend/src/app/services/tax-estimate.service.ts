import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TaxEstimate } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaxEstimateService {
  private http = inject(HttpClient);

  readonly estimates = signal<TaxEstimate[]>([]);

  loadEstimates(): void {
    this.http.get<any>(`${environment.apiUrl}/tax-estimates`).subscribe({
      next: (res: any) => {
        const data = res.taxEstimates || res.data || res || [];
        this.estimates.set(Array.isArray(data) ? data : []);
      },
      error: (err: unknown) => console.error('Failed to load tax estimates', err)
    });
  }

  saveEstimate(estimate: TaxEstimate): Observable<TaxEstimate> {
    return this.http.post<any>(`${environment.apiUrl}/tax-estimates`, estimate).pipe(
      map((res: any) => (res.taxEstimate || res.data || res) as TaxEstimate),
      tap((saved: TaxEstimate) => {
        this.estimates.update(current => [saved, ...current]);
      })
    );
  }

  deleteEstimate(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/tax-estimates/${id}`).pipe(
      tap(() => {
        this.estimates.update(current => current.filter((item: TaxEstimate) => item._id !== id));
      })
    );
  }
}
