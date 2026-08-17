import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { DataService } from './data.service';
import { Transaction } from '../models';

export type ReportType = 'income_statement' | 'tax_summary' | 'budget_performance';
export type ReportPeriodKey = 'current_month' | 'last_month' | 'q1' | 'q2' | 'q3' | 'q4' | 'current_year';
export type ReportFormat = 'PDF' | 'CSV';

export interface CategoryBreakdownRow {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetComparisonRow {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
}

export interface GeneratedReport {
  id: string;
  _id?: string;
  userId: string;
  type: ReportType;
  name: string;
  period: ReportPeriodKey;
  periodLabel: string;
  format: ReportFormat;
  generatedDate: string;
  generatedAt: string;
  data: {
    totalIncome: number;
    totalExpenses: number;
    net: number;
    incomeBreakdown: CategoryBreakdownRow[];
    expenseBreakdown: CategoryBreakdownRow[];
    transactions: Transaction[];
    budgetComparison?: BudgetComparisonRow[];
    estimatedTax?: number;
    estimatedTaxNote?: string;
  };
}

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  income_statement: 'Income Statement',
  tax_summary: 'Tax Summary',
  budget_performance: 'Budget Performance'
};

type PeriodResolver = (now: Date) => { start: Date; end: Date; label: string };

function startOfDay(y: number, m: number, d: number): Date {
  return new Date(y, m, d);
}

function endOfDay(y: number, m: number, d: number): Date {
  return new Date(y, m, d, 23, 59, 59, 999);
}

const PERIOD_RESOLVERS: Record<ReportPeriodKey, PeriodResolver> = {
  current_month: (now) => ({
    start: startOfDay(now.getFullYear(), now.getMonth(), 1),
    end: endOfDay(now.getFullYear(), now.getMonth() + 1, 0),
    label: 'Current Month'
  }),
  last_month: (now) => ({
    start: startOfDay(now.getFullYear(), now.getMonth() - 1, 1),
    end: endOfDay(now.getFullYear(), now.getMonth(), 0),
    label: 'Last Month'
  }),
  q1: (now) => ({
    start: startOfDay(now.getFullYear(), 0, 1),
    end: endOfDay(now.getFullYear(), 3, 0),
    label: `Quarter 1 (${now.getFullYear()}-Q1)`
  }),
  q2: (now) => ({
    start: startOfDay(now.getFullYear(), 3, 1),
    end: endOfDay(now.getFullYear(), 6, 0),
    label: `Quarter 2 (${now.getFullYear()}-Q2)`
  }),
  q3: (now) => ({
    start: startOfDay(now.getFullYear(), 6, 1),
    end: endOfDay(now.getFullYear(), 9, 0),
    label: `Quarter 3 (${now.getFullYear()}-Q3)`
  }),
  q4: (now) => ({
    start: startOfDay(now.getFullYear(), 9, 1),
    end: endOfDay(now.getFullYear(), 12, 0),
    label: `Quarter 4 (${now.getFullYear()}-Q4)`
  }),
  current_year: (now) => ({
    start: startOfDay(now.getFullYear(), 0, 1),
    end: endOfDay(now.getFullYear(), 11, 31),
    label: `Current Year (${now.getFullYear()})`
  })
};

@Injectable({ providedIn: 'root' })
export class ReportService {
  private dataService = inject(DataService);
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/reports';

  /** Signal-backed report history, loaded directly from the database API. */
  readonly reports = signal<GeneratedReport[]>([]);

  constructor() {
    this.loadReportsFromServer();
  }

  private getAuthHeaders(): { Authorization: string } | {} {
    const token = sessionStorage.getItem('tp_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  public loadReportsFromServer(): void {
    const headers = this.getAuthHeaders();
    if (!('Authorization' in headers)) return;

    this.http.get<any[]>(this.apiUrl, { headers }).subscribe({
      next: (serverReports) => {
        if (!Array.isArray(serverReports)) return;

        const mapped: GeneratedReport[] = serverReports.map(r => this.mapServerReport(r));
        this.reports.set(mapped.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1)));
      },
      error: (err) => console.warn('Could not load reports from database API:', err)
    });
  }

  public generateReport(type: ReportType, period: ReportPeriodKey, format: ReportFormat): Observable<GeneratedReport | null> {
    const now = new Date();
    const { label } = PERIOD_RESOLVERS[period](now);
    const reportName = `${REPORT_TYPE_LABEL[type]} - ${label}`;
    const headers = this.getAuthHeaders();

    const payload = {
      reportType: REPORT_TYPE_LABEL[type],
      period: label,
      format,
      name: reportName
    };

    return this.http.post<any>(`${this.apiUrl}/generate`, payload, { headers }).pipe(
      tap((savedServerReport) => {
        if (savedServerReport) {
          const mapped = this.mapServerReport(savedServerReport);
          this.reports.update(current => [mapped, ...current.filter(r => r.id !== mapped.id)]);
        }
      }),
      catchError((err) => {
        console.error('Error generating report on server:', err);
        return of(null);
      })
    );
  }

  public downloadReport(report: GeneratedReport): void {
    const headers = this.getAuthHeaders();
    const reportId = report._id || report.id;

    this.http.get(`${this.apiUrl}/download/${encodeURIComponent(reportId)}`, {
      headers,
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const ext = report.format === 'CSV' ? 'csv' : 'pdf';
        const filename = `${this.slugify(report.name)}.${ext}`;
        this.triggerDownload(blob, filename);
      },
      error: (err) => console.error('Could not download report file from server:', err)
    });
  }

  public deleteReport(id: string): void {
    const headers = this.getAuthHeaders();

    this.http.delete(`${this.apiUrl}/${encodeURIComponent(id)}`, { headers }).subscribe({
      next: () => {
        this.reports.update(current => current.filter(r => r.id !== id && r._id !== id));
      },
      error: (err) => console.error('Could not delete report from server:', err)
    });
  }

  // ---- Helpers ---------------------------------------------------------

  private mapServerReport(r: any): GeneratedReport {
    const rawType = (r.reportType || '').toLowerCase();
    let typeKey: ReportType = 'income_statement';
    if (rawType.includes('tax')) typeKey = 'tax_summary';
    if (rawType.includes('budget')) typeKey = 'budget_performance';

    const reportId = r._id || r.id;

    return {
      id: reportId,
      _id: reportId,
      userId: r.userId,
      type: typeKey,
      name: r.name,
      period: (r.period || 'current_month') as ReportPeriodKey,
      periodLabel: r.period || 'Current Month',
      format: r.format || 'PDF',
      generatedDate: r.generatedDate ? new Date(r.generatedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString(),
      generatedAt: r.generatedDate || new Date().toISOString(),
      data: r.data || {
        totalIncome: 0,
        totalExpenses: 0,
        net: 0,
        incomeBreakdown: [],
        expenseBreakdown: [],
        transactions: []
      }
    };
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'report';
  }
}
