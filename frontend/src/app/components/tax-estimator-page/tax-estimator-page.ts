import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Bracket {
  upTo: number;
  rate: number;
}

interface StateOption {
  name: string;
  rate: number;
}

interface TaxResult {
  grossIncome: number;
  totalDeductions: number;
  netTaxableIncome: number;
  federalTax: number;
  stateTax: number;
  selfEmploymentTax: number;
  totalTax: number;
  effectiveRate: number;
  takeHome: number;
}

const US_STATES: StateOption[] = [
  { name: 'Alabama', rate: 0.05 }, { name: 'Alaska', rate: 0 }, { name: 'Arizona', rate: 0.025 },
  { name: 'Arkansas', rate: 0.044 }, { name: 'California', rate: 0.093 }, { name: 'Colorado', rate: 0.044 },
  { name: 'Connecticut', rate: 0.055 }, { name: 'Delaware', rate: 0.066 }, { name: 'Florida', rate: 0 },
  { name: 'Georgia', rate: 0.0539 }, { name: 'Hawaii', rate: 0.0825 }, { name: 'Idaho', rate: 0.058 },
  { name: 'Illinois', rate: 0.0495 }, { name: 'Indiana', rate: 0.0305 }, { name: 'Iowa', rate: 0.038 },
  { name: 'Kansas', rate: 0.052 }, { name: 'Kentucky', rate: 0.04 }, { name: 'Louisiana', rate: 0.0425 },
  { name: 'Maine', rate: 0.0715 }, { name: 'Maryland', rate: 0.0575 }, { name: 'Massachusetts', rate: 0.05 },
  { name: 'Michigan', rate: 0.0425 }, { name: 'Minnesota', rate: 0.0785 }, { name: 'Mississippi', rate: 0.047 },
  { name: 'Missouri', rate: 0.048 }, { name: 'Montana', rate: 0.059 }, { name: 'Nebraska', rate: 0.052 },
  { name: 'Nevada', rate: 0 }, { name: 'New Hampshire', rate: 0 }, { name: 'New Jersey', rate: 0.0637 },
  { name: 'New Mexico', rate: 0.049 }, { name: 'New York', rate: 0.0685 }, { name: 'North Carolina', rate: 0.0425 },
  { name: 'North Dakota', rate: 0.025 }, { name: 'Ohio', rate: 0.035 }, { name: 'Oklahoma', rate: 0.0475 },
  { name: 'Oregon', rate: 0.0875 }, { name: 'Pennsylvania', rate: 0.0307 }, { name: 'Rhode Island', rate: 0.0599 },
  { name: 'South Carolina', rate: 0.062 }, { name: 'South Dakota', rate: 0 }, { name: 'Tennessee', rate: 0 },
  { name: 'Texas', rate: 0 }, { name: 'Utah', rate: 0.0455 }, { name: 'Vermont', rate: 0.066 },
  { name: 'Virginia', rate: 0.0575 }, { name: 'Washington', rate: 0 }, { name: 'West Virginia', rate: 0.0482 },
  { name: 'Wisconsin', rate: 0.053 }, { name: 'Wyoming', rate: 0 }, { name: 'District of Columbia', rate: 0.0895 }
];

type FilingStatus = 'Single' | 'Married Filing Jointly' | 'Head of Household' | 'Married Filing Separately';

const FEDERAL_BRACKETS: Record<FilingStatus, Bracket[]> = {
  'Single': [
    { upTo: 11925, rate: 0.10 }, { upTo: 48475, rate: 0.12 }, { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 }, { upTo: 250525, rate: 0.32 }, { upTo: 626350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 }
  ],
  'Married Filing Jointly': [
    { upTo: 23850, rate: 0.10 }, { upTo: 96950, rate: 0.12 }, { upTo: 206700, rate: 0.22 },
    { upTo: 394600, rate: 0.24 }, { upTo: 501050, rate: 0.32 }, { upTo: 751600, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 }
  ],
  'Head of Household': [
    { upTo: 17000, rate: 0.10 }, { upTo: 64850, rate: 0.12 }, { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 }, { upTo: 250500, rate: 0.32 }, { upTo: 626350, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 }
  ],
  'Married Filing Separately': [
    { upTo: 11925, rate: 0.10 }, { upTo: 48475, rate: 0.12 }, { upTo: 103350, rate: 0.22 },
    { upTo: 197300, rate: 0.24 }, { upTo: 250525, rate: 0.32 }, { upTo: 375800, rate: 0.35 },
    { upTo: Infinity, rate: 0.37 }
  ]
};

const SELF_EMPLOYMENT_TAX_RATE = 0.153;

function computeProgressiveTax(annualIncome: number, brackets: Bracket[]): number {
  if (annualIncome <= 0) return 0;
  let tax = 0;
  let lower = 0;
  for (const bracket of brackets) {
    if (annualIncome <= lower) break;
    const taxableInThisBracket = Math.min(annualIncome, bracket.upTo) - lower;
    tax += taxableInThisBracket * bracket.rate;
    lower = bracket.upTo;
    if (annualIncome <= bracket.upTo) break;
  }
  return tax;
}

@Component({
  selector: 'app-tax-estimator',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-2">
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Tax Estimator</h1>
      <p class="text-xs text-slate-500 mb-6">Calculate your estimated tax obligations</p>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-8 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 class="text-sm font-bold text-slate-900 mb-6">Quarterly Tax Calculator</h3>

          <form (submit)="calculate($event)" class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Country/Region</label>
                <select [(ngModel)]="country" name="country" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>United States</option>
                  <option>India</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">State/Province</label>
                <select [(ngModel)]="stateName" name="stateName" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  @for (s of stateOptions(); track s.name) {
                    <option [value]="s.name">{{ s.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Filing Status</label>
                <select [(ngModel)]="filingStatus" name="filingStatus" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Single</option>
                  <option>Married Filing Jointly</option>
                  <option>Head of Household</option>
                  <option>Married Filing Separately</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Quarter</label>
                <select [(ngModel)]="quarter" name="quarter" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  @for (q of quarterOptions(); track q) {
                    <option [value]="q">{{ q }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Income</p>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Gross Income for Quarter</label>
              <div class="relative">
                <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">{{ currencySymbol() }}</span>
                <input type="number" min="0" step="0.01" [(ngModel)]="grossIncome" name="grossIncome"
                  placeholder="0.00" class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Deductions</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Business Expenses</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">{{ currencySymbol() }}</span>
                    <input type="number" min="0" step="0.01" [(ngModel)]="businessExpenses" name="businessExpenses"
                      placeholder="0.00" class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Retirement Contributions</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">{{ currencySymbol() }}</span>
                    <input type="number" min="0" step="0.01" [(ngModel)]="retirementContributions" name="retirementContributions"
                      placeholder="0.00" class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Health Insurance Premiums</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">{{ currencySymbol() }}</span>
                    <input type="number" min="0" step="0.01" [(ngModel)]="healthInsurancePremiums" name="healthInsurancePremiums"
                      placeholder="0.00" class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Home Office Deduction</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">{{ currencySymbol() }}</span>
                    <input type="number" min="0" step="0.01" [(ngModel)]="homeOfficeDeduction" name="homeOfficeDeduction"
                      placeholder="0.00" class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" class="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer">
                Calculate Estimated Tax
              </button>
            </div>
          </form>
        </div>

        <div class="lg:col-span-4 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 lg:sticky lg:top-6">
          <h3 class="text-sm font-bold text-slate-900 mb-6">Tax Summary</h3>

          @if (!result()) {
            <div class="flex flex-col items-center text-center py-10">
              <div class="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                <svg class="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 7.5h6M9 12h.008v.008H9V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM12.375 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm.375 3.375a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm3.375-3.375a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm.375 3.375a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-6.75 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM6.75 6.75h10.5A2.25 2.25 0 0 1 19.5 9v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V9a2.25 2.25 0 0 1 2.25-2.25Z" />
                </svg>
              </div>
              <p class="text-xs text-slate-400 max-w-[220px]">
                Enter your income and deduction details to calculate your estimated quarterly tax.
              </p>
            </div>
          } @else {
            <div class="space-y-4">
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">Gross Income</span>
                <span class="font-bold text-slate-800">{{ currencySymbol() }}{{ result()!.grossIncome.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-slate-500">Total Deductions</span>
                <span class="font-bold text-slate-800">-{{ currencySymbol() }}{{ result()!.totalDeductions.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
              </div>
              <div class="flex justify-between text-xs pb-3 border-b border-slate-100">
                <span class="text-slate-500">Net Taxable Income</span>
                <span class="font-bold text-slate-800">{{ currencySymbol() }}{{ result()!.netTaxableIncome.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
              </div>

              <div class="flex justify-between text-xs">
                <span class="text-slate-500">{{ country === 'India' ? 'Income Tax (est.)' : 'Federal Income Tax (est.)' }}</span>
                <span class="font-bold text-slate-800">{{ currencySymbol() }}{{ result()!.federalTax.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
              </div>
              @if (country !== 'India') {
                <div class="flex justify-between text-xs">
                  <span class="text-slate-500">State Income Tax (est.)</span>
                  <span class="font-bold text-slate-800">{{ currencySymbol() }}{{ result()!.stateTax.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
                </div>
              }
              <div class="flex justify-between text-xs pb-3 border-b border-slate-100">
                <span class="text-slate-500">Self-Employment Tax (est.)</span>
                <span class="font-bold text-slate-800">{{ currencySymbol() }}{{ result()!.selfEmploymentTax.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
              </div>

              <div class="flex justify-between items-baseline pt-1">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Total Estimated Tax</span>
                <span class="text-xl font-black text-red-500">{{ currencySymbol() }}{{ result()!.totalTax.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-2">
                <div class="bg-slate-50 rounded-xl p-3">
                  <p class="text-[10px] font-bold uppercase text-slate-400">Effective Rate</p>
                  <p class="text-sm font-black text-slate-800 mt-1">{{ (result()!.effectiveRate * 100).toFixed(1) }}%</p>
                </div>
                <div class="bg-slate-50 rounded-xl p-3">
                  <p class="text-[10px] font-bold uppercase text-slate-400">Est. Take-Home</p>
                  <p class="text-sm font-black text-emerald-600 mt-1">{{ currencySymbol() }}{{ result()!.takeHome.toLocaleString(locale(), {maximumFractionDigits: 0}) }}</p>
                </div>
              </div>

              <p class="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                This is a simplified estimate for planning purposes only and does not constitute tax advice. Consult a tax professional for guidance specific to your situation.
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class TaxEstimatorPage {
  protected country: 'United States' | 'India' = 'United States';
  protected stateName = 'California';
  protected filingStatus: FilingStatus = 'Single';
  protected quarter = '';

  protected grossIncome: number | null = null;
  protected businessExpenses: number | null = null;
  protected retirementContributions: number | null = null;
  protected healthInsurancePremiums: number | null = null;
  protected homeOfficeDeduction: number | null = null;

  protected readonly result = signal<TaxResult | null>(null);

  private readonly indiaStates: StateOption[] = [
    { name: 'Maharashtra', rate: 0 }, { name: 'Delhi', rate: 0 }, { name: 'Karnataka', rate: 0 },
    { name: 'Tamil Nadu', rate: 0 }, { name: 'Telangana', rate: 0 }, { name: 'Gujarat', rate: 0 },
    { name: 'West Bengal', rate: 0 }, { name: 'Uttar Pradesh', rate: 0 }, { name: 'Rajasthan', rate: 0 },
    { name: 'Kerala', rate: 0 }
  ];

  constructor() {
    this.quarter = this.quarterOptions()[Math.floor((new Date().getMonth()) / 3)];
  }

  protected stateOptions(): StateOption[] {
    return this.country === 'India' ? this.indiaStates : US_STATES;
  }

  protected currencySymbol(): string {
    return this.country === 'India' ? '₹' : '$';
  }

  protected locale(): string {
    return this.country === 'India' ? 'en-IN' : 'en-US';
  }

  protected quarterOptions(): string[] {
    const year = new Date().getFullYear();
    return [
      `Q1 (Jan-Mar ${year})`,
      `Q2 (Apr-Jun ${year})`,
      `Q3 (Jul-Sep ${year})`,
      `Q4 (Oct-Dec ${year})`
    ];
  }

  protected calculate(event: Event): void {
    event.preventDefault();

    const gross = Number(this.grossIncome) || 0;
    const deductions =
      (Number(this.businessExpenses) || 0) +
      (Number(this.retirementContributions) || 0) +
      (Number(this.healthInsurancePremiums) || 0) +
      (Number(this.homeOfficeDeduction) || 0);

    const netQuarterly = Math.max(gross - deductions, 0);
    const annualizedNet = netQuarterly * 4;

    let federalTax = 0;
    let stateTax = 0;
    let selfEmploymentTax = 0;

    if (this.country === 'India') {
      const slabs: Bracket[] = [
        { upTo: 300000, rate: 0 }, { upTo: 700000, rate: 0.05 }, { upTo: 1000000, rate: 0.10 },
        { upTo: 1200000, rate: 0.15 }, { upTo: 1500000, rate: 0.20 }, { upTo: Infinity, rate: 0.30 }
      ];
      const annualTax = computeProgressiveTax(annualizedNet, slabs);
      federalTax = annualTax / 4;
      stateTax = 0;
      selfEmploymentTax = 0;
    } else {
      const brackets = FEDERAL_BRACKETS[this.filingStatus];
      const annualFederalTax = computeProgressiveTax(annualizedNet, brackets);
      federalTax = annualFederalTax / 4;

      const stateRate = this.stateOptions().find(s => s.name === this.stateName)?.rate || 0;
      stateTax = netQuarterly * stateRate;

      selfEmploymentTax = netQuarterly * SELF_EMPLOYMENT_TAX_RATE;
    }

    const totalTax = federalTax + stateTax + selfEmploymentTax;
    const effectiveRate = gross > 0 ? totalTax / gross : 0;

    this.result.set({
      grossIncome: gross,
      totalDeductions: deductions,
      netTaxableIncome: netQuarterly,
      federalTax,
      stateTax,
      selfEmploymentTax,
      totalTax,
      effectiveRate,
      takeHome: gross - totalTax
    });
  }
}
