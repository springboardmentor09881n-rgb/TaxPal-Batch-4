import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Category } from '../../models';

interface BudgetRow {
  id: string;
  category: string;
  color: string;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: 'On Track' | 'Near Limit' | 'Over Budget';
}

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Title bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Budgets</h1>
          <p class="text-xs text-slate-500 mt-1">Set monthly limits and track your spending by category.</p>
        </div>
        <button
          (click)="openCreateModal()"
          class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 transition-all cursor-pointer focus:outline-none"
        >
          <span class="text-base font-extrabold">+</span> Create New Budget
        </button>
      </div>

      <!-- KPI strip -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Budgeted</span>
          <p class="text-xl font-black text-slate-900 mt-2">₹{{ totalBudgeted().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
          <p class="text-xl font-black text-red-500 mt-2">₹{{ totalSpent().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining</span>
          <p class="text-xl font-black text-emerald-600 mt-2">₹{{ totalRemaining().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Budget Health</span>
          <p class="text-xl font-black mt-2"
             [class.text-emerald-600]="budgetHealth() === 'Good'"
             [class.text-amber-500]="budgetHealth() === 'Watch'"
             [class.text-red-500]="budgetHealth() === 'At Risk'"
          >{{ budgetHealth() }}</p>
        </div>
      </div>

      <!-- Budgets table -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 font-semibold">
                <th class="pb-3">Category</th>
                <th class="pb-3 w-28 text-right">Budget</th>
                <th class="pb-3 w-28 text-right">Spent</th>
                <th class="pb-3 w-28 text-right">Remaining</th>
                <th class="pb-3 w-48">Status</th>
                <th class="pb-3 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (b of budgetRows(); track b.id) {
                <tr class="hover:bg-slate-50/50 align-top">
                  <td class="py-3.5 font-semibold text-slate-800">
                    <span class="inline-flex items-center gap-2">
                      <span class="h-2.5 w-2.5 rounded-full shrink-0" [style.background-color]="b.color"></span>
                      {{ b.category }}
                    </span>
                  </td>
                  <td class="py-3.5 text-right font-bold text-slate-800">₹{{ b.limit.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</td>
                  <td class="py-3.5 text-right font-bold text-slate-500">₹{{ b.spent.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</td>
                  <td class="py-3.5 text-right font-bold" [class.text-red-500]="b.remaining < 0" [class.text-emerald-600]="b.remaining >= 0">
                    ₹{{ b.remaining.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}
                  </td>
                  <td class="py-3.5">
                    <div class="flex items-center gap-2">
                      <div class="h-1.5 flex-grow rounded-full bg-slate-100 overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          [class.bg-emerald-500]="b.status === 'On Track'"
                          [class.bg-amber-500]="b.status === 'Near Limit'"
                          [class.bg-red-500]="b.status === 'Over Budget'"
                          [style.width.%]="Math.min(b.percentUsed, 100)"
                        ></div>
                      </div>
                      <span
                        class="shrink-0 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full"
                        [class.bg-emerald-50]="b.status === 'On Track'"
                        [class.text-emerald-700]="b.status === 'On Track'"
                        [class.bg-amber-50]="b.status === 'Near Limit'"
                        [class.text-amber-700]="b.status === 'Near Limit'"
                        [class.bg-red-50]="b.status === 'Over Budget'"
                        [class.text-red-700]="b.status === 'Over Budget'"
                      >{{ b.status }}</span>
                    </div>
                  </td>
                  <td class="py-3.5 text-center">
                    <button
                      (click)="deleteBudget(b.id)"
                      class="text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-0 focus:outline-none"
                      aria-label="Delete budget"
                    >
                      <svg class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-8 text-center text-slate-400">No budgets set for this month yet.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Budget Modal -->
      @if (showCreateModal()) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h4 class="text-sm font-bold text-slate-900">Create New Budget</h4>
              <button (click)="closeCreateModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold bg-transparent border-0 cursor-pointer">×</button>
            </div>

            <form (submit)="saveBudget($event)" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="bcategory" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Category</label>
                  <select
                    id="bcategory" name="bcategory" required
                    [(ngModel)]="newCategory"
                    class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select a category</option>
                    @for (cat of expenseCategories(); track cat.id) {
                      <option [value]="cat.name">{{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label for="blimit" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Budget Amount</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      id="blimit" name="blimit" type="number" step="0.01" min="0.01" required
                      [(ngModel)]="newLimit"
                      placeholder="0.00"
                      class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label for="bmonth" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Month</label>
                <input
                  id="bmonth" name="bmonth" type="month" required
                  [(ngModel)]="newMonth"
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label for="bdesc" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Description (Optional)</label>
                <textarea
                  id="bdesc" name="bdesc" rows="3"
                  [(ngModel)]="newDescription"
                  placeholder="Add any additional details..."
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" (click)="closeCreateModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer">
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class BudgetsPage {
  protected readonly Math = Math;
  protected readonly showCreateModal = signal(false);

  protected newCategory = '';
  protected newLimit: number | null = null;
  protected newMonth = new Date().toISOString().slice(0, 7);
  protected newDescription = '';

  constructor(private dataService: DataService) {}

  protected expenseCategories = computed<Category[]>(() =>
    this.dataService.categories().filter(c => c.type === 'expense')
  );

  protected currentMonth = computed(() => new Date().toISOString().slice(0, 7));

  protected budgetRows = computed<BudgetRow[]>(() => {
    const month = this.currentMonth();
    const budgets = this.dataService.budgets().filter(b => b.month === month);
    const transactions = this.dataService.transactions().filter(t => t.type === 'expense' && t.date.startsWith(month));
    const categories = this.dataService.categories();

    return budgets.map(b => {
      const spent = transactions.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
      const remaining = b.limit - spent;
      const percentUsed = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      let status: BudgetRow['status'] = 'On Track';
      if (percentUsed >= 100) status = 'Over Budget';
      else if (percentUsed >= 80) status = 'Near Limit';

      const catObj = categories.find(c => c.name === b.category && c.type === 'expense');

      return {
        id: b.id,
        category: b.category,
        color: catObj ? catObj.color : '#64748b',
        limit: b.limit,
        spent,
        remaining,
        percentUsed,
        status
      };
    }).sort((a, b) => b.percentUsed - a.percentUsed);
  });

  protected totalBudgeted = computed(() => this.budgetRows().reduce((s, b) => s + b.limit, 0));
  protected totalSpent = computed(() => this.budgetRows().reduce((s, b) => s + b.spent, 0));
  protected totalRemaining = computed(() => this.totalBudgeted() - this.totalSpent());

  protected budgetHealth = computed<'Good' | 'Watch' | 'At Risk'>(() => {
    const rows = this.budgetRows();
    if (rows.length === 0) return 'Good';
    const overCount = rows.filter(b => b.status === 'Over Budget').length;
    const nearCount = rows.filter(b => b.status === 'Near Limit').length;
    if (overCount > 0) return 'At Risk';
    if (nearCount > 0) return 'Watch';
    return 'Good';
  });

  protected openCreateModal(): void {
    this.newCategory = '';
    this.newLimit = null;
    this.newMonth = this.currentMonth();
    this.newDescription = '';
    this.showCreateModal.set(true);
  }

  protected closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  protected saveBudget(event: Event): void {
    event.preventDefault();
    if (!this.newCategory || !this.newLimit || !this.newMonth) return;

    this.dataService.addBudget({
      category: this.newCategory,
      limit: Number(this.newLimit),
      month: this.newMonth,
      description: this.newDescription || undefined
    });

    this.closeCreateModal();
  }

  protected deleteBudget(id: string): void {
    this.dataService.deleteBudget(id);
  }
}
