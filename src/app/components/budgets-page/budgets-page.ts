import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Budget, Category } from '../../services/data.service';

interface BudgetProgress {
  id: string;
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentage: number;
  isOver: boolean;
  notes?: string;
}

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Title -->
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Budgets</h1>
        <p class="text-xs text-slate-500 mt-1">Set monthly category spending limits and monitor budget health.</p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-6 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div class="border-r border-slate-100 last:border-0 pr-4">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Budget</span>
          <span class="text-xl font-black text-slate-900 mt-1 block">₹{{ totalBudgetLimit().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}/mo</span>
        </div>
        <div class="border-r border-slate-100 last:border-0 pr-4 pl-0 sm:pl-4">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Currently Spent</span>
          <span class="text-xl font-black text-slate-900 mt-1 block">₹{{ totalBudgetSpent().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</span>
        </div>
        <div class="border-r border-slate-100 last:border-0 pr-4 pl-0 sm:pl-4">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
          <span class="text-xl font-black text-slate-900 mt-1 block" [class.text-red-500]="totalBudgetRemaining() < 0">
            ₹{{ totalBudgetRemaining().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}
          </span>
        </div>
        <div class="pl-0 sm:pl-4">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-semibold">Budget Health</span>
          <span 
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-1.5"
            [class.bg-emerald-50]="budgetHealth() === 'Good'"
            [class.text-emerald-700]="budgetHealth() === 'Good'"
            [class.bg-red-50]="budgetHealth() === 'Critical'"
            [class.text-red-700]="budgetHealth() === 'Critical'"
          >
            <span class="h-1.5 w-1.5 rounded-full" [class.bg-emerald-500]="budgetHealth() === 'Good'" [class.bg-red-500]="budgetHealth() === 'Critical'"></span>
            {{ budgetHealth() }}
          </span>
        </div>
      </div>

      <!-- Main Layout Section -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Create New Budget Form -->
        <div class="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
            <h3 class="text-sm font-bold text-slate-900">Create New Budget</h3>
          </div>

          <form (submit)="saveBudget($event)" class="space-y-4">
            <!-- Category -->
            <div>
              <label for="category" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category</label>
              <select 
                id="category"
                name="category"
                required
                [(ngModel)]="budgetCategory"
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select a category</option>
                @for (cat of expenseCategories(); track cat.id) {
                  <option [value]="cat.name">{{ cat.name }}</option>
                }
              </select>
            </div>

            <!-- Amount -->
            <div>
              <label for="amount" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Budget Amount</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                <input 
                  id="amount"
                  name="amount"
                  type="number" 
                  required
                  min="1"
                  [(ngModel)]="budgetAmount"
                  placeholder="0.00"
                  class="w-full pl-6 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Month picker -->
            <div>
              <label for="month" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Month</label>
              <input 
                id="month"
                name="month"
                type="month" 
                required
                [(ngModel)]="budgetMonth"
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="desc" class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description (Optional)</label>
              <textarea 
                id="desc"
                name="desc"
                rows="2"
                [(ngModel)]="budgetDescription"
                placeholder="Add any additional details..."
                class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>

            <!-- Actions buttons -->
            <div class="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button 
                type="button" 
                (click)="resetForm()" 
                class="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="px-5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer"
              >
                Create Budget
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Budgets Progress List -->
        <div class="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
          <h3 class="text-sm font-bold text-slate-900 mb-6">Budget Progress (Current Month)</h3>
          
          <div class="space-y-6">
            @for (bp of budgetProgressList(); track bp.id) {
              <div class="space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <div class="min-w-0">
                    <span class="font-bold text-slate-800 block truncate">{{ bp.category }}</span>
                    @if (bp.notes) {
                      <span class="text-[10px] text-slate-400 block truncate italic">{{ bp.notes }}</span>
                    }
                  </div>
                  <div class="text-right shrink-0">
                    <span class="font-semibold text-slate-600">₹{{ bp.spent.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</span>
                    <span class="text-slate-400"> of </span>
                    <span class="font-bold text-slate-800">₹{{ bp.limit.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</span>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    class="h-full rounded-full transition-all duration-500" 
                    [class.bg-blue-500]="!bp.isOver"
                    [class.bg-red-500]="bp.isOver"
                    [style.width.%]="Math.min(bp.percentage, 100)"
                  ></div>
                </div>

                <div class="flex items-center justify-between text-[10px]">
                  <span 
                    class="font-bold uppercase"
                    [class.text-red-500]="bp.isOver"
                    [class.text-slate-400]="!bp.isOver"
                  >
                    {{ bp.isOver ? 'Exceeded limit' : 'Good' }}
                  </span>
                  <div class="flex items-center gap-4">
                    <span class="font-medium text-slate-500">
                      {{ bp.percentage.toFixed(0) }}% spent
                    </span>
                    <button 
                      type="button" 
                      (click)="deleteBudget(bp.id)"
                      class="text-slate-300 hover:text-red-500 transition-colors cursor-pointer focus:outline-none"
                      aria-label="Delete budget"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="text-center py-16 text-slate-400 text-xs font-medium">
                No budget goals configured for this month. Create one on the left.
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `
})
export class BudgetsPage {
  protected readonly Math = Math;

  protected budgetCategory = '';
  protected budgetAmount: number | null = null;
  protected budgetMonth = new Date().toISOString().slice(0, 7);
  protected budgetDescription = '';

  constructor(private dataService: DataService) {}

  protected expenseCategories = computed<Category[]>(() => {
    return this.dataService.categories().filter(c => c.type === 'expense');
  });

  protected budgetProgressList = computed<BudgetProgress[]>(() => {
    const budgets = this.dataService.budgets();
    const transactions = this.dataService.transactions();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const activeBudgets = budgets.filter(b => b.month === currentMonth);
    
    return activeBudgets.map(b => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === b.category && t.date.startsWith(currentMonth))
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = b.limit - spent;
      const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;

      return {
        id: b.id,
        category: b.category,
        limit: b.limit,
        spent,
        remaining,
        percentage,
        isOver: spent > b.limit,
        notes: b.description
      };
    });
  });

  protected totalBudgetLimit = computed(() => {
    return this.budgetProgressList().reduce((sum, bp) => sum + bp.limit, 0);
  });

  protected totalBudgetSpent = computed(() => {
    return this.budgetProgressList().reduce((sum, bp) => sum + bp.spent, 0);
  });

  protected totalBudgetRemaining = computed(() => {
    return this.totalBudgetLimit() - this.totalBudgetSpent();
  });

  protected budgetHealth = computed<'Good' | 'Critical'>(() => {
    return this.budgetProgressList().some(bp => bp.isOver) ? 'Critical' : 'Good';
  });

  protected saveBudget(event: Event): void {
    event.preventDefault();
    if (!this.budgetCategory || !this.budgetAmount || !this.budgetMonth) return;

    this.dataService.addBudget({
      category: this.budgetCategory,
      limit: Number(this.budgetAmount),
      month: this.budgetMonth,
      description: this.budgetDescription
    });

    this.resetForm();
  }

  protected deleteBudget(id: string): void {
    if (confirm('Are you sure you want to delete this budget goal?')) {
      this.dataService.deleteBudget(id);
    }
  }

  protected resetForm(): void {
    this.budgetCategory = '';
    this.budgetAmount = null;
    this.budgetMonth = new Date().toISOString().slice(0, 7);
    this.budgetDescription = '';
  }
}
