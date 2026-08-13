import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, GeneratedReport, ReportType, ReportPeriodKey, ReportFormat } from '../../services/report.service';
import { DataService } from '../../services/data.service';

const CURRENCY_BY_COUNTRY: Record<string, string> = {
  'India': '₹',
  'United States': '$',
  'United Kingdom': '£',
  'European Union': '€',
  'Japan': '¥',
  'Canada': 'CA$',
  'Australia': 'A$',
  'Singapore': 'S$',
  'United Arab Emirates': 'AED',
};
  
const NON_QUARTER_PERIODS: ReportPeriodKey[] = ['current_month', 'last_month', 'current_year'];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-stacked-container">
      <!-- Page Header -->
      <div class="reports-page-header">
        <h1>Financial Reports</h1>
        <p>Generate and download your financial reports.</p>
      </div>

      <!-- 1. Generate Report Card (Horizontal Form) -->
      <div class="card form-card-horizontal">
        <div class="card-header-simple">
          <h2>Generate Report</h2>
        </div>

        <form (ngSubmit)="onSubmit()" class="horizontal-form">
          <div class="form-inputs-row">
            <div class="form-group select-group">
              <label for="reportType">Report Type</label>
              <select id="reportType" [ngModel]="reportType()" (ngModelChange)="onReportTypeChange($event)" name="reportType">
                <option value="income_statement">Income Statement</option>
                <option value="tax_summary">Tax Summary</option>
                <option value="budget_performance">Budget Performance</option>
              </select>
            </div>

            <div class="form-group select-group">
              <label for="period">Period</label>
              <select id="period" [ngModel]="period()" (ngModelChange)="period.set($event)" name="period">
                @if (isPeriodVisible('current_month')) {
                  <option value="current_month">Current Month</option>
                }
                @if (isPeriodVisible('last_month')) {
                  <option value="last_month">Last Month</option>
                }
                <option value="q1">Quarter 1 ({{ currentYear }}-Q1)</option>
                <option value="q2">Quarter 2 ({{ currentYear }}-Q2)</option>
                <option value="q3">Quarter 3 ({{ currentYear }}-Q3)</option>
                <option value="q4">Quarter 4 ({{ currentYear }}-Q4)</option>
                @if (isPeriodVisible('current_year')) {
                  <option value="current_year">Current Year ({{ currentYear }})</option>
                }
              </select>
            </div>

            <div class="form-group select-group">
              <label for="format">Format</label>
              <select id="format" [ngModel]="format()" (ngModelChange)="format.set($event)" name="format">
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
              </select>
            </div>
          </div>

          <div class="form-actions-row-simple">
            <button type="button" (click)="onReset()" class="btn-reset-simple">Reset</button>
            <button type="submit" class="btn-generate-simple">Generate Report</button>
          </div>
        </form>
      </div>

      <!-- 2. Recent Reports Card -->
      <div class="card table-card-full">
        <div class="card-header-simple">
          <h2>Recent Reports</h2>
        </div>

        <div class="table-responsive">
          <table class="recent-reports-table-simple">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Generated</th>
                <th>Period</th>
                <th>Format</th>
                <th style="width: 120px; text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (report of reportService.reports(); track report.id) {
                <tr
                  [class.active-row-simple]="selectedReport()?.id === report.id"
                  class="clickable-row-simple"
                  (click)="onPreview(report)">
                  <td>
                    <div class="report-title-cell">
                      <svg class="report-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        @switch (report.type) {
                          @case ('income_statement') {
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                          }
                          @case ('tax_summary') {
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 14l2 2 4-4m5 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          }
                          @default {
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c.14 1.05.986 1.874 2.04 1.99a48.98 48.98 0 0 0 15.42 0c1.054-.116 1.9-.94 2.04-1.99a48.7 48.7 0 0 0 .365-6.06c-1.03 1.06-2.457 1.72-4.036 1.72-1.579 0-3.006-.66-4.035-1.72-1.03 1.06-2.457 1.72-4.036 1.72s-3.006-.66-4.035-1.72a48.7 48.7 0 0 0 .365 6.06Z" />
                          }
                        }
                      </svg>
                      <span>{{ report.name }}</span>
                    </div>
                  </td>
                  <td><span class="timestamp-text-simple">{{ report.generatedDate }}</span></td>
                  <td><span class="period-text-simple">{{ report.periodLabel }}</span></td>
                  <td>
                    <span class="format-badge-simple" [class.badge-pdf]="report.format === 'PDF'" [class.badge-csv]="report.format === 'CSV'">{{ report.format }}</span>
                  </td>
                  <td>
                    <div class="actions-wrapper-simple">
                      <button type="button" class="btn-action-simple" (click)="onPreview(report); $event.stopPropagation();" title="Preview">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                      <button type="button" class="btn-action-simple" (click)="onDownload(report); $event.stopPropagation();" title="Download">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                      <button type="button" class="btn-action-simple btn-delete" (click)="onDelete(report, $event)" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9M19.228 5.79c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty-table-row">No results</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. Preview Card -->
      @if (selectedReport(); as r) {
        <div class="card preview-card">
          <div class="card-header-simple preview-header">
            <h2>{{ r.name }}</h2>
            <span class="period-text-simple">{{ r.periodLabel }}</span>
          </div>

          <div class="preview-summary-grid">
            <div class="preview-stat">
              <span class="preview-stat-label">Total Income</span>
              <span class="preview-stat-value positive">{{ currencySymbol() }}{{ r.data.totalIncome | number:'1.2-2' }}</span>
            </div>
            <div class="preview-stat">
              <span class="preview-stat-label">Total Expenses</span>
              <span class="preview-stat-value negative">{{ currencySymbol() }}{{ r.data.totalExpenses | number:'1.2-2' }}</span>
            </div>
            <div class="preview-stat">
              <span class="preview-stat-label">Net</span>
              <span class="preview-stat-value" [class.positive]="r.data.net >= 0" [class.negative]="r.data.net < 0">
                {{ currencySymbol() }}{{ r.data.net | number:'1.2-2' }}
              </span>
            </div>
            @if (r.data.estimatedTax !== undefined) {
              <div class="preview-stat">
                <span class="preview-stat-label">Estimated Tax</span>
                <span class="preview-stat-value">{{ currencySymbol() }}{{ r.data.estimatedTax | number:'1.2-2' }}</span>
              </div>
            }
          </div>
          @if (r.data.estimatedTaxNote) {
            <p class="preview-note">{{ r.data.estimatedTaxNote }}</p>
          }

          @if (r.data.incomeBreakdown.length || r.data.expenseBreakdown.length) {
            <div class="preview-breakdown-grid">
              <div>
                <h3>Income by Category</h3>
                @for (row of r.data.incomeBreakdown; track row.category) {
                  <div class="preview-breakdown-row">
                    <span>{{ row.category }}</span>
                    <span>{{ currencySymbol() }}{{ row.amount | number:'1.2-2' }} ({{ row.percentage | number:'1.0-1' }}%)</span>
                  </div>
                }
                @if (!r.data.incomeBreakdown.length) {
                  <p class="empty-note">No income recorded.</p>
                }
              </div>
              <div>
                <h3>Expenses by Category</h3>
                @for (row of r.data.expenseBreakdown; track row.category) {
                  <div class="preview-breakdown-row">
                    <span>{{ row.category }}</span>
                    <span>{{ currencySymbol() }}{{ row.amount | number:'1.2-2' }} ({{ row.percentage | number:'1.0-1' }}%)</span>
                  </div>
                }
                @if (!r.data.expenseBreakdown.length) {
                  <p class="empty-note">No expenses recorded.</p>
                }
              </div>
            </div>
          }

          @if (r.data.budgetComparison && r.data.budgetComparison.length) {
            <div class="preview-breakdown-grid">
              <div style="grid-column: 1 / -1;">
                <h3>Budget vs Actual</h3>
                @for (row of r.data.budgetComparison; track row.category) {
                  <div class="preview-breakdown-row">
                    <span>{{ row.category }}</span>
                    <span>Budgeted {{ currencySymbol() }}{{ row.budgeted | number:'1.2-2' }} &middot; Spent {{ currencySymbol() }}{{ row.spent | number:'1.2-2' }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <div class="preview-footer">
            <span class="period-text-simple">{{ r.data.transactions.length }} transaction(s) in this period</span>
            <button type="button" class="btn-generate-simple" (click)="onDownload(r)">Download {{ r.format }}</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Reports Stacked Layout Container */
    .reports-stacked-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .reports-page-header {
      margin-bottom: 0.5rem;
    }

    .reports-page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-dark, #1e293b);
      margin-bottom: 0.25rem;
    }

    .reports-page-header p {
      font-size: 0.95rem;
      color: var(--text-muted, #64748b);
    }

    .card {
      background-color: var(--bg-card, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      padding: 1.5rem;
      transition: box-shadow 0.2s ease;
    }

    .card:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .card-header-simple {
      margin-bottom: 1.25rem;
    }

    .card-header-simple h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-dark, #1e293b);
    }

    .horizontal-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-inputs-row {
      display: flex;
      gap: 1.5rem;
    }

    @media (max-width: 768px) {
      .form-inputs-row {
        flex-direction: column;
        gap: 1rem;
      }
    }

    .select-group {
      flex: 1;
    }

    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--text-dark, #1e293b);
    }

    .form-group select {
      width: 100%;
      padding: 0.65rem 0.85rem;
      font-size: 0.9rem;
      border: 1px solid var(--border-color, #cbd5e1);
      border-radius: 6px;
      background-color: var(--input-bg, #ffffff);
      color: var(--text-dark, #1e293b);
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }

    .form-group select:focus {
      border-color: var(--primary-color, #1a73e8);
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }

    .form-actions-row-simple {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 1.5rem;
      margin-top: 0.5rem;
    }

    .btn-reset-simple {
      background: none;
      border: none;
      color: var(--text-muted, #64748b);
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0.5rem 1rem;
      transition: color 0.2s;
    }

    .btn-reset-simple:hover {
      color: var(--text-dark, #1e293b);
    }

    .btn-generate-simple {
      background-color: #1a73e8;
      color: #ffffff;
      border: none;
      padding: 0.65rem 1.25rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-generate-simple:hover {
      background-color: #1557b0;
    }

    .table-card-full {
      padding: 1.5rem;
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }

    .recent-reports-table-simple {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }

    .recent-reports-table-simple th {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted, #64748b);
      padding: 0.75rem 1rem;
      border-bottom: 1.5px solid var(--border-color, #e2e8f0);
    }

    .recent-reports-table-simple td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      color: var(--text-dark, #1e293b);
    }

    .clickable-row-simple {
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .clickable-row-simple:hover {
      background-color: rgba(26, 115, 232, 0.03);
    }

    .active-row-simple {
      background-color: rgba(26, 115, 232, 0.06) !important;
    }

    .report-title-cell {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 500;
    }

    .report-icon {
      color: var(--text-muted, #64748b);
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    .timestamp-text-simple, .period-text-simple {
      color: var(--text-muted, #64748b);
    }

    .format-badge-simple {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .badge-pdf {
      background-color: #fee2e2;
      color: #b91c1c;
    }

    [data-theme='dark'] .badge-pdf {
      background-color: #7f1d1d;
      color: #fca5a5;
    }

    .badge-csv {
      background-color: #dcfce7;
      color: #15803d;
    }

    [data-theme='dark'] .badge-csv {
      background-color: #064e3b;
      color: #86efac;
    }

    .actions-wrapper-simple {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-action-simple {
      background: transparent;
      border: 1px solid var(--border-color, #cbd5e1);
      color: var(--text-muted, #64748b);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-action-simple:hover {
      color: var(--text-dark, #1e293b);
      background-color: var(--border-color, #e2e8f0);
    }

    .btn-action-simple.btn-delete:hover {
      color: var(--error-color, #ef4444);
      background-color: #fee2e2;
      border-color: #fca5a5;
    }

    [data-theme='dark'] .btn-action-simple.btn-delete:hover {
      background-color: #7f1d1d;
      border-color: #ef4444;
    }

    .empty-table-row {
      text-align: center;
      padding: 2.5rem !important;
      color: var(--text-muted, #64748b);
    }

    .preview-card {
      animation: fadeIn 0.25s ease-out;
    }

    .preview-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 1rem;
    }

    .preview-summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .preview-stat {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.85rem 1rem;
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 6px;
    }

    .preview-stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      color: var(--text-muted, #64748b);
    }

    .preview-stat-value {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-dark, #1e293b);
    }

    .preview-stat-value.positive { color: #15803d; }
    .preview-stat-value.negative { color: #b91c1c; }

    .preview-note {
      font-size: 0.8rem;
      color: var(--text-muted, #64748b);
      margin: -0.5rem 0 1rem;
    }

    .preview-breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 1.25rem;
    }

    .preview-breakdown-grid h3 {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-dark, #1e293b);
      margin-bottom: 0.5rem;
    }

    .preview-breakdown-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      padding: 0.4rem 0;
      border-bottom: 1px solid var(--border-color, #f1f5f9);
      color: var(--text-dark, #1e293b);
    }

    .empty-note {
      font-size: 0.8rem;
      color: var(--text-muted, #64748b);
    }

    .preview-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color, #e2e8f0);
    }
  `]
})
export class ReportsComponent {
  reportService = inject(ReportService);
  private dataService = inject(DataService);

  readonly currentYear = new Date().getFullYear();

  readonly reportType = signal<ReportType>('income_statement');
  readonly period = signal<ReportPeriodKey>('current_month');
  readonly format = signal<ReportFormat>('PDF');
  readonly selectedReport = signal<GeneratedReport | null>(null);

  readonly currencySymbol = computed(() => {
    const country = this.dataService.currentUser()?.country || 'India';
    return CURRENCY_BY_COUNTRY[country] ?? '$';
  });

  onReportTypeChange(type: ReportType): void {
    this.reportType.set(type);

    // Tax summary only supports quarterly periods.
    if (type === 'tax_summary' && NON_QUARTER_PERIODS.includes(this.period())) {
      this.period.set('q2');
    }
  }

  isPeriodVisible(optionValue: ReportPeriodKey): boolean {
    if (this.reportType() === 'tax_summary') {
      return !NON_QUARTER_PERIODS.includes(optionValue);
    }
    return true;
  }

  onSubmit(): void {
    const report = this.reportService.generateReport(this.reportType(), this.period(), this.format());
    this.selectedReport.set(report);
  }

  onReset(): void {
    this.reportType.set('income_statement');
    this.period.set('current_month');
    this.format.set('PDF');
  }

  onPreview(report: GeneratedReport): void {
    this.selectedReport.set(report);
  }

  onDownload(report: GeneratedReport): void {
    if (report.format === 'CSV') {
      this.reportService.downloadReportCSV(report);
    } else {
      this.reportService.downloadReportPDF(report);
    }
  }

  onDelete(report: GeneratedReport, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${report.name}"?`)) {
      this.reportService.deleteReport(report.id);
      if (this.selectedReport()?.id === report.id) {
        this.selectedReport.set(null);
      }
    }
  }
}
