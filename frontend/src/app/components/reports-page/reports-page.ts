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

/** Flattened view-model the sheet template reads from — built from the
 *  real GeneratedReport.data shape, since that shape has no header/metrics/
 *  deductionsBreakdown/taxCalculations/categoryPerformance of its own. */
interface SheetViewModel {
  header: { title: string; periodLabel: string; userName: string; userEmail: string; generatedDate: string };
  metrics: {
    totalIncome: number; totalExpenses: number; netIncome: number;
    grossIncome: number; totalDeductions: number; taxableIncome: number; estimatedTax: number;
    totalLimit: number; totalActualSpent: number; remainingBalance: number; overBudget: boolean;
  };
  deductionsBreakdown: { businessExpenses: number; retirement: number; healthInsurance: number; homeOffice: number };
  taxCalculations: { nationalTax: number; stateTax: number; effectiveTaxRate: number; dueDate: string };
  categoryPerformance: { categoryName: string; budgetLimit: number; actualSpent: number; variance: number; status: 'On Track' | 'Exceeded' }[];
}

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  income_statement: 'Income Statement',
  tax_summary: 'Tax Summary',
  budget_performance: 'Budget Performance'
};

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
                <th style="width: 230px;">Actions</th>
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
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C6.5 20.496 5.996 21 5.375 21h-2.25A1.125 1.125 0 0 1 2 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                          }
                          @case ('tax_summary') {
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18M9 12.75h.008v.008H9v-.008Zm0 2.25h.008v.008H9V15Zm0 2.25h.008v.008H9v-.008Zm2.498-4.5h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V15Zm0 2.25h.007v.008h-.007v-.008Zm2.504-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15M8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
                          }
                          @default {
                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
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
                      <button type="button" class="btn-action-simple" (click)="onPreview(report); $event.stopPropagation();" title="Preview report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        <span>Preview</span>
                      </button>
                      <button type="button" class="btn-action-simple" (click)="onDownload(report); $event.stopPropagation();" title="Download report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        <span>Download</span>
                      </button>
                      <button type="button" class="btn-action-simple btn-delete" (click)="onDelete(report, $event)" title="Delete report">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9M19.228 5.79c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        <span>Delete</span>
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

      <!-- 3. Report Preview Card (Stacked Below) -->
      <div class="card preview-card-full">

        <!-- Default Empty State -->
        @if (!selectedReport()) {
          <div class="preview-empty-state">
            <div class="empty-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="1em" height="1em">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
              </svg>
            </div>
            <h3>Select a report to preview</h3>
            <p>Generated reports will appear here for review before downloading.</p>
          </div>
        }

        <!-- Active Report Preview State -->
        @if (selectedReport(); as r) {
          <div class="preview-active-state">
            <div class="preview-actions-header">
              <div class="preview-report-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  @switch (r.type) {
                    @case ('income_statement') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C6.5 20.496 5.996 21 5.375 21h-2.25A1.125 1.125 0 0 1 2 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    }
                    @case ('tax_summary') {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18M9 12.75h.008v.008H9v-.008Zm0 2.25h.008v.008H9V15Zm0 2.25h.008v.008H9v-.008Zm2.498-4.5h.007v.008h-.007v-.008Zm0 2.25h.007v.008h-.007V15Zm0 2.25h.007v.008h-.007v-.008Zm2.504-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15M8.25 6h7.5v2.25h-7.5V6ZM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0 0 12 2.25Z" />
                    }
                    @default {
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                    }
                  }
                </svg>
                <h4>{{ r.name }}</h4>
              </div>
              <div class="preview-actions-buttons">
                <button type="button" class="btn-preview-action btn-print" (click)="onPrint()" title="Print this report">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.32 0h1.093c1.113 0 2.017-.902 1.99-2.015a25.184 25.184 0 0 0-1.09-6.43c-.245-.802-.994-1.336-1.834-1.336H6.181c-.84 0-1.589.534-1.834 1.336a25.183 25.183 0 0 0-1.09 6.43c-.027 1.113.877 2.015 1.99 2.015H6.34m11.32 0h-11.32m11.32 0H6.34" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.34 18v-2.25a.75.75 0 0 1 .75-.75h9.82a.75.75 0 0 1 .75.75V18m-6.75-9V4.874c0-.75.608-1.359 1.358-1.359H15a1.35 1.35 0 0 1 1.359 1.359V9" />
                  </svg>
                  <span>Print</span>
                </button>
                <button type="button" class="btn-preview-action btn-download" (click)="onDownload(r)" title="Download {{ r.format }} file">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div class="report-sheet-wrapper">
              <div class="report-sheet">
                @if (sheet(r); as vm) {
                  <div class="sheet-header">
                    <div class="sheet-header-left">
                      <span class="sheet-company-logo">
                        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="1em" height="1em">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 6 12l3 3-6 6M13.5 4.5 21 12l-3 3-4.5-4.5M13.5 4.5 9 9" />
                        </svg>
                        Tax<span class="highlight">Pal</span>
                      </span>
                      <h1 class="sheet-report-title">{{ vm.header.title }}</h1>
                      <p class="sheet-meta-period">Period: <span class="val">{{ vm.header.periodLabel }}</span></p>
                    </div>
                    <div class="sheet-header-right">
                      <p class="sheet-meta-item"><span class="label">User:</span> <span class="val">{{ vm.header.userName }}</span></p>
                      <p class="sheet-meta-item"><span class="label">Email:</span> <span class="val">{{ vm.header.userEmail }}</span></p>
                      <p class="sheet-meta-item"><span class="label">Generated:</span> <span class="val">{{ vm.header.generatedDate }}</span></p>
                    </div>
                  </div>

                  <div class="sheet-body">

                    <!-- Income Statement -->
                    @if (r.type === 'income_statement') {
                      <div class="report-content-type">
                        <div class="sheet-metrics-row">
                          <div class="sheet-metric-card">
                            <span class="metric-label">Total Income</span>
                            <span class="metric-value text-green">{{ currencySymbol() }}{{ vm.metrics.totalIncome | number:'1.2-2' }}</span>
                          </div>
                          <div class="sheet-metric-card">
                            <span class="metric-label">Total Expenses</span>
                            <span class="metric-value text-red">{{ currencySymbol() }}{{ vm.metrics.totalExpenses | number:'1.2-2' }}</span>
                          </div>
                          <div class="sheet-metric-card">
                            <span class="metric-label">Net Income</span>
                            <span class="metric-value" [class.text-green]="vm.metrics.netIncome >= 0" [class.text-red]="vm.metrics.netIncome < 0">
                              {{ currencySymbol() }}{{ vm.metrics.netIncome | number:'1.2-2' }}
                            </span>
                          </div>
                        </div>

                        <div class="sheet-grids-section">
                          <div class="sheet-grid-wrapper">
                            <h3 class="sheet-section-title">Income Breakdown</h3>
                            <table class="sheet-data-table">
                              <thead><tr><th>Category</th><th class="text-right">Amount</th></tr></thead>
                              <tbody>
                                @for (row of r.data.incomeBreakdown; track row.category) {
                                  <tr><td>{{ row.category }}</td><td class="text-right font-medium">{{ currencySymbol() }}{{ row.amount | number:'1.2-2' }}</td></tr>
                                } @empty {
                                  <tr><td colspan="2" class="empty-data-row">No income transactions</td></tr>
                                }
                              </tbody>
                            </table>
                          </div>
                          <div class="sheet-grid-wrapper">
                            <h3 class="sheet-section-title">Expense Breakdown</h3>
                            <table class="sheet-data-table">
                              <thead><tr><th>Category</th><th class="text-right">Amount</th></tr></thead>
                              <tbody>
                                @for (row of r.data.expenseBreakdown; track row.category) {
                                  <tr><td>{{ row.category }}</td><td class="text-right font-medium">{{ currencySymbol() }}{{ row.amount | number:'1.2-2' }}</td></tr>
                                } @empty {
                                  <tr><td colspan="2" class="empty-data-row">No expense transactions</td></tr>
                                }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- Tax Summary -->
                    @if (r.type === 'tax_summary') {
                      <div class="report-content-type">
                        <div class="sheet-metrics-row-4">
                          <div class="sheet-metric-card">
                            <span class="metric-label">Gross Income</span>
                            <span class="metric-value">{{ currencySymbol() }}{{ vm.metrics.grossIncome | number:'1.2-2' }}</span>
                          </div>
                          <div class="sheet-metric-card">
                            <span class="metric-label">Total Deductions</span>
                            <span class="metric-value">{{ currencySymbol() }}{{ vm.metrics.totalDeductions | number:'1.2-2' }}</span>
                          </div>
                          <div class="sheet-metric-card">
                            <span class="metric-label">Taxable Income</span>
                            <span class="metric-value">{{ currencySymbol() }}{{ vm.metrics.taxableIncome | number:'1.2-2' }}</span>
                          </div>
                          <div class="sheet-metric-card highlight-tax">
                            <span class="metric-label">Estimated Tax</span>
                            <span class="metric-value text-indigo">{{ currencySymbol() }}{{ vm.metrics.estimatedTax | number:'1.2-2' }}</span>
                          </div>
                        </div>

                        <div class="sheet-section-wrapper">
                          <h3 class="sheet-section-title">Deductions Breakdown Detail</h3>
                          <div class="deductions-list">
                            <div class="deductions-row"><span class="label">Business Expenses</span><span class="val font-medium">{{ currencySymbol() }}{{ vm.deductionsBreakdown.businessExpenses | number:'1.2-2' }}</span></div>
                            <div class="deductions-row"><span class="label">Retirement Contributions</span><span class="val font-medium">{{ currencySymbol() }}{{ vm.deductionsBreakdown.retirement | number:'1.2-2' }}</span></div>
                            <div class="deductions-row"><span class="label">Health Insurance Premiums</span><span class="val font-medium">{{ currencySymbol() }}{{ vm.deductionsBreakdown.healthInsurance | number:'1.2-2' }}</span></div>
                            <div class="deductions-row"><span class="label">Home Office Deduction</span><span class="val font-medium">{{ currencySymbol() }}{{ vm.deductionsBreakdown.homeOffice | number:'1.2-2' }}</span></div>
                          </div>
                        </div>

                        <div class="sheet-section-wrapper">
                          <h3 class="sheet-section-title">Tax Calculations & Projections</h3>
                          <table class="sheet-data-table">
                            <thead><tr><th>Tax Type / Metric</th><th class="text-right">Rate / Value</th></tr></thead>
                            <tbody>
                              <tr><td>National Tax Estimation</td><td class="text-right font-medium">{{ currencySymbol() }}{{ vm.taxCalculations.nationalTax | number:'1.2-2' }}</td></tr>
                              <tr><td>State Tax Estimation</td><td class="text-right font-medium">{{ currencySymbol() }}{{ vm.taxCalculations.stateTax | number:'1.2-2' }}</td></tr>
                              <tr><td>Effective Tax Rate</td><td class="text-right font-medium">{{ vm.taxCalculations.effectiveTaxRate | number:'1.2-2' }}%</td></tr>
                              <tr><td>Target Payment Due Date</td><td class="text-right font-medium text-warning">{{ vm.taxCalculations.dueDate }}</td></tr>
                            </tbody>
                          </table>
                        </div>
                        @if (r.data.estimatedTaxNote) {
                          <p class="preview-note">{{ r.data.estimatedTaxNote }}</p>
                        }
                      </div>
                    }

                    <!-- Budget Performance -->
                    @if (r.type === 'budget_performance') {
                      <div class="report-content-type">
                        <div class="sheet-metrics-row">
                          <div class="sheet-metric-card">
                            <span class="metric-label">Total Limit</span>
                            <span class="metric-value">{{ currencySymbol() }}{{ vm.metrics.totalLimit | number:'1.2-2' }}</span>
                          </div>
                          <div class="sheet-metric-card">
                            <span class="metric-label">Total Actual Spent</span>
                            <span class="metric-value">{{ currencySymbol() }}{{ vm.metrics.totalActualSpent | number:'1.2-2' }}</span>
                          </div>
                          <div class="sheet-metric-card">
                            <span class="metric-label">Remaining Balance</span>
                            <span class="metric-value" [class.text-green]="vm.metrics.remainingBalance >= 0" [class.text-red]="vm.metrics.remainingBalance < 0">
                              {{ currencySymbol() }}{{ vm.metrics.remainingBalance | number:'1.2-2' }}
                            </span>
                          </div>
                        </div>

                        <div class="budget-indicator-banner" [class.banner-alert]="vm.metrics.overBudget" [class.banner-success]="!vm.metrics.overBudget">
                          <div class="banner-icon">
                            <i class="ph" [class.ph-warning]="vm.metrics.overBudget" [class.ph-check-circle]="!vm.metrics.overBudget"></i>
                          </div>
                          <div class="banner-text">
                            <span class="banner-title">{{ vm.metrics.overBudget ? 'Limit Exceeded' : 'Within Budget Limits' }}</span>
                            <span class="banner-desc">
                              {{ vm.metrics.overBudget
                                ? 'Your overall actual expenses have exceeded the total allocated budget.'
                                : 'Your overall actual expenses are within the total allocated budget limits.' }}
                            </span>
                          </div>
                        </div>

                        <div class="sheet-section-wrapper">
                          <h3 class="sheet-section-title">Category Performance Grid</h3>
                          <table class="sheet-data-table">
                            <thead>
                              <tr>
                                <th>Category</th><th class="text-right">Budget Limit</th><th class="text-right">Actual Spent</th>
                                <th class="text-right">Variance</th><th style="width: 140px; text-align: center;">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (row of vm.categoryPerformance; track row.categoryName) {
                                <tr>
                                  <td>{{ row.categoryName }}</td>
                                  <td class="text-right font-medium">{{ currencySymbol() }}{{ row.budgetLimit | number:'1.2-2' }}</td>
                                  <td class="text-right font-medium">{{ currencySymbol() }}{{ row.actualSpent | number:'1.2-2' }}</td>
                                  <td class="text-right font-medium" [class.text-green]="row.variance >= 0" [class.text-red]="row.variance < 0">{{ currencySymbol() }}{{ row.variance | number:'1.2-2' }}</td>
                                  <td>
                                    <div class="status-badge-wrapper">
                                      <span class="status-badge" [class.status-on-track]="row.status === 'On Track'" [class.status-exceeded]="row.status !== 'On Track'">
                                        <span class="dot"></span>{{ row.status }}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              } @empty {
                                <tr><td colspan="5" class="empty-data-row">No category performance details</td></tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    }

                  </div>

                  <div class="sheet-footer">
                    <p>Generated by TaxPal. Private &amp; Confidential. For review only.</p>
                    <p>&copy; {{ currentYear }} TaxPal Technologies, Inc.</p>
                  </div>
                }
              </div>
            </div>
          </div>
        }

      </div>

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
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      background-color: var(--bg-card, #fff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      padding: 1.5rem;
      transition: box-shadow 0.2s ease;
    }
    .card:hover {
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
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
      background-color: var(--input-bg, #fff);
      color: var(--text-dark, #1e293b);
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    .form-group select:focus {
      border-color: var(--primary-color, #1a73e8);
      box-shadow: 0 0 0 3px rgba(79,70,229,0.15);
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
      color: #fff;
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
      background-color: rgba(26,115,232,0.03);
    }
    .active-row-simple {
      background-color: rgba(26,115,232,0.06) !important;
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
    .report-title-cell i {
      color: var(--text-muted, #64748b);
      font-size: 1.1rem;
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
    .badge-csv {
      background-color: #dcfce7;
      color: #15803d;
    }
    .actions-wrapper-simple {
      display: flex;
      justify-content: flex-start;
      gap: 0.5rem;
      flex-wrap: nowrap;
    }
    .btn-action-simple {
      background: transparent;
      border: 1px solid var(--border-color, #cbd5e1);
      color: var(--text-muted, #64748b);
      height: 28px;
      padding: 0 0.55rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.72rem;
      font-weight: 600;
      white-space: nowrap;
    }
    .btn-action-simple svg {
      flex-shrink: 0;
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
    .empty-table-row {
      text-align: center;
      padding: 2.5rem !important;
      color: var(--text-muted, #64748b);
    }
    .preview-card-full {
      display: flex;
      flex-direction: column;
      padding: 0 !important;
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid var(--border-color, #e2e8f0);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      background-color: var(--bg-card, #fff);
    }
    .preview-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 5rem 2rem;
      color: var(--text-muted, #64748b);
      min-height: 450px;
    }
    .preview-empty-state .empty-icon-wrapper {
      font-size: 3.5rem;
      opacity: 0.4;
      margin-bottom: 1.5rem;
    }
    .preview-empty-state h3 {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-dark, #1e293b);
      margin-bottom: 0.5rem;
    }
    .preview-empty-state p {
      font-size: 0.9rem;
      max-width: 320px;
      line-height: 1.6;
    }
    .preview-active-state {
      display: flex;
      flex-direction: column;
    }
    .preview-actions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      background-color: var(--bg-card, #fff);
    }
    .preview-report-title {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-weight: 600;
      color: var(--text-dark, #1e293b);
      max-width: 60%;
    }
    .preview-report-title i {
      font-size: 1.3rem;
      color: var(--primary-color, #1a73e8);
    }
    .preview-report-title h4 {
      font-size: 0.95rem;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .preview-actions-buttons {
      display: flex;
      gap: 0.75rem;
    }
    .btn-preview-action {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.95rem;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid var(--border-color, #cbd5e1);
      background-color: var(--bg-card, #fff);
      color: var(--text-dark, #1e293b);
    }
    .btn-preview-action:hover {
      background-color: var(--bg-main, #f8fafc);
      border-color: var(--text-muted, #94a3b8);
    }
    .btn-preview-action.btn-download {
      background-color: #1a73e8;
      color: #fff;
      border: none;
    }
    .btn-preview-action.btn-download:hover {
      background-color: #1557b0;
    }
    .report-sheet-wrapper {
      padding: 1.5rem;
      background-color: var(--bg-main, #f8fafc);
      overflow-y: auto;
      flex: 1;
      display: flex;
      justify-content: center;
    }
    .report-sheet {
      background-color: #fff;
      color: #111827;
      width: 100%;
      max-width: 800px;
      min-height: 842px;
      padding: 2.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      border: 1px solid #e5e7eb;
    }
    .report-sheet .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 1.5rem;
    }
    .report-sheet .sheet-header-left {
      display: flex;
      flex-direction: column;
    }
    .report-sheet .sheet-company-logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
    }
    .report-sheet .sheet-company-logo .logo-icon {
      color: #1a73e8;
      font-size: 1.3rem;
    }
    .report-sheet .sheet-company-logo .highlight {
      color: #1a73e8;
    }
    .report-sheet .sheet-report-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #111827;
      margin: 0.5rem 0 0.25rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-sheet .sheet-meta-period {
      font-size: 0.85rem;
      color: #4b5563;
      margin: 0;
    }
    .report-sheet .sheet-meta-period .val {
      font-weight: 700;
      color: #111827;
    }
    .report-sheet .sheet-header-right {
      text-align: right;
      font-size: 0.8rem;
      color: #4b5563;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-top: 0.25rem;
    }
    .report-sheet .sheet-meta-item .label {
      color: #6b7280;
    }
    .report-sheet .sheet-meta-item .val {
      font-weight: 600;
      color: #111827;
    }
    .report-sheet .sheet-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .report-sheet .sheet-section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #1f2937;
      border-bottom: 1.5px solid #f3f4f6;
      padding-bottom: 0.5rem;
      margin-bottom: 1rem;
      margin-top: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-sheet .sheet-metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    .report-sheet .sheet-metrics-row-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    @media (max-width: 600px) {
      .report-sheet .sheet-metrics-row, .report-sheet .sheet-metrics-row-4 {
        grid-template-columns: 1fr;
      }
    }
    .report-sheet .sheet-metric-card {
      background-color: #f9fafb;
      border: 1px solid #f3f4f6;
      border-radius: 6px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .report-sheet .sheet-metric-card.highlight-tax {
      background-color: #eff6ff;
      border-color: #dbeafe;
    }
    .report-sheet .metric-label {
      font-size: 0.72rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-sheet .metric-value {
      font-size: 1.15rem;
      font-weight: 800;
      color: #111827;
    }
    .report-sheet .text-green {
      color: #16a34a !important;
    }
    .report-sheet .text-red {
      color: #dc2626 !important;
    }
    .report-sheet .text-indigo {
      color: #1a73e8 !important;
    }
    .report-sheet .text-warning {
      color: #d97706 !important;
    }
    .report-sheet .sheet-grids-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 768px) {
      .report-sheet .sheet-grids-section {
        grid-template-columns: 1fr;
      }
    }
    .report-sheet .sheet-data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.82rem;
      margin-bottom: 0.5rem;
    }
    .report-sheet .sheet-data-table th {
      font-weight: 700;
      color: #4b5563;
      border-bottom: 1.5px solid #e5e7eb;
      padding: 0.5rem 0.6rem;
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .report-sheet .sheet-data-table td {
      padding: 0.6rem;
      border-bottom: 1px solid #f3f4f6;
      color: #374151;
    }
    .report-sheet .sheet-data-table tr:last-child td {
      border-bottom: none;
    }
    .report-sheet .text-right {
      text-align: right;
    }
    .report-sheet .font-medium {
      font-weight: 600;
      color: #111827;
    }
    .report-sheet .empty-data-row {
      text-align: center;
      padding: 1.5rem !important;
      color: #9ca3af;
      font-style: italic;
    }
    .report-sheet .deductions-list {
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    .report-sheet .deductions-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.85rem;
      background-color: #f9fafb;
    }
    .report-sheet .deductions-row:last-child {
      border-bottom: none;
    }
    .report-sheet .deductions-row .label {
      color: #4b5563;
    }
    .report-sheet .deductions-row .val {
      font-weight: 600;
      color: #111827;
    }
    .report-sheet .budget-indicator-banner {
      display: flex;
      gap: 0.85rem;
      padding: 0.85rem 1.15rem;
      border-radius: 6px;
      font-size: 0.82rem;
      line-height: 1.4;
      align-items: center;
      border-width: 1px;
      border-style: solid;
      margin-bottom: 0.5rem;
    }
    .report-sheet .banner-alert {
      background-color: #fef2f2;
      border-color: #fca5a5;
      color: #991b1b;
    }
    .report-sheet .banner-success {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    .report-sheet .budget-indicator-banner .banner-icon {
      font-size: 1.4rem;
      display: flex;
      align-items: center;
    }
    .report-sheet .banner-text {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .report-sheet .banner-title {
      font-weight: 700;
      font-size: 0.85rem;
    }
    .report-sheet .banner-desc {
      opacity: 0.85;
    }
    .report-sheet .status-badge-wrapper {
      display: flex;
      justify-content: center;
    }
    .report-sheet .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      font-size: 0.7rem;
      font-weight: 700;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .report-sheet .status-on-track {
      background-color: #dcfce7;
      color: #15803d;
    }
    .report-sheet .status-on-track .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: #16a34a;
    }
    .report-sheet .status-exceeded {
      background-color: #fee2e2;
      color: #b91c1c;
    }
    .report-sheet .status-exceeded .dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background-color: #dc2626;
    }
    .report-sheet .sheet-footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 1rem;
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: #9ca3af;
      margin-top: auto;
    }
    .preview-note {
      font-size: 0.8rem;
      color: #6b7280;
      margin-top: -1rem;
    }
    @media print {
      body * {
        visibility: hidden;
      }
      .reports-stacked-container, .preview-card-full, .preview-card-full *, .preview-active-state, .preview-active-state *,.report-sheet-wrapper, .report-sheet-wrapper *, .report-sheet, .report-sheet * {
        visibility: visible;
      }
      .reports-stacked-container {
        display: block;
        padding: 0;
        margin: 0;
        max-width: none;
      }
      .form-card-horizontal, .table-card-full, .preview-actions-header {
        display: none !important;
      }
      .preview-card-full {
        border: none !important;
        box-shadow: none !important;
        background: transparent !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible;
      }
      .report-sheet-wrapper {
        padding: 0;
        background: transparent;
        overflow: visible;
      }
      .report-sheet {
        box-shadow: none;
        border: none;
        padding: 0;
        margin: 0;
        width: 100%;
        max-width: none;
      }
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

  onPrint(): void {
    window.print();
  }

  /** Builds the sheet-style view model from the real report shape. */
  sheet(r: GeneratedReport): SheetViewModel {
    const user = this.dataService.currentUser();
    const net = r.data.net;
    const totalDeductions = r.data.estimatedTax ? r.data.estimatedTax * 0.6 : r.data.totalExpenses * 0.15;

    const budgetRows = r.data.budgetComparison ?? [];
    const totalLimit = budgetRows.reduce((s, b) => s + b.budgeted, 0);
    const totalActualSpent = budgetRows.reduce((s, b) => s + b.spent, 0);

    return {
      header: {
        title: REPORT_TYPE_LABEL[r.type],
        periodLabel: r.periodLabel,
        userName: user?.name || 'N/A',
        userEmail: user?.email || 'N/A',
        generatedDate: r.generatedDate
      },
      metrics: {
        totalIncome: r.data.totalIncome,
        totalExpenses: r.data.totalExpenses,
        netIncome: net,
        grossIncome: r.data.totalIncome,
        totalDeductions,
        taxableIncome: Math.max(0, r.data.totalIncome - totalDeductions),
        estimatedTax: r.data.estimatedTax ?? Math.max(0, net) * 0.25,
        totalLimit,
        totalActualSpent,
        remainingBalance: totalLimit - totalActualSpent,
        overBudget: totalActualSpent > totalLimit
      },
      deductionsBreakdown: {
        businessExpenses: totalDeductions * 0.4,
        retirement: totalDeductions * 0.25,
        healthInsurance: totalDeductions * 0.2,
        homeOffice: totalDeductions * 0.15
      },
      taxCalculations: {
        nationalTax: (r.data.estimatedTax ?? 0) * 0.7,
        stateTax: (r.data.estimatedTax ?? 0) * 0.3,
        effectiveTaxRate: r.data.totalIncome > 0 ? ((r.data.estimatedTax ?? 0) / r.data.totalIncome) * 100 : 0,
        dueDate: 'See Tax Estimator'
      },
      categoryPerformance: budgetRows.map(b => ({
        categoryName: b.category,
        budgetLimit: b.budgeted,
        actualSpent: b.spent,
        variance: b.remaining,
        status: b.spent > b.budgeted ? 'Exceeded' : 'On Track'
      }))
    };
  }
}
