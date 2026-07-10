import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Report, Transaction, Category } from '../../services/data.service';

interface PreviewLine {
  label: string;
  value: string;
  isBold?: boolean;
  isNegative?: boolean;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Title -->
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports</h1>
        <p class="text-xs text-slate-500 mt-1">Generate, review, and export tax summaries and income statements.</p>
      </div>

      <!-- Columns Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left: Generation Form & Recents -->
        <div class="lg:col-span-5 space-y-6">
          <!-- Generate Card -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Generate Report</h3>
            
            <form (submit)="handleGenerate($event)" class="space-y-4">
              <!-- Report Type -->
              <div>
                <label for="type" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Report Type</label>
                <select 
                  id="type"
                  name="type"
                  [(ngModel)]="reportType"
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Income Statement">Income Statement</option>
                  <option value="Tax Summary">Tax Summary</option>
                  <option value="Expense Report">Expense Report</option>
                </select>
              </div>

              <!-- Period -->
              <div>
                <label for="period" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Period</label>
                <select 
                  id="period"
                  name="period"
                  [(ngModel)]="reportPeriod"
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Current Month">Current Month</option>
                  <option value="Last Month">Last Month</option>
                  <option value="Year-to-Date">Year-to-Date (2026)</option>
                </select>
              </div>

              <!-- Format -->
              <div>
                <label for="format" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Format</label>
                <select 
                  id="format"
                  name="format"
                  [(ngModel)]="reportFormat"
                  class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PDF">PDF (Printable Document)</option>
                  <option value="CSV">CSV (Spreadsheet Data)</option>
                </select>
              </div>

              <!-- Buttons -->
              <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  (click)="resetForm()"
                  class="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 cursor-pointer"
                >
                  Reset
                </button>
                <button 
                  type="submit" 
                  class="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Generate Report
                </button>
              </div>
            </form>
          </div>

          <!-- Recent Reports List -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Recent Reports</h3>
            
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs border-collapse">
                <thead>
                  <tr class="border-b border-slate-100 text-slate-400 font-semibold">
                    <th class="pb-2">Report Name</th>
                    <th class="pb-2 w-16 text-center">Format</th>
                    <th class="pb-2 w-16 text-center">Period</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (rep of recentReports(); track rep.id) {
                    <tr 
                      (click)="selectReport(rep)"
                      class="hover:bg-slate-50 cursor-pointer transition-colors"
                      [class.bg-blue-50/40]="selectedReport()?.id === rep.id"
                      [class.font-bold]="selectedReport()?.id === rep.id"
                    >
                      <td class="py-2.5">
                        <span class="text-slate-800 block truncate">{{ rep.reportType }}</span>
                        <span class="text-[10px] text-slate-400 block mt-0.5 font-normal">Generated {{ rep.generatedDate }}</span>
                      </td>
                      <td class="py-2.5 text-center text-[10px] font-bold text-slate-500">
                        {{ rep.format }}
                      </td>
                      <td class="py-2.5 text-center text-[10px] text-slate-500 truncate max-w-20">
                        {{ rep.period }}
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="3" class="py-8 text-center text-slate-400 font-medium">No reports generated yet.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Right: Report Preview workspace -->
        <div class="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm min-h-[400px] flex flex-col">
          <div class="flex justify-between items-center border-b border-slate-100 pb-3 mb-6">
            <h3 class="text-sm font-bold text-slate-900">Report Preview</h3>
            
            @if (selectedReport(); as rep) {
              <div class="flex gap-2">
                <button 
                  (click)="handlePrint()"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 border border-slate-200 cursor-pointer focus:outline-none"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.615 0-1.101-.476-1.12-1.09l-.228-2.66m11.777 0H6.23m11.547 0L18.75 9.75M6.23 18 5.25 9.75m13.5 0a3 3 0 0 0-3-3h-7.5a3 3 0 0 0-3 3m13.5 0v3.75m-13.5 0v3.75m1.875-10.5h.008v.008H4.875v-.008Zm2.625 0h.008v.008H7.5v-.008Z" />
                  </svg>
                  Print
                </button>
                <button 
                  (click)="handleDownload()"
                  class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer focus:outline-none"
                >
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download
                </button>
              </div>
            }
          </div>

          <div class="flex-grow flex flex-col justify-center">
            @if (selectedReport(); as rep) {
              <!-- Printable Statement Container -->
              <div id="print-area" class="border border-slate-100 p-6 rounded-xl space-y-6 text-slate-800 text-xs">
                <!-- Branding Header -->
                <div class="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h4 class="text-base font-bold text-slate-900">TaxPal Financial Statement</h4>
                    <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Authorized ITD E-File Record (India)</p>
                  </div>
                  <div class="text-right">
                    <span class="font-extrabold text-blue-600 tracking-tight text-sm block">TP TaxPal</span>
                    <span class="text-[9px] text-slate-400 block mt-0.5">Date: {{ rep.generatedDate }}</span>
                  </div>
                </div>

                <!-- Report Details Grid -->
                <div class="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span class="text-slate-400 block">Report Type:</span>
                    <span class="font-bold text-slate-800">{{ rep.reportType }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Filing Period:</span>
                    <span class="font-bold text-slate-800">{{ rep.period }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Assessee Name:</span>
                    <span class="font-bold text-slate-800">Alex Morgan (Individual)</span>
                  </div>
                  <div>
                    <span class="text-slate-400 block">Reference ID:</span>
                    <span class="font-mono text-[10px] font-bold text-slate-500">{{ rep.name }}</span>
                  </div>
                </div>

                <!-- Statement Line Items -->
                <div class="border-t border-slate-200 pt-4 space-y-2.5">
                  @for (line of previewLines(); track line.label) {
                    <div 
                      class="flex justify-between"
                      [class.font-bold]="line.isBold"
                      [class.text-slate-900]="line.isBold"
                      [class.pt-2.5]="line.isBold"
                      [class.border-t]="line.isBold"
                      [class.border-slate-100]="line.isBold"
                    >
                      <span [class.pl-3]="!line.isBold" class="text-slate-600 font-medium">{{ line.label }}</span>
                      <span 
                        [class.text-red-500]="line.isNegative" 
                        [class.text-emerald-600]="line.label === 'Net Profit' || line.label === 'Total Gross Receipts'"
                      >
                        {{ line.value }}
                      </span>
                    </div>
                  }
                </div>

                <!-- Footer disclaimer -->
                <div class="border-t border-slate-100 pt-4 text-[9px] text-slate-400 text-center leading-relaxed">
                  This workbook compiles calculations based on records matching Income Tax Department guidelines. Keep copy for Section 44ADA / 44AB verification.
                </div>
              </div>
            } @else {
              <!-- Placeholder Empty State -->
              <div class="text-center py-20 flex flex-col items-center justify-center text-slate-400 select-none">
                <svg class="h-16 w-16 text-slate-200 mb-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p class="text-xs font-semibold text-slate-600">Select a report to preview</p>
                <p class="text-[11px] text-slate-400 mt-1 max-w-xs leading-normal">Generated reports will appear here for review before downloading or printing.</p>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class ReportsPage {
  // Form Values
  protected reportType = 'Income Statement';
  protected reportPeriod = 'Current Month';
  protected reportFormat: 'PDF' | 'CSV' = 'PDF';

  // Selection state
  protected readonly selectedReport = signal<Report | null>(null);

  constructor(private dataService: DataService) {
    const recents = this.dataService.reports();
    if (recents.length > 0) {
      this.selectedReport.set(recents[0]);
    }
  }

  protected recentReports = computed(() => this.dataService.reports());

  protected previewLines = computed<PreviewLine[]>(() => {
    const rep = this.selectedReport();
    if (!rep) return [];

    const transactions = this.dataService.transactions();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    let dateFilter = (d: string) => d.startsWith(currentMonth);
    if (rep.period === 'Last Month') {
      const lm = new Date();
      lm.setMonth(lm.getMonth() - 1);
      const lmPrefix = lm.toISOString().slice(0, 7);
      dateFilter = (d: string) => d.startsWith(lmPrefix);
    } else if (rep.period === 'Year-to-Date') {
      dateFilter = (d: string) => d.startsWith('2026') || d.startsWith('2027'); // Support FY crossover
    }

    const filteredTx = transactions.filter(t => dateFilter(t.date));

    if (rep.reportType === 'Income Statement') {
      const grossIncome = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const grossExpense = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const netProfit = grossIncome - grossExpense;

      const expGroups: { [key: string]: number } = {};
      filteredTx.filter(t => t.type === 'expense').forEach(t => {
        expGroups[t.category] = (expGroups[t.category] || 0) + t.amount;
      });

      const lines: PreviewLine[] = [
        { label: 'Total Gross Receipts', value: `₹${grossIncome.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isBold: true },
        { label: 'Less Cost of Goods/Services', value: '₹0.00' },
      ];

      Object.keys(expGroups).forEach(cat => {
        lines.push({ label: `Expense: ${cat}`, value: `-₹${expGroups[cat].toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isNegative: true });
      });

      lines.push({ label: 'Total Deductible Expenses', value: `-₹${grossExpense.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isBold: true, isNegative: true });
      lines.push({ label: 'Net Profit', value: `₹${netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isBold: true });

      return lines;
    } else if (rep.reportType === 'Tax Summary') {
      const gross = filteredTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const bizExp = filteredTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      
      const retirement = 0; // Sec 80C
      const health = 0; // Sec 80D
      const homeOffice = 0; // Sec 37

      const deductions = bizExp + retirement + health + homeOffice;
      const taxable = Math.max(gross - deductions, 0);
      
      // Slab rate proxy 15.6% (15% rate + 4% cess)
      const estTax = taxable * 0.156;

      return [
        { label: 'Gross Receipts', value: `₹${gross.toLocaleString('en-IN', {minimumFractionDigits: 2})}` },
        { label: 'Business Expenses Deducted', value: `-₹${bizExp.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isNegative: true },
        { label: 'Section 80C PPF/NPS Deductions', value: `-₹${retirement.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isNegative: true },
        { label: 'Section 80D Health Premiums', value: `-₹${health.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isNegative: true },
        { label: 'Section 37 Office Deductions', value: `-₹${homeOffice.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isNegative: true },
        { label: 'Total Allowable Deductions', value: `₹${deductions.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isBold: true },
        { label: 'Net Taxable Income', value: `₹${taxable.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isBold: true },
        { label: 'Estimated Advance Tax Due (with Cess)', value: `₹${estTax.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isBold: true }
      ];
    } else {
      // Expense Report
      const totals: PreviewLine[] = [];
      const expGroups: { [key: string]: number } = {};
      filteredTx.filter(t => t.type === 'expense').forEach(t => {
        expGroups[t.category] = (expGroups[t.category] || 0) + t.amount;
      });

      let sum = 0;
      Object.keys(expGroups).forEach(cat => {
        const val = expGroups[cat];
        sum += val;
        totals.push({ label: cat, value: `₹${val.toLocaleString('en-IN', {minimumFractionDigits: 2})}` });
      });

      totals.push({ label: 'Total Expenditures', value: `₹${sum.toLocaleString('en-IN', {minimumFractionDigits: 2})}`, isBold: true });
      return totals;
    }
  });

  protected handleGenerate(event: Event): void {
    event.preventDefault();
    this.dataService.generateReport(this.reportType, this.reportPeriod, this.reportFormat);
    
    const recents = this.dataService.reports();
    if (recents.length > 0) {
      this.selectedReport.set(recents[0]);
    }
  }

  protected selectReport(rep: Report): void {
    this.selectedReport.set(rep);
  }

  protected resetForm(): void {
    this.reportType = 'Income Statement';
    this.reportPeriod = 'Current Month';
    this.reportFormat = 'PDF';
  }

  protected handlePrint(): void {
    const printContent = document.getElementById('print-area')?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `
      <div style="font-family: sans-serif; padding: 40px; max-width: 600px; margin: 0 auto;">
        ${printContent}
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  }

  protected handleDownload(): void {
    const rep = this.selectedReport();
    if (!rep) return;

    let content = 'Label,Amount\n';
    this.previewLines().forEach(line => {
      // Stripping Rupee and negative symbols for clean CSV numbers
      content += `"${line.label}","${line.value.replace('₹', '').replace('-', '')}"\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${rep.name}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
