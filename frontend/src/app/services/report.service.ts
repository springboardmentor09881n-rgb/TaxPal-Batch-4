import { Injectable, inject, signal } from '@angular/core';
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

const STORAGE_KEY = 'tp_generated_reports';

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  income_statement: 'Income Statement',
  tax_summary: 'Tax Summary',
  budget_performance: 'Budget Performance'
};

/** Maps a period key to the month offsets (relative to "now") that bound it, or a fixed quarter/year. */
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

const QUARTER_LABEL_BY_KEY: Partial<Record<ReportPeriodKey, 'Q1' | 'Q2' | 'Q3' | 'Q4'>> = {
  q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4'
};

@Injectable({ providedIn: 'root' })
export class ReportService {
  private dataService = inject(DataService);

  /** Signal-backed report history, scoped to the signed-in user. */
  readonly reports = signal<GeneratedReport[]>(this.readScopedReports());

  private readScopedReports(): GeneratedReport[] {
    const all = this.readAllFromStorage();
    const userId = this.dataService.currentUser()?.id;
    const scoped = userId ? all.filter(r => r.userId === userId) : all;
    return [...scoped].sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
  }

  private readAllFromStorage(): GeneratedReport[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeAllToStorage(all: GeneratedReport[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }

  private refresh(): void {
    this.reports.set(this.readScopedReports());
  }

  // ---- Report generation -------------------------------------------------

  generateReport(type: ReportType, period: ReportPeriodKey, format: ReportFormat): GeneratedReport {
    const now = new Date();
    const { start, end, label } = PERIOD_RESOLVERS[period](now);

    const txsInRange = this.dataService.transactions()
      .filter(t => t.date && this.withinRange(new Date(t.date), start, end))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const totalIncome = this.sumByType(txsInRange, 'income');
    const totalExpenses = this.sumByType(txsInRange, 'expense');

    const reportData: GeneratedReport['data'] = {
      totalIncome,
      totalExpenses,
      net: totalIncome - totalExpenses,
      incomeBreakdown: this.groupByCategory(txsInRange, 'income', totalIncome),
      expenseBreakdown: this.groupByCategory(txsInRange, 'expense', totalExpenses),
      transactions: txsInRange
    };

    this.enrichForType(type, period, start, end, reportData);

    const userId = this.dataService.currentUser()?.id || 'unknown';
    const report: GeneratedReport = {
      id: this.newId(),
      userId,
      type,
      name: `${REPORT_TYPE_LABEL[type]} - ${label}`,
      period,
      periodLabel: label,
      format,
      generatedDate: this.formatTimestamp(now),
      generatedAt: now.toISOString(),
      data: reportData
    };

    const all = this.readAllFromStorage();
    all.unshift(report);
    this.writeAllToStorage(all);
    this.refresh();

    format === 'CSV' ? this.downloadReportCSV(report) : this.downloadReportPDF(report);

    return report;
  }

  private withinRange(d: Date, start: Date, end: Date): boolean {
    return !isNaN(d.getTime()) && d >= start && d <= end;
  }

  private sumByType(txs: Transaction[], type: 'income' | 'expense'): number {
    return txs.filter(t => t.type === type).reduce((sum, t) => sum + (t.amount || 0), 0);
  }

  private groupByCategory(txs: Transaction[], type: 'income' | 'expense', total: number): CategoryBreakdownRow[] {
    const totals = new Map<string, number>();
    for (const t of txs) {
      if (t.type !== type) continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + (t.amount || 0));
    }
    return [...totals.entries()]
      .map(([category, amount]) => ({ category, amount, percentage: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
  }

  private enrichForType(type: ReportType, period: ReportPeriodKey, start: Date, end: Date, data: GeneratedReport['data']): void {
    if (type === 'budget_performance') {
      data.budgetComparison = this.buildBudgetComparison(start, end);
      return;
    }
    if (type === 'tax_summary') {
      const quarter = QUARTER_LABEL_BY_KEY[period];
      const matched = quarter ? this.dataService.estimates().find(e => (e.quarter || '').toUpperCase() === quarter) : undefined;

      if (matched) {
        data.estimatedTax = matched.estimatedTax;
        data.estimatedTaxNote = 'Based on your saved Tax Estimator figures for this quarter.';
      } else {
        data.estimatedTax = Math.max(0, data.net) * 0.25;
        data.estimatedTaxNote = 'Approximate figure (25% of net income). Visit Tax Estimator for a precise calculation.';
      }
    }
  }

  private buildBudgetComparison(start: Date, end: Date): BudgetComparisonRow[] {
    const rangeStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const relevant = this.dataService.budgets().filter(b => {
      if (!b.month) return false;
      const monthStart = new Date(`${b.month}-01`);
      return !isNaN(monthStart.getTime()) && monthStart >= rangeStart && monthStart <= end;
    });

    const totals = new Map<string, BudgetComparisonRow>();
    for (const b of relevant) {
      const budgeted = b.budget_amount || 0;
      const spent = b.spent || 0;
      const existing = totals.get(b.category);
      if (existing) {
        existing.budgeted += budgeted;
        existing.spent += spent;
        existing.remaining = existing.budgeted - existing.spent;
      } else {
        totals.set(b.category, { category: b.category, budgeted, spent, remaining: budgeted - spent });
      }
    }
    return [...totals.values()].sort((a, b) => b.budgeted - a.budgeted);
  }

  // ---- Downloads -----------------------------------------------------

  downloadReportCSV(report: GeneratedReport): void {
    const csv = this.buildCsvDocument(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.triggerDownload(blob, `${this.slugify(report.name)}.csv`);
  }

  private buildCsvDocument(report: GeneratedReport): string {
    const { data } = report;
    const rows: string[] = [
      'TaxPal Financial Report',
      `Report Type,${REPORT_TYPE_LABEL[report.type]}`,
      `Period,${report.periodLabel}`,
      `Generated,${report.generatedDate}`,
      '',
      'Summary',
      `Total Income,${data.totalIncome.toFixed(2)}`,
      `Total Expenses,${data.totalExpenses.toFixed(2)}`,
      `Net,${data.net.toFixed(2)}`
    ];

    if (data.estimatedTax !== undefined) {
      rows.push(`Estimated Tax,${data.estimatedTax.toFixed(2)}`);
    }
    rows.push('');

    rows.push('Income by Category', 'Category,Amount,Percentage');
    data.incomeBreakdown.forEach(r => rows.push(`${this.csvEscape(r.category)},${r.amount.toFixed(2)},${r.percentage.toFixed(1)}%`));
    rows.push('');

    rows.push('Expenses by Category', 'Category,Amount,Percentage');
    data.expenseBreakdown.forEach(r => rows.push(`${this.csvEscape(r.category)},${r.amount.toFixed(2)},${r.percentage.toFixed(1)}%`));
    rows.push('');

    if (data.budgetComparison?.length) {
      rows.push('Budget vs Actual', 'Category,Budgeted,Spent,Remaining');
      data.budgetComparison.forEach(r => rows.push(`${this.csvEscape(r.category)},${r.budgeted.toFixed(2)},${r.spent.toFixed(2)},${r.remaining.toFixed(2)}`));
      rows.push('');
    }

    rows.push('Transactions', 'Date,Type,Category,Description,Amount');
    data.transactions.forEach(t => rows.push(`${t.date},${t.type},${this.csvEscape(t.category)},${this.csvEscape(t.description || '')},${(t.amount || 0).toFixed(2)}`));

    return rows.join('\n');
  }

  downloadReportPDF(report: GeneratedReport): void {
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return;
    }

    doc.open();
    doc.write(this.buildPrintableHtml(report));
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 500);
    }, 200);
  }

  private buildPrintableHtml(report: GeneratedReport): string {
    const { data } = report;
    const money = (n: number) => n.toFixed(2);

    const breakdownRows = (rows: CategoryBreakdownRow[]) =>
      rows.map(r => `<tr><td>${this.escapeHtml(r.category)}</td><td>${money(r.amount)}</td><td>${r.percentage.toFixed(1)}%</td></tr>`).join('');

    const budgetRows = (data.budgetComparison ?? [])
      .map(r => `<tr><td>${this.escapeHtml(r.category)}</td><td>${money(r.budgeted)}</td><td>${money(r.spent)}</td><td>${money(r.remaining)}</td></tr>`)
      .join('');

    const txRows = data.transactions
      .map(t => `<tr><td>${t.date}</td><td>${this.escapeHtml(t.description || '')}</td><td>${this.escapeHtml(t.category)}</td><td>${t.type}</td><td>${t.type === 'income' ? '+' : '-'}${money(t.amount || 0)}</td></tr>`)
      .join('');

    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${this.escapeHtml(report.name)}</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; padding: 24px; }
          h1 { font-size: 20px; margin: 0 0 4px; }
          .meta { font-size: 12px; color: #475569; margin: 0 0 16px; }
          h3 { font-size: 13px; margin: 18px 0 6px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          table.summary td { padding: 4px 0; font-size: 12px; }
          table.summary td:first-child { font-weight: bold; width: 60%; }
          table.data th, table.data td { border: 1px solid #cbd5e1; padding: 5px 8px; font-size: 11px; text-align: left; }
          table.data th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        <h1>${this.escapeHtml(REPORT_TYPE_LABEL[report.type])}</h1>
        <p class="meta">${this.escapeHtml(report.periodLabel)} &middot; Generated ${this.escapeHtml(report.generatedDate)}</p>

        <table class="summary">
          <tr><td>Total Income</td><td>${money(data.totalIncome)}</td></tr>
          <tr><td>Total Expenses</td><td>${money(data.totalExpenses)}</td></tr>
          <tr><td>Net</td><td>${money(data.net)}</td></tr>
          ${data.estimatedTax !== undefined ? `<tr><td>Estimated Tax</td><td>${money(data.estimatedTax)}</td></tr>` : ''}
        </table>
        ${data.estimatedTaxNote ? `<p class="meta">${this.escapeHtml(data.estimatedTaxNote)}</p>` : ''}

        <h3>Income by Category</h3>
        <table class="data"><thead><tr><th>Category</th><th>Amount</th><th>%</th></tr></thead><tbody>${breakdownRows(data.incomeBreakdown) || '<tr><td colspan="3">No income recorded</td></tr>'}</tbody></table>

        <h3>Expenses by Category</h3>
        <table class="data"><thead><tr><th>Category</th><th>Amount</th><th>%</th></tr></thead><tbody>${breakdownRows(data.expenseBreakdown) || '<tr><td colspan="3">No expenses recorded</td></tr>'}</tbody></table>

        ${data.budgetComparison?.length ? `
          <h3>Budget vs Actual</h3>
          <table class="data"><thead><tr><th>Category</th><th>Budgeted</th><th>Spent</th><th>Remaining</th></tr></thead><tbody>${budgetRows}</tbody></table>
        ` : ''}

        <h3>Transactions</h3>
        <table class="data"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th>Amount</th></tr></thead><tbody>${txRows || '<tr><td colspan="5">No transactions found</td></tr>'}</tbody></table>
      </body>
      </html>`;
  }

  deleteReport(id: string): void {
    const all = this.readAllFromStorage().filter(r => r.id !== id);
    this.writeAllToStorage(all);
    this.refresh();
  }

  // ---- Helpers ---------------------------------------------------------

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

  private csvEscape(value: string): string {
    if (value == null) return '';
    return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }

  private escapeHtml(value: string): string {
    if (value == null) return '';
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  private slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'report';
  }

  private formatTimestamp(d: Date): string {
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  private newId(): string {
    return `rep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
