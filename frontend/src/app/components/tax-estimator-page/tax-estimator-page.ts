import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaxNotificationPanel } from '../tax-notification-panel/tax-notification-panel';
import { TaxEstimateService } from '../../services/tax-estimate.service';
import { TaxEstimate, TaxEstimateFilingStatus } from '../../models';

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

interface CalendarEntry {
  quarter: string;
  label: string;
  dueDate: Date;
  description: string;
}

interface TaxReminder {
  id: string;
  message: string;
  dueDate: string;
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

type CountryId = 'United States' | 'India' | 'Canada' | 'United Kingdom' | 'Australia' | 'Germany' | 'European Union' | 'Japan' | 'Singapore' | 'United Arab Emirates';

const CANADA_PROVINCES: StateOption[] = [
  { name: 'Alberta', rate: 0.10 }, { name: 'British Columbia', rate: 0.128 }, { name: 'Manitoba', rate: 0.174 },
  { name: 'New Brunswick', rate: 0.197 }, { name: 'Newfoundland and Labrador', rate: 0.218 },
  { name: 'Northwest Territories', rate: 0.1405 }, { name: 'Nova Scotia', rate: 0.21 },
  { name: 'Nunavut', rate: 0.115 }, { name: 'Ontario', rate: 0.1316 }, { name: 'Prince Edward Island', rate: 0.188 },
  { name: 'Quebec', rate: 0.2575 }, { name: 'Saskatchewan', rate: 0.145 }, { name: 'Yukon', rate: 0.128 }
];

const UK_REGIONS: StateOption[] = [
  { name: 'England', rate: 0 }, { name: 'Scotland', rate: 0 },
  { name: 'Wales', rate: 0 }, { name: 'Northern Ireland', rate: 0 }
];

const AUSTRALIA_STATES: StateOption[] = [
  { name: 'New South Wales', rate: 0 }, { name: 'Victoria', rate: 0 }, { name: 'Queensland', rate: 0 },
  { name: 'Western Australia', rate: 0 }, { name: 'South Australia', rate: 0 }, { name: 'Tasmania', rate: 0 },
  { name: 'Australian Capital Territory', rate: 0 }, { name: 'Northern Territory', rate: 0 }
];

const GERMANY_STATES: StateOption[] = [
  { name: 'Baden-Württemberg', rate: 0 }, { name: 'Bavaria', rate: 0 }, { name: 'Berlin', rate: 0 },
  { name: 'Brandenburg', rate: 0 }, { name: 'Bremen', rate: 0 }, { name: 'Hamburg', rate: 0 },
  { name: 'Hesse', rate: 0 }, { name: 'Lower Saxony', rate: 0 }, { name: 'Mecklenburg-Vorpommern', rate: 0 },
  { name: 'North Rhine-Westphalia', rate: 0 }, { name: 'Rhineland-Palatinate', rate: 0 }, { name: 'Saarland', rate: 0 },
  { name: 'Saxony', rate: 0 }, { name: 'Saxony-Anhalt', rate: 0 }, { name: 'Schleswig-Holstein', rate: 0 },
  { name: 'Thuringia', rate: 0 }
];

const JAPAN_PREFECTURES: StateOption[] = [
  { name: 'Tokyo', rate: 0.10 }, { name: 'Osaka', rate: 0.10 }, { name: 'Kyoto', rate: 0.10 },
  { name: 'Kanagawa', rate: 0.10 }, { name: 'Aichi', rate: 0.10 }, { name: 'Hokkaido', rate: 0.10 },
  { name: 'Fukuoka', rate: 0.10 }, { name: 'Hyogo', rate: 0.10 }, { name: 'Chiba', rate: 0.10 },
  { name: 'Saitama', rate: 0.10 }, { name: 'Shizuoka', rate: 0.10 }, { name: 'Miyagi', rate: 0.10 },
  { name: 'Hiroshima', rate: 0.10 }
];

const SINGAPORE_REGIONS: StateOption[] = [
  { name: 'Central Region', rate: 0 }, { name: 'East Region', rate: 0 },
  { name: 'North Region', rate: 0 }, { name: 'North-East Region', rate: 0 },
  { name: 'West Region', rate: 0 }
];

const UAE_EMIRATES: StateOption[] = [
  { name: 'Abu Dhabi', rate: 0 }, { name: 'Dubai', rate: 0 }, { name: 'Sharjah', rate: 0 },
  { name: 'Ajman', rate: 0 }, { name: 'Umm Al Quwain', rate: 0 }, { name: 'Ras Al Khaimah', rate: 0 },
  { name: 'Fujairah', rate: 0 }
];

const CANADA_FEDERAL_BRACKETS: Bracket[] = [
  { upTo: 55867, rate: 0.15 }, { upTo: 111733, rate: 0.205 }, { upTo: 173205, rate: 0.26 },
  { upTo: 246752, rate: 0.29 }, { upTo: Infinity, rate: 0.33 }
];

const UK_BRACKETS: Bracket[] = [
  { upTo: 12570, rate: 0 }, { upTo: 50270, rate: 0.20 }, { upTo: 125140, rate: 0.40 }, { upTo: Infinity, rate: 0.45 }
];

const UK_SCOTLAND_BRACKETS: Bracket[] = [
  { upTo: 12570, rate: 0 }, { upTo: 14876, rate: 0.19 }, { upTo: 26561, rate: 0.20 }, { upTo: 43662, rate: 0.21 },
  { upTo: 75000, rate: 0.42 }, { upTo: 125140, rate: 0.45 }, { upTo: Infinity, rate: 0.47 }
];

const AUSTRALIA_BRACKETS: Bracket[] = [
  { upTo: 18200, rate: 0 }, { upTo: 45000, rate: 0.16 }, { upTo: 135000, rate: 0.30 },
  { upTo: 190000, rate: 0.37 }, { upTo: Infinity, rate: 0.45 }
];

const GERMANY_BRACKETS: Bracket[] = [
  { upTo: 11604, rate: 0 }, { upTo: 17005, rate: 0.14 }, { upTo: 66760, rate: 0.24 },
  { upTo: 277825, rate: 0.42 }, { upTo: Infinity, rate: 0.45 }
];

const JAPAN_BRACKETS: Bracket[] = [
  { upTo: 1950000, rate: 0.05 }, { upTo: 3300000, rate: 0.10 }, { upTo: 6950000, rate: 0.20 },
  { upTo: 9000000, rate: 0.23 }, { upTo: 18000000, rate: 0.33 }, { upTo: 40000000, rate: 0.40 },
  { upTo: Infinity, rate: 0.45 }
];

const SINGAPORE_BRACKETS: Bracket[] = [
  { upTo: 20000, rate: 0 }, { upTo: 30000, rate: 0.02 }, { upTo: 40000, rate: 0.035 },
  { upTo: 80000, rate: 0.07 }, { upTo: 120000, rate: 0.115 }, { upTo: 160000, rate: 0.15 },
  { upTo: 200000, rate: 0.18 }, { upTo: 240000, rate: 0.19 }, { upTo: 280000, rate: 0.20 },
  { upTo: 320000, rate: 0.22 }, { upTo: Infinity, rate: 0.24 }
];

interface CountryTaxConfig {
  states: StateOption[];
  stateLabel: string;
  hasStateTax: boolean;
  stateTaxLabel: string;
  brackets: Bracket[];
  firmRate: number;
  extraTaxLabel: string;
  extraTaxBase: 'income' | 'tax';
  extraTaxRate: number;
  currency: string;
  locale: string;
}

const COUNTRY_CONFIG: Record<CountryId, CountryTaxConfig> = {
  'United States': {
    states: US_STATES, stateLabel: 'State', hasStateTax: true,
    stateTaxLabel: 'State Income Tax (est.)', brackets: [], firmRate: 0.21,
    extraTaxLabel: 'Self-Employment Tax (est.)', extraTaxBase: 'income', extraTaxRate: 0.153,
    currency: '$', locale: 'en-US'
  },
  'India': {
    states: [], stateLabel: 'State', hasStateTax: false,
    stateTaxLabel: 'State Income Tax (est.)', brackets: [], firmRate: 0.25,
    extraTaxLabel: 'Health & Education Cess (est.)', extraTaxBase: 'tax', extraTaxRate: 0.04,
    currency: '₹', locale: 'en-IN'
  },
  'Canada': {
    states: CANADA_PROVINCES, stateLabel: 'Province', hasStateTax: true,
    stateTaxLabel: 'Provincial Income Tax (est.)', brackets: CANADA_FEDERAL_BRACKETS, firmRate: 0.15,
    extraTaxLabel: 'CPP Contribution (est.)', extraTaxBase: 'income', extraTaxRate: 0.119,
    currency: 'CA$', locale: 'en-CA'
  },
  'United Kingdom': {
    states: UK_REGIONS, stateLabel: 'Region', hasStateTax: false,
    stateTaxLabel: 'Regional Income Tax (est.)', brackets: UK_BRACKETS, firmRate: 0.25,
    extraTaxLabel: 'National Insurance (est.)', extraTaxBase: 'income', extraTaxRate: 0.06,
    currency: '£', locale: 'en-GB'
  },
  'Australia': {
    states: AUSTRALIA_STATES, stateLabel: 'State/Territory', hasStateTax: false,
    stateTaxLabel: 'State Income Tax (est.)', brackets: AUSTRALIA_BRACKETS, firmRate: 0.25,
    extraTaxLabel: 'Medicare Levy (est.)', extraTaxBase: 'income', extraTaxRate: 0.02,
    currency: 'A$', locale: 'en-AU'
  },
  'Germany': {
    states: GERMANY_STATES, stateLabel: 'State (Bundesland)', hasStateTax: false,
    stateTaxLabel: 'State Income Tax (est.)', brackets: GERMANY_BRACKETS, firmRate: 0.15,
    extraTaxLabel: 'Solidarity Surcharge (est.)', extraTaxBase: 'tax', extraTaxRate: 0.055,
    currency: '€', locale: 'de-DE'
  },
  'European Union': {
    states: GERMANY_STATES, stateLabel: 'Member State Region', hasStateTax: false,
    stateTaxLabel: 'State Income Tax (est.)', brackets: GERMANY_BRACKETS, firmRate: 0.15,
    extraTaxLabel: 'Solidarity Surcharge (est.)', extraTaxBase: 'tax', extraTaxRate: 0.055,
    currency: '€', locale: 'de-DE'
  },
  'Japan': {
    states: JAPAN_PREFECTURES, stateLabel: 'Prefecture', hasStateTax: true,
    stateTaxLabel: 'Inhabitant Tax (est.)', brackets: JAPAN_BRACKETS, firmRate: 0.232,
    extraTaxLabel: 'Enterprise Tax (est.)', extraTaxBase: 'income', extraTaxRate: 0.05,
    currency: '¥', locale: 'ja-JP'
  },
  'Singapore': {
    states: SINGAPORE_REGIONS, stateLabel: 'Region', hasStateTax: false,
    stateTaxLabel: 'Regional Tax (est.)', brackets: SINGAPORE_BRACKETS, firmRate: 0.17,
    extraTaxLabel: 'Medisave Levy (est.)', extraTaxBase: 'income', extraTaxRate: 0.06,
    currency: 'S$', locale: 'en-SG'
  },
  'United Arab Emirates': {
    states: UAE_EMIRATES, stateLabel: 'Emirate', hasStateTax: false,
    stateTaxLabel: 'Emirate Tax (est.)', brackets: [{ upTo: Infinity, rate: 0 }], firmRate: 0.09,
    extraTaxLabel: 'Corporate Tax (est.)', extraTaxBase: 'income', extraTaxRate: 0,
    currency: 'AED', locale: 'ar-AE'
  }
};

type FilingStatus = 'Single' | 'Married Filing Jointly' | 'Head of Household' | 'Married Filing Separately' | 'Firm';

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
  ],
  'Firm': [
    { upTo: Infinity, rate: 0.21 }
  ]
};

const FILING_STATUS_TO_ENUM: Record<FilingStatus, TaxEstimateFilingStatus> = {
  'Single': 'SINGLE',
  'Married Filing Jointly': 'MARRIED_FILING_JOINTLY',
  'Married Filing Separately': 'MARRIED_FILING_SEPARATELY',
  'Head of Household': 'HEAD_OF_HOUSEHOLD',
  'Firm': 'FIRM'
};

const FILING_STATUS_FROM_ENUM: Record<TaxEstimateFilingStatus, FilingStatus> = {
  SINGLE: 'Single',
  MARRIED_FILING_JOINTLY: 'Married Filing Jointly',
  MARRIED_FILING_SEPARATELY: 'Married Filing Separately',
  HEAD_OF_HOUSEHOLD: 'Head of Household',
  FIRM: 'Firm'
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
  imports: [FormsModule, TaxNotificationPanel],
  template: `
    <div class="space-y-2">
      @if (showCalcToast()) {
        <div class="fixed top-5 left-1/2 -translate-x-1/2 z-[60]">
          <div class="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20">
            <svg class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Estimated tax is successfully calculated
            <button type="button" (click)="showCalcToast.set(false)" aria-label="Dismiss" class="ml-1 text-white/80 hover:text-white cursor-pointer">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      }

      <div class="mb-6">
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Tax Estimator</h1>
        <p class="text-xs text-slate-500 mt-1">Calculate your estimated tax obligations</p>
      </div>

      @if (notifications().length > 0) {
        <!-- Floating overlay: sits above the form/page content instead of pushing layout down.
             Adjust notificationZIndex (below in the component class) to raise or lower it
             relative to other overlays such as the "calculated" toast. -->
        <div
          class="fixed top-20 right-4 sm:right-6 flex flex-col gap-3 w-[calc(100%-2rem)] max-w-sm max-h-[75vh] overflow-y-auto pr-1"
          [style.z-index]="notificationZIndex"
        >
          @for (n of notifications(); track n.id) {
            <app-tax-notification-panel
              [message]="n.message"
              [dueDate]="n.dueDate"
              (viewCalendar)="view.set('calendar')"
              (markAsDone)="dismissNotification(n.id)"
              (dismiss)="dismissNotification(n.id)"
            ></app-tax-notification-panel>
          }
        </div>
      }

      <!-- View toggle -->
      <div class="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        <button
          type="button"
          (click)="view.set('calculator')"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          [class.bg-white]="view() === 'calculator'"
          [class.shadow-sm]="view() === 'calculator'"
          [class.text-slate-900]="view() === 'calculator'"
          [class.text-slate-500]="view() !== 'calculator'"
        >
          Calculator
        </button>
        <button
          type="button"
          (click)="view.set('calendar')"
          class="px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          [class.bg-white]="view() === 'calendar'"
          [class.shadow-sm]="view() === 'calendar'"
          [class.text-slate-900]="view() === 'calendar'"
          [class.text-slate-500]="view() !== 'calendar'"
        >
          Tax Calendar
        </button>
      </div>

      @if (view() === 'calculator') {
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div class="lg:col-span-8 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h3 class="text-sm font-bold text-slate-900 mb-6">Quarterly Tax Calculator</h3>

          <form (submit)="calculate($event)" class="space-y-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Country/Region</label>
                <select [(ngModel)]="country" name="country" (change)="onCountryChange()"
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [class.text-slate-400]="!country" [class.text-slate-900]="!!country">
                  <option value="" disabled class="text-slate-400">Select country</option>
                  <option value="India" class="text-slate-900">India</option>
                  <option value="United States" class="text-slate-900">United States</option>
                  <option value="United Kingdom" class="text-slate-900">United Kingdom</option>
                  <option value="European Union" class="text-slate-900">European Union</option>
                  <option value="Japan" class="text-slate-900">Japan</option>
                  <option value="Canada" class="text-slate-900">Canada</option>
                  <option value="Australia" class="text-slate-900">Australia</option>
                  <option value="Singapore" class="text-slate-900">Singapore</option>
                  <option value="United Arab Emirates" class="text-slate-900">United Arab Emirates</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">{{ stateFieldLabel() }}</label>
                <select [(ngModel)]="stateName" name="stateName"
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [class.text-slate-400]="!stateName" [class.text-slate-900]="!!stateName">
                  <option value="" disabled class="text-slate-400">Select State</option>
                  @for (s of stateOptions(); track s.name) {
                    <option [value]="s.name" class="text-slate-900">{{ s.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Filing Status</label>
                <select [(ngModel)]="filingStatus" name="filingStatus"
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  [class.text-slate-400]="!filingStatus" [class.text-slate-900]="!!filingStatus">
                  <option value="" disabled class="text-slate-400">What describes you</option>
                  <option value="Single" class="text-slate-900">Single</option>
                  <option value="Married Filing Jointly" class="text-slate-900">Married Filing Jointly</option>
                  <option value="Head of Household" class="text-slate-900">Head of Household</option>
                  <option value="Married Filing Separately" class="text-slate-900">Married Filing Separately</option>
                  <option value="Firm" class="text-slate-900">Firm</option>
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
                    <input type="number" min="0" step="0.01" [(ngModel)]="homeOfficeDeductions" name="homeOfficeDeductions"
                      placeholder="0.00" class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            @if (formError()) {
              <p class="text-xs font-semibold text-red-500">{{ formError() }}</p>
            }

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
                <span class="text-slate-500">{{ primaryTaxLabel() }}</span>
                <span class="font-bold text-slate-800">{{ currencySymbol() }}{{ result()!.federalTax.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
              </div>
              @if (showStateTax()) {
                <div class="flex justify-between text-xs">
                  <span class="text-slate-500">{{ stateTaxLabel() }}</span>
                  <span class="font-bold text-slate-800">{{ currencySymbol() }}{{ result()!.stateTax.toLocaleString(locale(), {minimumFractionDigits: 2}) }}</span>
                </div>
              }
              <div class="flex justify-between text-xs pb-3 border-b border-slate-100">
                <span class="text-slate-500">{{ extraTaxLabel() }}</span>
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

              <div class="flex items-center justify-center gap-1.5 pt-1">
                @if (saveStatus() === 'saving') {
                  <p class="text-[11px] font-semibold text-slate-400">Saving estimate…</p>
                }
                @if (saveStatus() === 'saved') {
                  <p class="text-[11px] font-semibold text-emerald-600">Estimate saved &amp; reminder set.</p>
                }
                @if (saveStatus() === 'error') {
                  <p class="text-[11px] font-semibold text-red-500">Couldn't save the estimate. Try again.</p>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 mt-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Saved Tax Estimates</h3>
            <p class="text-xs text-slate-500 mt-1">Review your previously saved tax calculations.</p>
          </div>
          <button
            type="button"
            (click)="taxEstimateService.loadEstimates()"
            class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer"
          >
            Refresh
          </button>
        </div>

        @if (taxEstimateService.estimates().length === 0) {
          <p class="text-xs text-slate-400 py-6 text-center">No saved estimates yet. Calculate a tax estimate above to save one.</p>
        } @else {
          <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            @for (est of taxEstimateService.estimates(); track est._id ?? (est.quarter + est.dueDate + est.estimatedTax)) {
              <div class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 hover:border-blue-300 hover:bg-blue-50/40 transition-colors">
                <div class="cursor-pointer flex-1 min-w-0" (click)="loadHistoryItem(est)" title="Load this estimate back into the calculator">
                  <div class="text-sm font-semibold text-slate-900 truncate">
                    {{ est.quarter }} {{ historyYear(est) }} &ndash; {{ getCountryName(est.country) }}
                    @if (est.state) { <span class="text-slate-500 font-medium">({{ est.state }})</span> }
                  </div>
                  <div class="text-xs text-slate-500 mt-0.5">
                    Tax Due:
                    <strong class="text-slate-700">{{ getItemCurrencySymbol(est.country) }}{{ est.estimatedTax.toLocaleString(locale(), {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</strong>
                    (Gross: {{ getItemCurrencySymbol(est.country) }}{{ est.grossIncomeForQuarter.toLocaleString(locale(), {maximumFractionDigits: 0}) }})
                  </div>
                </div>
                <button
                  type="button"
                  (click)="deleteHistoryItem(est._id, $event)"
                  class="shrink-0 flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                  title="Delete Estimate"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>
      }

      @if (view() === 'calendar') {
      <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-sm font-bold text-slate-900">Tax Calendar</h3>
            <p class="text-xs text-slate-500 mt-1">Quarterly filing deadlines for {{ country || 'your region' }}</p>
          </div>
          <button
            type="button"
            (click)="toggleNotifications()"
            class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer hover:bg-slate-50"
          >
            Notifications
            <span
              class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
              [class.bg-blue-600]="notificationsEnabled()"
              [class.bg-slate-200]="!notificationsEnabled()"
            >
              <span
                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                [class.translate-x-4]="notificationsEnabled()"
                [class.translate-x-1]="!notificationsEnabled()"
              ></span>
            </span>
            <span [class.text-blue-600]="notificationsEnabled()" [class.text-slate-400]="!notificationsEnabled()">
              {{ notificationsEnabled() ? 'On' : 'Off' }}
            </span>
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          @for (entry of calendarEntries(); track entry.quarter) {
            <div
              class="rounded-2xl border p-4 flex items-start gap-4"
              [class.border-blue-200]="isNextDue(entry)"
              [class.bg-blue-50/40]="isNextDue(entry)"
              [class.border-slate-200]="!isNextDue(entry)"
            >
              <div class="shrink-0 h-11 w-11 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center leading-none">
                <span class="text-[9px] font-bold uppercase text-slate-400">{{ monthShort(entry.dueDate) }}</span>
                <span class="text-sm font-black text-slate-800">{{ entry.dueDate.getDate() }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-xs font-bold text-slate-900">{{ entry.quarter }} &middot; {{ entry.label }}</p>
                  @if (isNextDue(entry)) {
                    <span class="shrink-0 inline-flex items-center rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">Next Due</span>
                  } @else if (entry.dueDate < today) {
                    <span class="shrink-0 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-400">Past</span>
                  }
                </div>
                <p class="text-[11px] text-slate-500 mt-1">{{ entry.description }}</p>
                <p class="text-[11px] font-semibold text-slate-600 mt-2">
                  Due {{ entry.dueDate.toLocaleDateString(locale(), { month: 'long', day: 'numeric', year: 'numeric' }) }}
                  @if (isNextDue(entry)) {
                    <span class="text-blue-600">&middot; {{ daysUntil(entry.dueDate) }} days left</span>
                  }
                </p>
                <button
                  type="button"
                  (click)="toggleReminder(entry)"
                  [disabled]="isPast(entry) || !notificationsEnabled()"
                  class="mt-3 flex items-center gap-2 disabled:cursor-not-allowed"
                  [class.cursor-pointer]="!isPast(entry) && notificationsEnabled()"
                >
                  <span
                    class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0"
                    [class.bg-blue-600]="hasReminder(entry) && !isPast(entry) && notificationsEnabled()"
                    [class.bg-slate-200]="!(hasReminder(entry) && !isPast(entry) && notificationsEnabled())"
                  >
                    <span
                      class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                      [class.translate-x-4]="hasReminder(entry) && !isPast(entry) && notificationsEnabled()"
                      [class.translate-x-1]="!(hasReminder(entry) && !isPast(entry) && notificationsEnabled())"
                    ></span>
                  </span>
                  <span
                    class="text-[11px] font-bold"
                    [class.text-blue-600]="hasReminder(entry) && !isPast(entry) && notificationsEnabled()"
                    [class.text-slate-400]="!(hasReminder(entry) && !isPast(entry) && notificationsEnabled())"
                  >
                    {{ !notificationsEnabled() ? 'Notifications off' : (isPast(entry) ? 'Deadline passed' : (hasReminder(entry) ? 'Notify: On' : 'Notify: Off')) }}
                  </span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
      }
    </div>
  `
})
export class TaxEstimatorPage {
  protected readonly taxEstimateService = inject(TaxEstimateService);

  protected country: '' | CountryId = '';
  protected stateName = '';
  protected filingStatus: FilingStatus | '' = '';
  protected quarter = '';

  // Controls how high the floating tax-reminder notifications stack above the page.
  // Raise this if another overlay (e.g. a modal) needs to sit above the notifications;
  // lower it if the notifications should sit behind something else.
  protected readonly notificationZIndex = 70;

  protected grossIncome: number | null = null;
  protected businessExpenses: number | null = null;
  protected retirementContributions: number | null = null;
  protected healthInsurancePremiums: number | null = null;
  protected homeOfficeDeductions: number | null = null;

  protected readonly result = signal<TaxResult | null>(null);
  protected readonly saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  protected readonly formError = signal<string | null>(null);
  protected readonly showCalcToast = signal(false);

  protected readonly view = signal<'calculator' | 'calendar'>('calculator');
  protected readonly notifications = signal<TaxReminder[]>([]);
  protected readonly notificationsEnabled = signal(true);
  protected readonly today = new Date();

  protected calendarEntries(): CalendarEntry[] {
    const year = this.today.getFullYear();
    if (this.country === 'India') {
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

  protected createReminder(entry: CalendarEntry): void {
    if (!this.notificationsEnabled()) return;
    if (this.hasReminder(entry)) return;
    const days = this.daysUntil(entry.dueDate);
    const reminder: TaxReminder = {
      id: `${this.country}-${entry.quarter}-${entry.dueDate.getTime()}`,
      message: `Your ${entry.quarter} tax filing is due in ${days} day${days === 1 ? '' : 's'}.`,
      dueDate: entry.dueDate.toLocaleDateString(this.locale(), { month: 'short', day: 'numeric', year: 'numeric' })
    };
    this.notifications.update((list: TaxReminder[]) => [...list, reminder]);
  }

  protected toggleReminder(entry: CalendarEntry): void {
    if (this.isPast(entry)) return;
    if (this.hasReminder(entry)) {
      const id = `${this.country}-${entry.quarter}-${entry.dueDate.getTime()}`;
      this.dismissNotification(id);
    } else {
      this.createReminder(entry);
    }
  }

  protected toggleNotifications(): void {
    const next = !this.notificationsEnabled();
    this.notificationsEnabled.set(next);
    if (!next) {
      this.notifications.set([]);
    } else {
      this.checkAndAutoNotify();
    }
  }

  protected onCountryChange(): void {
    this.stateName = '';
    this.checkAndAutoNotify();
  }

  private checkAndAutoNotify(): void {
    if (!this.notificationsEnabled() || !this.country) return;
    const entries = this.calendarEntries();
    const next = entries.find(e => e.dueDate >= this.today) ?? entries[0];
    if (!next || this.hasReminder(next)) return;
    if (this.daysUntil(next.dueDate) <= 7) {
      this.createReminder(next);
    }
  }

  protected dismissNotification(id: string): void {
    this.notifications.update((list: TaxReminder[]) => list.filter((n: TaxReminder) => n.id !== id));
  }

  protected hasReminder(entry: CalendarEntry): boolean {
    const id = `${this.country}-${entry.quarter}-${entry.dueDate.getTime()}`;
    return this.notifications().some((n: TaxReminder) => n.id === id);
  }

  protected isNextDue(entry: CalendarEntry): boolean {
    const next = this.calendarEntries().find(e => e.dueDate >= this.today) ?? this.calendarEntries()[0];
    return next.quarter === entry.quarter;
  }

  protected isPast(entry: CalendarEntry): boolean {
    return entry.dueDate < this.today;
  }

  protected daysUntil(date: Date): number {
    const ms = date.getTime() - this.today.getTime();
    return Math.max(Math.ceil(ms / (1000 * 60 * 60 * 24)), 0);
  }

  protected monthShort(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short' });
  }

  private readonly indiaStates: StateOption[] = [
    { name: 'Maharashtra', rate: 0 }, { name: 'Delhi', rate: 0 }, { name: 'Karnataka', rate: 0 },
    { name: 'Tamil Nadu', rate: 0 }, { name: 'Telangana', rate: 0 }, { name: 'Gujarat', rate: 0 },
    { name: 'West Bengal', rate: 0 }, { name: 'Uttar Pradesh', rate: 0 }, { name: 'Rajasthan', rate: 0 },
    { name: 'Kerala', rate: 0 }
  ];

  constructor() {
    this.quarter = this.quarterOptions()[Math.floor((new Date().getMonth()) / 3)];
    this.taxEstimateService.loadEstimates();
    this.taxEstimateService.loadCalendar();
    this.checkAndAutoNotify();
  }


  protected stateOptions(): StateOption[] {
    if (this.country === 'India') return this.indiaStates;
    if (this.country === 'United States') return US_STATES;
    const cfg = COUNTRY_CONFIG[this.country as CountryId];
    return cfg ? cfg.states : [];
  }

  protected stateFieldLabel(): string {
    if (this.country === 'United States' || this.country === 'India') return 'State';
    const cfg = COUNTRY_CONFIG[this.country as CountryId];
    return cfg?.stateLabel ?? 'State/Province';
  }

  protected currencySymbol(): string {
    return this.currencySymbolFor(this.country);
  }

  protected locale(): string {
    if (this.country === 'India') return 'en-IN';
    if (this.country === 'United States' || !this.country) return 'en-US';
    const cfg = COUNTRY_CONFIG[this.country as CountryId];
    return cfg?.locale ?? 'en-US';
  }

  protected primaryTaxLabel(): string {
    if (this.country === 'United States' || this.country === 'Canada') return 'Federal Income Tax (est.)';
    return 'Income Tax (est.)';
  }

  protected showStateTax(): boolean {
    if (this.country === 'United States') return true;
    const cfg = COUNTRY_CONFIG[this.country as CountryId];
    return !!cfg?.hasStateTax;
  }

  protected stateTaxLabel(): string {
    const cfg = COUNTRY_CONFIG[this.country as CountryId];
    return cfg?.stateTaxLabel ?? 'State Income Tax (est.)';
  }

  protected extraTaxLabel(): string {
    if (this.country === 'India') return 'Health & Education Cess (est.)';
    if (this.country === 'United States') return 'Self-Employment Tax (est.)';
    const cfg = COUNTRY_CONFIG[this.country as CountryId];
    return cfg?.extraTaxLabel ?? 'Self-Employment Tax (est.)';
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

    if (!this.country || !this.stateName || !this.filingStatus) {
      this.formError.set('Please select country/region, state/province, and filing status before calculating.');
      return;
    }
    this.formError.set(null);

    const gross = Number(this.grossIncome) || 0;
    const deductions =
      (Number(this.businessExpenses) || 0) +
      (Number(this.retirementContributions) || 0) +
      (Number(this.healthInsurancePremiums) || 0) +
      (Number(this.homeOfficeDeductions) || 0);

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
      // Health & Education Cess: 4% of the computed income tax.
      selfEmploymentTax = federalTax * 0.04;
    } else if (this.country === 'United States') {
      const brackets = FEDERAL_BRACKETS[this.filingStatus as FilingStatus];
      const annualFederalTax = computeProgressiveTax(annualizedNet, brackets);
      federalTax = annualFederalTax / 4;

      const stateRate = this.stateOptions().find(s => s.name === this.stateName)?.rate || 0;
      stateTax = netQuarterly * stateRate;

      selfEmploymentTax = netQuarterly * SELF_EMPLOYMENT_TAX_RATE;
    } else {
      const cfg = COUNTRY_CONFIG[this.country as CountryId];
      if (cfg) {
        const brackets = (this.country === 'United Kingdom' && this.stateName === 'Scotland')
          ? UK_SCOTLAND_BRACKETS
          : cfg.brackets;

        const annualFederalTax = this.filingStatus === 'Firm'
          ? annualizedNet * cfg.firmRate
          : computeProgressiveTax(annualizedNet, brackets);
        federalTax = annualFederalTax / 4;

        if (cfg.hasStateTax) {
          const stateRate = cfg.states.find(s => s.name === this.stateName)?.rate || 0;
          stateTax = netQuarterly * stateRate;
        } else {
          stateTax = 0;
        }

        if (this.filingStatus === 'Firm') {
          selfEmploymentTax = 0;
        } else if (cfg.extraTaxBase === 'tax') {
          selfEmploymentTax = federalTax * cfg.extraTaxRate;
        } else {
          selfEmploymentTax = netQuarterly * cfg.extraTaxRate;
        }
      }
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

    this.persistEstimate(totalTax);
    this.autoCreateReminder();

    this.showCalcToast.set(true);
    setTimeout(() => this.showCalcToast.set(false), 3500);
  }

  private quarterCode(): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
    const match = this.quarter.match(/^Q[1-4]/);
    return (match?.[0] as 'Q1' | 'Q2' | 'Q3' | 'Q4') ?? 'Q1';
  }

  private dueDateForSelectedQuarter(): Date {
    const code = this.quarterCode();
    const entry = this.calendarEntries().find(e => e.quarter === code);
    return entry ? entry.dueDate : this.today;
  }

  private persistEstimate(totalTax: number): void {
    const payload: TaxEstimate = {
      country: this.country,
      quarter: this.quarterCode(),
      estimatedTax: Math.round(totalTax * 100) / 100,
      dueDate: this.dueDateForSelectedQuarter().toISOString(),
      state: this.stateName,
      filingStatus: FILING_STATUS_TO_ENUM[this.filingStatus as FilingStatus],
      grossIncomeForQuarter: Number(this.grossIncome) || 0,
      businessExpenses: Number(this.businessExpenses) || 0,
      retirementContributions: Number(this.retirementContributions) || 0,
      healthInsurancePremiums: Number(this.healthInsurancePremiums) || 0,
      homeOfficeDeductions: Number(this.homeOfficeDeductions) || 0
    };

    this.saveStatus.set('saving');
    this.taxEstimateService.saveEstimate(payload).subscribe({
      next: () => {
        this.saveStatus.set('saved');
        this.taxEstimateService.loadEstimates();
        this.checkAndAutoNotify();
      },
      error: (err: any) => {
        console.error('Failed to save tax estimate', err);
        // Some backends respond in a way the browser can't cleanly read (a 200/201/204 with
        // an empty or non-JSON body, or a response blocked by a CORS misconfiguration on
        // this specific route) even though the record was actually created server-side.
        // Rather than guessing at the exact cause, reload the canonical list from the
        // server and check whether the submission actually landed before showing an error.
        this.taxEstimateService.loadEstimates();
        setTimeout(() => {
          const justSaved = this.taxEstimateService.estimates().some(e =>
            e.quarter === payload.quarter &&
            e.country === payload.country &&
            e.state === payload.state &&
            Math.abs(e.estimatedTax - payload.estimatedTax) < 0.01
          );
          if (justSaved) {
            this.saveStatus.set('saved');
            this.checkAndAutoNotify();
          } else {
            this.saveStatus.set('error');
          }
        }, 800);
      }
    });
  }

  private autoCreateReminder(): void {
    if (!this.notificationsEnabled()) return;
    const entry = this.calendarEntries().find(e => e.quarter === this.quarterCode());
    if (!entry || this.isPast(entry) || this.hasReminder(entry)) return;
    this.createReminder(entry);
  }

  protected currencySymbolFor(country: string): string {
    switch (country) {
      case 'India': return '₹';
      case 'United Kingdom': return '£';
      case 'European Union':
      case 'Germany': return '€';
      case 'Japan': return '¥';
      case 'Canada': return 'CA$';
      case 'Australia': return 'A$';
      case 'Singapore': return 'S$';
      case 'United Arab Emirates':
      case 'UAE': return 'AED';
      default: return '$';
    }
  }

  protected filingStatusLabel(status: TaxEstimateFilingStatus): string {
    const entry = Object.entries(FILING_STATUS_TO_ENUM).find(([, v]) => v === status);
    return entry ? entry[0] : status;
  }

  protected formatSavedDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  protected deleteEstimate(id?: string): void {
    if (!id) return;
    this.taxEstimateService.deleteEstimate(id).subscribe({
      error: (err: unknown) => console.error('Failed to delete tax estimate', err)
    });
  }

  // --- Saved history helpers -------------------------------------------------
  // These back the "Saved Tax Estimates" card: display formatting (country name,
  // currency, year) plus click-to-reload and delete behavior for each row.

  /** Maps a stored country value to its display name. Estimates already store
   *  full names (e.g. "United States"), but this also tolerates legacy short
   *  codes in case older saved records used them. */
  protected getCountryName(country: string): string {
    const legacyCodes: Record<string, string> = {
      US: 'United States', IN: 'India', CA: 'Canada',
      UK: 'United Kingdom', GB: 'United Kingdom', AU: 'Australia', DE: 'Germany'
    };
    return legacyCodes[country] ?? country;
  }

  protected getItemCurrencySymbol(country: string): string {
    return this.currencySymbolFor(country);
  }

  /** A saved estimate doesn't store a year directly, so derive it from its due date. */
  protected historyYear(item: TaxEstimate): number {
    if (item.dueDate) {
      const parsed = new Date(item.dueDate);
      if (!isNaN(parsed.getTime())) return parsed.getFullYear();
    }
    return new Date().getFullYear();
  }

  /** Reloads a saved estimate's inputs back into the calculator form so the
   *  user can review or re-run it, then switches to the Calculator view. */
  protected loadHistoryItem(item: TaxEstimate): void {
    this.country = (item.country as CountryId) || '';
    this.stateName = item.state || '';
    this.filingStatus = FILING_STATUS_FROM_ENUM[item.filingStatus] ?? '';

    const code = item.quarter;
    this.quarter = this.quarterOptions().find(q => q.startsWith(code)) ?? this.quarterOptions()[0];

    this.grossIncome = item.grossIncomeForQuarter ?? null;
    this.businessExpenses = item.businessExpenses ?? null;
    this.retirementContributions = item.retirementContributions ?? null;
    this.healthInsurancePremiums = item.healthInsurancePremiums ?? null;
    this.homeOfficeDeductions = item.homeOfficeDeductions ?? null;

    this.result.set(null);
    this.formError.set(null);
    this.view.set('calculator');
  }

  /** Deletes a saved estimate without triggering the row's load-into-form click handler. */
  protected deleteHistoryItem(id: string | undefined, event: Event): void {
    event.stopPropagation();
    this.deleteEstimate(id);
  }
}
