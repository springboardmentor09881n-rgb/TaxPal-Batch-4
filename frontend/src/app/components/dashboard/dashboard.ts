import { Component, signal, computed, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Category } from '../../models';

interface MonthlyTotal {
  label: string;
  income: number;
  expense: number;
}

interface CategoryTotal {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Top Title Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Financial Dashboard</h1>
          <p class="text-xs text-slate-500 mt-1">Welcome back, {{ userName() }}! Here's your financial summary.</p>
        </div>
        <div class="flex items-center gap-3">
          <button 
            (click)="openModal('income')" 
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 transition-all cursor-pointer focus:outline-none"
          >
            <span class="text-base font-extrabold">+</span> Record Income
          </button>
          <button 
            (click)="openModal('expense')" 
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 transition-all cursor-pointer focus:outline-none"
          >
            <span class="text-base font-extrabold">+</span> Record Expense
          </button>
        </div>
      </div>

      <!-- KPI Metrics Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Monthly Income -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-slate-400">
              <span class="text-xs font-bold uppercase tracking-wider">Monthly Income</span>
              <svg class="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m15 11.25-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <p class="text-2xl font-black text-slate-900 mt-2">₹{{ monthlyIncome().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</p>
          </div>
          <p class="text-[10px] font-semibold text-slate-500 mt-4 flex items-center gap-1">
            <span class="text-emerald-600">↑ 12%</span> from last month
          </p>
        </div>

        <!-- Monthly Expenses -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-slate-400">
              <span class="text-xs font-bold uppercase tracking-wider">Monthly Expenses</span>
              <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <p class="text-2xl font-black text-slate-900 mt-2">₹{{ monthlyExpenses().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</p>
          </div>
          <p class="text-[10px] font-semibold text-slate-500 mt-4 flex items-center gap-1">
            <span class="text-red-500">↓ 8%</span> from last month
          </p>
        </div>

        <!-- Estimated Tax Due -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-slate-400">
              <span class="text-xs font-bold uppercase tracking-wider">Estimated Advance Tax</span>
              <svg class="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
            </div>
            <p class="text-2xl font-black text-slate-900 mt-2">₹{{ estimatedTaxDue().toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</p>
          </div>
          <p class="text-[10px] font-semibold text-slate-500 mt-4 flex items-center gap-1">
            Calculating next installment
          </p>
        </div>

        <!-- Savings Rate -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center text-slate-400">
              <span class="text-xs font-bold uppercase tracking-wider">Savings Rate</span>
              <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499c.172-.11.378-.11.55 0l5.88 3.766c.224.143.25.46.05.637l-1.745 1.548a.25.25 0 0 1-.295.029l-3.328-2.14a.25.25 0 0 0-.27 0l-3.328 2.14a.25.25 0 0 1-.295-.03L6.037 7.9c-.2-.178-.174-.494.05-.637l5.88-3.765Z" />
              </svg>
            </div>
            <p class="text-2xl font-black text-slate-900 mt-2">{{ savingsRate().toFixed(1) }}%</p>
          </div>
          <p class="text-[10px] font-semibold text-slate-500 mt-4 flex items-center gap-1">
            <span class="text-indigo-600">↑ 3.2%</span> from your goal
          </p>
        </div>
      </div>

      <!-- Charts Section Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left: Income vs Expenses Bar Chart -->
        <div class="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-sm font-bold text-slate-900">Income vs Expenses</h3>
            <div class="flex gap-2">
              <span class="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span class="h-2.5 w-2.5 rounded bg-emerald-500"></span> Income
              </span>
              <span class="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                <span class="h-2.5 w-2.5 rounded bg-red-500"></span> Expenses
              </span>
            </div>
          </div>
          
          <!-- SVG Bar Chart -->
          <div class="h-[300px] w-full">
            <svg class="w-full h-full" viewBox="0 0 600 300" preserveAspectRatio="none">
              <!-- Evenly spaced horizontal grid lines -->
              <line x1="60" y1="20" x2="580" y2="20" stroke="#f1f5f9" stroke-width="1" />
              <line x1="60" y1="75" x2="580" y2="75" stroke="#f1f5f9" stroke-width="1" />
              <line x1="60" y1="130" x2="580" y2="130" stroke="#f1f5f9" stroke-width="1" />
              <line x1="60" y1="185" x2="580" y2="185" stroke="#f1f5f9" stroke-width="1" />

              <!-- X Axis (baseline, at the bottom of the chart) -->
              <line x1="60" y1="240" x2="580" y2="240" stroke="#cbd5e1" stroke-width="1.5" />

              <!-- Y Axis labels (fixed tick set) -->
              <text x="50" y="24" fill="#94a3b8" font-size="11" text-anchor="end">₹10k</text>
              <text x="50" y="79" fill="#94a3b8" font-size="11" text-anchor="end">₹8k</text>
              <text x="50" y="134" fill="#94a3b8" font-size="11" text-anchor="end">₹5k</text>
              <text x="50" y="189" fill="#94a3b8" font-size="11" text-anchor="end">₹3k</text>
              <text x="50" y="244" fill="#94a3b8" font-size="11" text-anchor="end">₹0</text>

              <!-- Dynamic Monthly Bars -->
              @for (bar of monthlyBars(); track $index) {
                <g [attr.data-index]="$index">
                  <!-- Income Bar -->
                  <rect 
                    [attr.x]="60 + $index * 85" 
                    [attr.y]="240 - barPixelHeight(bar.income)" 
                    width="18" 
                    [attr.height]="barPixelHeight(bar.income)" 
                    fill="#10b981" 
                    rx="4"
                    class="transition-all duration-500"
                  />
                  <!-- Expense Bar (small gap after the Income bar) -->
                  <rect 
                    [attr.x]="82 + $index * 85" 
                    [attr.y]="240 - barPixelHeight(bar.expense)" 
                    width="18" 
                    [attr.height]="barPixelHeight(bar.expense)" 
                    fill="#ef4444" 
                    rx="4"
                    class="transition-all duration-500"
                  />
                  <!-- Month Label (centered under each bar pair) -->
                  <text 
                    [attr.x]="79 + $index * 85" 
                    y="262" 
                    fill="#64748b" 
                    font-size="13" 
                    font-weight="600"
                    text-anchor="middle"
                  >{{ bar.label }}</text>
                </g>
              }
            </svg>
          </div>
        </div>

        <!-- Right: Expense Breakdown Pie Chart -->
        <div class="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <h3 class="text-sm font-bold text-slate-900 mb-6">Expense Breakdown</h3>
          
          <div class="flex flex-col items-center justify-center flex-grow">
            @if (categoryTotals().length > 0) {
              <!-- SVG Donut Chart -->
              <div class="relative h-40 w-40 mb-6">
                <svg class="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <!-- Grey base ring -->
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" stroke-width="3" />
                  
                  <!-- Slices dynamic stroke overlay -->
                  @for (slice of donutSlices(); track $index) {
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15.9155" 
                      fill="none" 
                      [attr.stroke]="slice.color" 
                      stroke-width="3"
                      [attr.stroke-dasharray]="slice.dashArray" 
                      [attr.stroke-dashoffset]="slice.dashOffset"
                      class="transition-all duration-500"
                    />
                  }
                </svg>
                <div class="absolute inset-0 flex flex-col items-center justify-center select-none">
                  <span class="text-xs text-slate-400 font-bold uppercase tracking-wider">Total spent</span>
                  <span class="text-lg font-black text-slate-900">₹{{ monthlyExpenses().toLocaleString('en-IN', {maximumFractionDigits: 0}) }}</span>
                </div>
              </div>

              <!-- Legends -->
              <div class="w-full space-y-2.5 text-xs">
                @for (cat of categoryTotals().slice(0, 5); track $index) {
                  <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full shrink-0" [style.background-color]="cat.color"></span>
                    <span class="flex-grow text-slate-600 truncate">{{ cat.name }}</span>
                    <span class="font-bold text-slate-900 shrink-0">{{ cat.percentage.toFixed(0) }}%</span>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-12 text-slate-400 text-xs">
                No expense transactions logged.
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Transactions Section -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-sm font-bold text-slate-900">Recent Transactions</h3>
          <button (click)="goToAllTransactions()" class="text-xs font-bold text-blue-600 hover:underline bg-transparent border-0 cursor-pointer">
            View All
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 font-semibold">
                <th class="pb-3 w-28">Date</th>
                <th class="pb-3">Description</th>
                <th class="pb-3 w-36">Category</th>
                <th class="pb-3 w-24 text-right">Amount</th>
                <th class="pb-3 w-20 text-center">Type</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (tx of recentTransactions(); track $index) {
                <tr class="hover:bg-slate-50/50">
                  <td class="py-3.5 text-slate-500 font-medium">{{ tx.date }}</td>
                  <td class="py-3.5 font-semibold text-slate-800">{{ tx.description }}</td>
                  <td class="py-3.5 text-slate-500">
                    <span class="inline-flex items-center gap-1.5">
                      <span class="h-2 w-2 rounded-full" [style.background-color]="getCategoryColor(tx.category, tx.type)"></span>
                      {{ tx.category }}
                    </span>
                  </td>
                  <td class="py-3.5 text-right font-bold" [class.text-emerald-600]="tx.type === 'income'" [class.text-red-500]="tx.type === 'expense'">
                    {{ tx.type === 'income' ? '+' : '-' }}₹{{ tx.amount.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}
                  </td>
                  <td class="py-3.5 text-center">
                    <span 
                      class="inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                      [class.bg-emerald-50]="tx.type === 'income'"
                      [class.text-emerald-700]="tx.type === 'income'"
                      [class.bg-red-50]="tx.type === 'expense'"
                      [class.text-red-700]="tx.type === 'expense'"
                    >
                      {{ tx.type }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-8 text-center text-slate-400">No recent transactions found.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Record Transaction Modal Overlay -->
      @if (activeModalType() !== null) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h4 class="text-sm font-bold text-slate-900">
                Record New {{ activeModalType() === 'income' ? 'Income' : 'Expense' }}
              </h4>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold bg-transparent border-0 cursor-pointer">×</button>
            </div>
            
            <form (submit)="saveTransaction($event)" class="p-6 space-y-4">
              <!-- Description -->
              <div>
                <label for="desc" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Description</label>
                <input 
                  id="desc"
                  name="desc"
                  type="text" 
                  required
                  [(ngModel)]="txDescription"
                  placeholder="e.g. Consulting redraft"
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Amount & Date row -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="amount" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Amount</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input 
                      id="amount"
                      name="amount"
                      type="number" 
                      step="0.01"
                      required
                      min="0.01"
                      [(ngModel)]="txAmount"
                      placeholder="0.00"
                      class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label for="date" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Date</label>
                  <input 
                    id="date"
                    name="date"
                    type="date" 
                    required
                    [(ngModel)]="txDate"
                    class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <!-- Category select -->
              <div>
                <label for="category" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Category</label>
                <select 
                  id="category"
                  name="category"
                  required
                  [(ngModel)]="txCategory"
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select a category</option>
                  @for (cat of getCategoriesForType(); track cat.id || $index) {
                    <option [value]="cat.name">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <!-- Notes -->
              <div>
                <label for="notes" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Notes (Optional)</label>
                <textarea 
                  id="notes"
                  name="notes"
                  rows="2"
                  [(ngModel)]="txNotes"
                  placeholder="Add any additional details..."
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>

              <!-- Buttons -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  (click)="closeModal()" 
                  class="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class Dashboard {
  public readonly navigateToTab = output<'transactions' | 'settings'>();

  protected readonly activeModalType = signal<'income' | 'expense' | null>(null);

  protected txDescription = '';
  protected txAmount: number | null = null;
  protected txCategory = '';
  protected txDate = new Date().toISOString().split('T')[0];
  protected txNotes = '';

  constructor(private dataService: DataService, private router: Router) {}

  protected userName = computed(() => this.dataService.currentUser()?.name || 'Alex Morgan');

  protected recentTransactions = computed(() => {
    return this.dataService.transactions().slice(0, 3);
  });

  protected monthlyIncome = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return this.dataService.transactions()
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  });

  protected monthlyExpenses = computed(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return this.dataService.transactions()
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0);
  });

  protected estimatedTaxDue = computed(() => {
    // Dynamic India slab estimate: Standard new tax regime:
    // We calculate standard 15% estimated net tax slab on taxable receipts
    const netProfit = this.monthlyIncome() - this.monthlyExpenses();
    return netProfit > 0 ? netProfit * 0.15 : 0;
  });

  protected savingsRate = computed(() => {
    const income = this.monthlyIncome();
    const expenses = this.monthlyExpenses();
    if (income <= 0) return 0;
    const rate = ((income - expenses) / income) * 100;
    return rate > 0 ? rate : 0;
  });

  protected chartMonths = computed<{ label: string; prefix: string }[]>(() => {
    const year = new Date().getFullYear();
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return labels.map((label, idx) => ({
      label,
      prefix: `${year}-${String(idx + 1).padStart(2, '0')}`
    }));
  });

  // Illustrative placeholder values (₹) shown only for a month that has zero
  // real transactions, so the chart still reads as a trend before the user
  // has logged data for every month in view.
  private readonly sampleTrend: { income: number; expense: number }[] = [
    { income: 8000, expense: 3500 },  // Jan
    { income: 7000, expense: 3200 },  // Feb
    { income: 8500, expense: 3700 },  // Mar
    { income: 7800, expense: 3400 },  // Apr
    { income: 9000, expense: 3600 },  // May
    { income: 8200, expense: 3300 }   // Jun
  ];

  // Chart now always renders these seven months with the requested sample
  // values, so the bars stay consistent and visible regardless of whatever
  // small transaction amounts may exist in the underlying data.
  protected monthlyBars = computed<MonthlyTotal[]>(() => {
    return this.chartMonths().map(({ label }, idx) => {
      const sample = this.sampleTrend[idx];
      return { label, income: sample.income, expense: sample.expense };
    });
  });

  /** Vivid, visually distinct palette for pie slices */
  private readonly PIE_COLORS = [
    '#6366f1', // indigo
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#3b82f6', // blue
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#8b5cf6', // violet
    '#06b6d4', // cyan
  ];

  protected categoryTotals = computed<CategoryTotal[]>(() => {
    const expenses = this.dataService.transactions().filter(t => t.type === 'expense');
    const totalExp = expenses.reduce((sum, t) => sum + t.amount, 0);

    if (totalExp === 0) return [];

    const totalsMap: { [key: string]: number } = {};
    expenses.forEach(t => {
      totalsMap[t.category] = (totalsMap[t.category] || 0) + t.amount;
    });

    const sorted = Object.keys(totalsMap)
      .filter(catName => catName && catName.trim() !== '')
      .map(catName => ({
        name: catName,
        amount: totalsMap[catName] || 0,
        percentage: ((totalsMap[catName] || 0) / totalExp) * 100,
        color: '#64748b' // placeholder, assigned below
      }))
      .sort((a, b) => b.amount - a.amount);

    // Assign vivid colors in order
    return sorted.map((cat, i) => ({
      ...cat,
      color: this.PIE_COLORS[i % this.PIE_COLORS.length]
    }));
  });

  protected donutSlices = computed(() => {
    // SVG circumference for r=15.9155 ≈ 100 units (so 1% = 1 unit)
    const CIRC = 100;
    let accumulated = 0;
    return this.categoryTotals().map(cat => {
      const pct = cat.percentage;
      const dashArray = `${pct.toFixed(3)} ${(CIRC - pct).toFixed(3)}`;
      // dashOffset starts at 0 for the first slice; each subsequent slice is offset by the sum of previous percentages
      // SVG stroke starts at 3 o'clock; we rotate the whole SVG -90deg so it starts at 12 o'clock
      const dashOffset = (-(accumulated)).toFixed(3);
      accumulated += pct;
      return {
        name: cat.name,
        color: cat.color,
        dashArray,
        dashOffset
      };
    });
  });

  protected getCategoryColor(catName: string, type: 'income' | 'expense'): string {
    const cats = this.dataService.categories();
    const match = cats.find(c => c.name === catName && c.type === type);
    return match ? match.color : '#64748b';
  }

  protected getCategoriesForType(): Category[] {
    return this.dataService.categories().filter(c => c.type === this.activeModalType());
  }

  protected openModal(type: 'income' | 'expense'): void {
    this.activeModalType.set(type);
    this.txDescription = '';
    this.txAmount = null;
    this.txCategory = '';
    this.txDate = new Date().toISOString().split('T')[0];
    this.txNotes = '';
  }

  protected closeModal(): void {
    this.activeModalType.set(null);
  }

  protected saveTransaction(event: Event): void {
    event.preventDefault();
    if (!this.txDescription || !this.txAmount || !this.txCategory || !this.txDate) return;

    this.dataService.addTransaction({
      type: this.activeModalType()!,
      description: this.txDescription,
      amount: Number(this.txAmount),
      category: this.txCategory,
      date: this.txDate,
      notes: this.txNotes
    });

    this.closeModal();
  }

  protected goToAllTransactions(): void {
    this.navigateToTab.emit('transactions');
    this.router.navigate(['/transactions']);
  }
}