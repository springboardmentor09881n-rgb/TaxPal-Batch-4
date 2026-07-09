import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

interface TaxSummaryData {
  gross: number;
  deductions: number;
  taxable: number;
  estimatedTax: number;
  dueDate: string;
  quarterLabel: string;
}

@Component({
  selector: 'app-tax-estimator-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Title -->
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Tax Estimator (India)</h1>
        <p class="text-xs text-slate-500 mt-1">Calculate your estimated Advance Tax obligations under the Indian Income Tax Regime.</p>
      </div>

      <!-- Main Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Calculator Form -->
        <div class="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <h3 class="text-sm font-bold text-slate-900">Quarterly Tax Calculator</h3>
          </div>

          <form (submit)="calculateTax($event)" class="space-y-4">
            <!-- Region & State -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Country</label>
                <input 
                  type="text" 
                  value="India" 
                  disabled 
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-400 font-bold"
                />
              </div>
              <div>
                <label for="state" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">State / UT</label>
                <select 
                  id="state" 
                  name="state"
                  [(ngModel)]="state"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                </select>
              </div>
            </div>

            <!-- Filing Status & Quarter -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="status" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Filing Status</label>
                <select 
                  id="status" 
                  name="status"
                  [(ngModel)]="filingStatus"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Individual">Individual</option>
                  <option value="HUF">HUF (Hindu Undivided Family)</option>
                </select>
              </div>
              <div>
                <label for="quarter" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Assessment Quarter</label>
                <select 
                  id="quarter" 
                  name="quarter"
                  [(ngModel)]="quarter"
                  class="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Q1">Q1 (Apr-Jun 2026)</option>
                  <option value="Q2">Q2 (Jul-Sep 2026)</option>
                  <option value="Q3">Q3 (Oct-Dec 2026)</option>
                  <option value="Q4">Q4 (Jan-Mar 2027)</option>
                </select>
              </div>
            </div>

            <!-- Gross Income -->
            <div>
              <label for="gross" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Gross Income for Quarter</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input 
                  id="gross"
                  name="gross"
                  type="number" 
                  required
                  min="0"
                  [(ngModel)]="grossIncome"
                  placeholder="0.00"
                  class="w-full pl-6 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button 
                type="button" 
                (click)="autoFillIncome()" 
                class="mt-1.5 text-[10px] text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer"
              >
                Pull actual logged income for selected quarter
              </button>
            </div>

            <!-- Deductions Subheader -->
            <div class="border-t border-slate-100 pt-4">
              <span class="text-xs font-bold text-slate-900 block mb-3">Deductions & Investments</span>
              
              <div class="grid grid-cols-2 gap-4">
                <!-- Business Expenses -->
                <div>
                  <label for="bizExp" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Business Expenses</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                    <input 
                      id="bizExp"
                      name="bizExp"
                      type="number" 
                      min="0"
                      [(ngModel)]="businessExpenses"
                      class="w-full pl-6 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button 
                    type="button" 
                    (click)="autoFillExpenses()" 
                    class="mt-1 text-[9px] text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    Pull actual expenses
                  </button>
                </div>

                <!-- Section 80C -->
                <div>
                  <label for="ret" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">PPF/NPS (Sec 80C/80CCD)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                    <input 
                      id="ret"
                      name="ret"
                      type="number" 
                      min="0"
                      [(ngModel)]="retirement"
                      placeholder="Max ₹1.5L"
                      class="w-full pl-6 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <!-- Section 80D -->
                <div>
                  <label for="health" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Health Premium (Sec 80D)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                    <input 
                      id="health"
                      name="health"
                      type="number" 
                      min="0"
                      [(ngModel)]="healthInsurance"
                      placeholder="Max ₹25k"
                      class="w-full pl-6 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <!-- Section 37 Office Deductions -->
                <div>
                  <label for="homeOff" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Rent / Home Office (Sec 37)</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                    <input 
                      id="homeOff"
                      name="homeOff"
                      type="number" 
                      min="0"
                      [(ngModel)]="homeOffice"
                      class="w-full pl-6 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                type="submit" 
                class="px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Calculate Estimated Advance Tax
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Results & Calendar -->
        <div class="lg:col-span-5 space-y-6">
          
          <!-- Tax Summary Result Box -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Indian Tax Summary</h3>
            
            @if (summary(); as data) {
              <div class="space-y-3.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-slate-500 font-medium">Assessment Quarter</span>
                  <span class="font-bold text-slate-800">{{ data.quarterLabel }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 font-medium">Gross Quarterly Earnings</span>
                  <span class="font-bold text-slate-800">₹{{ data.gross.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 font-medium">Allowable Deductions</span>
                  <span class="font-bold text-slate-800">-₹{{ data.deductions.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</span>
                </div>
                <hr class="border-slate-100" />
                <div class="flex justify-between text-sm">
                  <span class="text-slate-600 font-bold">Estimated Net Taxable</span>
                  <span class="font-extrabold text-slate-900">₹{{ data.taxable.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</span>
                </div>
                <div class="flex justify-between text-sm bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <span class="text-blue-700 font-bold">Quarterly Advance Tax</span>
                  <span class="font-black text-blue-800 text-base">₹{{ data.estimatedTax.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</span>
                </div>
                <div class="flex justify-between text-[11px] text-slate-400">
                  <span>Advance Tax Deadline</span>
                  <span class="font-semibold">{{ data.dueDate }}</span>
                </div>
              </div>
            } @else {
              <div class="text-center py-10 flex flex-col items-center justify-center text-slate-400">
                <svg class="h-12 w-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <p class="text-xs text-center">Fill in quarterly gross earnings and tax deductions to estimate Indian advance tax dues.</p>
              </div>
            }
          </div>

          <!-- Indian Advance Tax Calendar -->
          <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
            <h3 class="text-sm font-bold text-slate-900">Advance Tax Calendar (FY 2026-27)</h3>
            
            <div class="space-y-4">
              @for (alert of calendarAlerts; track alert.title) {
                <div class="flex justify-between items-start text-xs border-b border-slate-50 last:border-0 pb-3 last:pb-0">
                  <div class="space-y-1">
                    <span class="block text-[10px] font-bold text-slate-400 uppercase">{{ alert.month }}</span>
                    <span class="block font-bold text-slate-800">{{ alert.title }}</span>
                    <span class="block text-[10px] text-slate-500 leading-normal">{{ alert.desc }}</span>
                  </div>
                  <span 
                    class="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full select-none"
                    [class.bg-blue-50]="alert.badge === 'reminder'"
                    [class.text-blue-700]="alert.badge === 'reminder'"
                    [class.bg-amber-50]="alert.badge === 'payment'"
                    [class.text-amber-700]="alert.badge === 'payment'"
                  >
                    {{ alert.badge }}
                  </span>
                </div>
              }
            </div>
          </div>

          <!-- Indian Tax Savings Opportunities -->
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl text-white shadow-md shadow-blue-500/10 space-y-3">
            <div class="flex items-center gap-2">
              <svg class="h-5 w-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a3 3 0 0 0-3-3H9.75a3 3 0 0 0-3 3v5.25m3-5.25h3.5M12 18.75h.008v.008H12v-.008Z" />
              </svg>
              <h4 class="text-xs font-bold uppercase tracking-wider">India Tax Savings Tip</h4>
            </div>
            <p class="text-xs font-bold text-blue-50">Presumptive Taxation (Sec 44ADA)</p>
            <p class="text-[11px] leading-relaxed text-blue-100">
              Indian freelancers (designers, consultants, software engineers) with annual receipts under ₹75 Lakhs can opt for presumptive taxation. Pay tax on a flat **50% of your gross earnings** without bookkeeping!
            </p>
          </div>

        </div>

      </div>
    </div>
  `
})
export class TaxEstimatorPage {
  protected country = 'India';
  protected state = 'Maharashtra';
  protected filingStatus = 'Individual';
  protected quarter = 'Q1';
  
  protected grossIncome: number | null = null;
  protected businessExpenses = 0;
  protected retirement = 0; // Section 80C
  protected healthInsurance = 0; // Section 80D
  protected homeOffice = 0; // Section 37

  protected readonly summary = signal<TaxSummaryData | null>(null);

  protected readonly calendarAlerts = [
    {
      month: 'June 15, 2026',
      title: 'Q1 Advance Tax Payment (15%)',
      desc: 'Pay 15% of your total estimated annual tax liability to avoid interest under Section 234C.',
      badge: 'payment'
    },
    {
      month: 'September 15, 2026',
      title: 'Q2 Advance Tax Payment (45%)',
      desc: 'Cumulative payment of 45% of your total annual tax liability is due.',
      badge: 'payment'
    },
    {
      month: 'December 15, 2026',
      title: 'Q3 Advance Tax Payment (75%)',
      desc: 'Cumulative payment of 75% of your total annual tax liability is due.',
      badge: 'payment'
    },
    {
      month: 'March 15, 2027',
      title: 'Q4 Advance Tax Payment (100%)',
      desc: 'Final advance tax payment installment of 100% of your tax liabilities.',
      badge: 'payment'
    }
  ];

  constructor(private dataService: DataService) {
    this.state = this.dataService.currentUser()?.state || 'Maharashtra';
  }

  protected autoFillIncome(): void {
    const transactions = this.dataService.transactions();
    
    let monthPrefixes: string[] = [];
    if (this.quarter === 'Q1') monthPrefixes = ['2026-04', '2026-05', '2026-06']; // Indian FY Q1 starts Apr
    else if (this.quarter === 'Q2') monthPrefixes = ['2026-07', '2026-08', '2026-09'];
    else if (this.quarter === 'Q3') monthPrefixes = ['2026-10', '2026-11', '2026-12'];
    else if (this.quarter === 'Q4') monthPrefixes = ['2027-01', '2027-02', '2027-03'];

    const sum = transactions
      .filter(t => t.type === 'income' && monthPrefixes.some(p => t.date.startsWith(p)))
      .reduce((s, t) => s + t.amount, 0);

    this.grossIncome = sum || 150000;
  }

  protected autoFillExpenses(): void {
    const transactions = this.dataService.transactions();
    
    let monthPrefixes: string[] = [];
    if (this.quarter === 'Q1') monthPrefixes = ['2026-04', '2026-05', '2026-06'];
    else if (this.quarter === 'Q2') monthPrefixes = ['2026-07', '2026-08', '2026-09'];
    else if (this.quarter === 'Q3') monthPrefixes = ['2026-10', '2026-11', '2026-12'];
    else if (this.quarter === 'Q4') monthPrefixes = ['2027-01', '2027-02', '2027-03'];

    const sum = transactions
      .filter(t => t.type === 'expense' && monthPrefixes.some(p => t.date.startsWith(p)))
      .reduce((s, t) => s + t.amount, 0);

    this.businessExpenses = sum || 30000;
  }

  protected calculateTax(event: Event): void {
    event.preventDefault();
    if (this.grossIncome === null) return;

    const gross = Number(this.grossIncome);
    
    // Limits: Section 80C capped at 1.5L, Section 80D capped at 25k
    const capped80C = Math.min(Number(this.retirement), 150000);
    const capped80D = Math.min(Number(this.healthInsurance), 25000);
    
    const totalDeductions = 
      Number(this.businessExpenses) + 
      capped80C + 
      capped80D + 
      Number(this.homeOffice);

    const taxable = Math.max(gross - totalDeductions, 0);

    // Annualize quarterly taxable income to evaluate Indian slabs:
    const annualTaxable = taxable * 4;
    let annualTax = 0;

    if (annualTaxable <= 700000) {
      // Rebate under Section 87A: tax is NIL if taxable income is under 7 Lakhs (New Regime)
      annualTax = 0;
    } else {
      // Slabs:
      // Up to 3L: 0%
      // 3L - 7L: 5% (max 20k)
      // 7L - 10L: 10% (max 30k)
      // 10L - 12L: 15% (max 30k)
      // 12L - 15L: 20% (max 60k)
      // Above 15L: 30%
      if (annualTaxable <= 300000) {
        annualTax = 0;
      } else if (annualTaxable <= 700000) {
        annualTax = (annualTaxable - 300000) * 0.05;
      } else if (annualTaxable <= 1000000) {
        annualTax = 20000 + (annualTaxable - 700000) * 0.10;
      } else if (annualTaxable <= 1200000) {
        annualTax = 50000 + (annualTaxable - 1000000) * 0.15;
      } else if (annualTaxable <= 1500000) {
        annualTax = 80000 + (annualTaxable - 1200000) * 0.20;
      } else {
        annualTax = 140000 + (annualTaxable - 1500000) * 0.30;
      }
    }

    // Add 4% Health and Education Cess
    annualTax = annualTax * 1.04;
    
    // Quarterly tax is annual tax divided by 4
    const estimatedTax = annualTax / 4;

    // Deadlines
    let dueDate = 'June 15, 2026';
    if (this.quarter === 'Q2') dueDate = 'September 15, 2026';
    else if (this.quarter === 'Q3') dueDate = 'December 15, 2026';
    else if (this.quarter === 'Q4') dueDate = 'March 15, 2027';

    this.summary.set({
      gross,
      deductions: totalDeductions,
      taxable,
      estimatedTax,
      dueDate,
      quarterLabel: `${this.quarter} (FY 2026-27 - ${this.state})`
    });
  }
}
