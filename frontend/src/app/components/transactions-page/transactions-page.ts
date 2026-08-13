import { Component, computed, signal, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models';
import { CurrencyFormatterDirective } from '../../directives/currency-formatter.directive';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [FormsModule, CurrencyFormatterDirective],
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .fade-in { animation: fadeInUp 0.25s ease both; }
  `],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p class="text-xs text-slate-500 mt-1">All your income and expense records in one place.</p>
        </div>
        <div class="flex items-center gap-3">
          <button
            (click)="openModal('income')"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 transition-all cursor-pointer focus:outline-none shadow-sm"
          >
            <span class="text-base font-extrabold leading-none">+</span> Record Income
          </button>
          <button
            (click)="openModal('expense')"
            class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all cursor-pointer focus:outline-none shadow-sm"
          >
            <span class="text-base font-extrabold leading-none">+</span> Record Expense
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Total Income -->
        <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4">
          <div class="h-11 w-11 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <svg class="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m15 11.25-3-3m0 0-3 3m3-3v7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</p>
            <p class="text-xl font-black text-emerald-600">₹{{ totalIncome().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</p>
          </div>
        </div>
        <!-- Total Expenses -->
        <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4">
          <div class="h-11 w-11 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m9 12.75 3 3m0 0 3-3m-3 3v-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
            <p class="text-xl font-black text-red-500">₹{{ totalExpenses().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</p>
          </div>
        </div>
        <!-- Net Balance -->
        <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 flex items-center gap-4">
          <div class="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
            [class.bg-blue-100]="netBalance() >= 0"
            [class.bg-orange-100]="netBalance() < 0">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"
              [class.text-blue-600]="netBalance() >= 0"
              [class.text-orange-500]="netBalance() < 0">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879-.659c1.171-.879 3.07-.879 4.242 0 1.172.879 1.172 2.303 0 3.182C13.536 21.371 12.36 21 12 21M12 3c.36 0 1.536.371 2.121.758 1.172.879 1.172 2.303 0 3.182-1.172.879-3.07.879-4.242 0-.879-.659-.879-2.083 0-2.742" />
            </svg>
          </div>
          <div>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Balance</p>
            <p class="text-xl font-black"
              [class.text-blue-600]="netBalance() >= 0"
              [class.text-orange-500]="netBalance() < 0">
              {{ netBalance() >= 0 ? '+' : '' }}₹{{ netBalance().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search -->
          <div class="relative flex-grow">
            <svg class="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search by description or category..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>
          <!-- Type Filter -->
          <select
            [(ngModel)]="typeFilter"
            class="px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 font-medium min-w-[140px]"
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
          <!-- Count label -->
          <div class="flex items-center text-xs text-slate-400 font-medium px-2 whitespace-nowrap">
            {{ filteredTransactions().length }} records
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th class="px-6 py-4 w-32">Date</th>
                <th class="px-6 py-4">Description</th>
                <th class="px-6 py-4 w-40">Category</th>
                <th class="px-6 py-4 w-28 text-center">Type</th>
                <th class="px-6 py-4 w-32 text-right">Amount</th>
                <th class="px-6 py-4 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (tx of filteredTransactions(); track tx.id) {
                <tr class="hover:bg-slate-50/60 transition-colors group fade-in">
                  <td class="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{{ formatDate(tx.date) }}</td>
                  <td class="px-6 py-4">
                    <div class="font-semibold text-slate-800">{{ tx.description }}</div>
                    @if (tx.notes) {
                      <div class="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{{ tx.notes }}</div>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1.5 text-slate-600">
                      <span class="h-2 w-2 rounded-full shrink-0" [style.background-color]="getCategoryColor(tx.category, tx.type)"></span>
                      {{ tx.category }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span
                      class="inline-block text-[9px] font-bold uppercase px-2.5 py-1 rounded-full"
                      [class.bg-emerald-50]="tx.type === 'income'"
                      [class.text-emerald-700]="tx.type === 'income'"
                      [class.border]="true"
                      [class.border-emerald-200]="tx.type === 'income'"
                      [class.bg-red-50]="tx.type === 'expense'"
                      [class.text-red-700]="tx.type === 'expense'"
                      [class.border-red-200]="tx.type === 'expense'"
                    >
                      {{ tx.type === 'income' ? '↑ Income' : '↓ Expense' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right font-bold text-sm whitespace-nowrap"
                    [class.text-emerald-600]="tx.type === 'income'"
                    [class.text-red-500]="tx.type === 'expense'">
                    {{ tx.type === 'income' ? '+' : '-' }}₹{{ tx.amount.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}
                  </td>
                  <td class="px-6 py-4 text-center">
                    <button
                      (click)="deleteTransaction(tx.id)"
                      class="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 focus:outline-none opacity-0 group-hover:opacity-100"
                      title="Delete transaction"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-16 text-center">
                    <div class="flex flex-col items-center gap-3 text-slate-400">
                      <svg class="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                      </svg>
                      <p class="text-sm font-semibold text-slate-400">No transactions found.</p>
                      <p class="text-xs text-slate-300">Try adjusting your filters or add a new transaction.</p>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Record Transaction Modal -->
    @if (activeModalType() !== null) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden fade-in">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4"
            [class.bg-emerald-50]="activeModalType() === 'income'"
            [class.bg-red-50]="activeModalType() === 'expense'">
            <h4 class="text-sm font-bold"
              [class.text-emerald-800]="activeModalType() === 'income'"
              [class.text-red-800]="activeModalType() === 'expense'">
              {{ activeModalType() === 'income' ? '↑ Record New Income' : '↓ Record New Expense' }}
            </h4>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 text-xl font-bold bg-transparent border-0 cursor-pointer leading-none">×</button>
          </div>

          <form (submit)="saveTransaction($event)" class="p-6 space-y-4">
            <!-- Description -->
            <div>
              <label for="tx-desc" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Description</label>
              <input
                id="tx-desc" name="tx-desc" type="text" required
                [(ngModel)]="txDescription"
                (ngModelChange)="onDescriptionChange($event)"
                placeholder="e.g. Client payment, Office rent..."
                class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Amount & Date -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="tx-amount" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Amount (₹)</label>
                <div class="relative">
                  <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    id="tx-amount" name="tx-amount" type="text" appCurrencyFormatter required
                    [(ngModel)]="txAmount"
                    placeholder="0.00"
                    class="w-full pl-7 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label for="tx-date" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Date</label>
                <input
                  id="tx-date" name="tx-date" type="date" required
                  [(ngModel)]="txDate"
                  class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Category -->
            <div>
              <label for="tx-category" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Category</label>
              <select
                id="tx-category" name="tx-category" required
                [(ngModel)]="txCategory"
                (change)="onCategoryManualChange()"
                class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>Select a category</option>
                @for (cat of categoriesForType(); track cat.name) {
                  <option [value]="cat.name">{{ cat.name }}</option>
                }
              </select>
            </div>

            <!-- Notes -->
            <div>
              <label for="tx-notes" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
              <textarea
                id="tx-notes" name="tx-notes" rows="2"
                [(ngModel)]="txNotes"
                placeholder="Add any additional details..."
                class="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>

            <!-- Buttons -->
            <div class="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button" (click)="closeModal()"
                class="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 cursor-pointer transition-colors"
              >Cancel</button>
              <button
                type="submit"
                class="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer transition-colors"
                [class.bg-emerald-600]="activeModalType() === 'income'"
                [class.hover:bg-emerald-500]="activeModalType() === 'income'"
                [class.bg-red-600]="activeModalType() === 'expense'"
                [class.hover:bg-red-500]="activeModalType() === 'expense'"
              >
                Save {{ activeModalType() === 'income' ? 'Income' : 'Expense' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class TransactionsPageComponent implements OnInit {
  protected searchQuery = '';
  protected typeFilter: 'all' | 'income' | 'expense' = 'all';

  protected readonly activeModalType = signal<'income' | 'expense' | null>(null);
  protected txDescription = '';
  protected txAmount: number | null = null;
  protected txCategory = '';
  protected txDate = new Date().toISOString().split('T')[0];
  protected txNotes = '';

  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef);

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.categoryService.loadCategories();
  }

  protected totalIncome = computed(() =>
    this.dataService.transactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  protected totalExpenses = computed(() =>
    this.dataService.transactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  protected netBalance = computed(() => this.totalIncome() - this.totalExpenses());

  protected filteredTransactions = computed(() => {
    let txs = this.dataService.transactions();
    if (this.typeFilter !== 'all') {
      txs = txs.filter(t => t.type === this.typeFilter);
    }
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      txs = txs.filter(t =>
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.notes || '').toLowerCase().includes(q)
      );
    }
    // Sort newest first
    return [...txs].sort((a, b) => b.date.localeCompare(a.date));
  });

  protected formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected getCategoryColor(catName: string, type: 'income' | 'expense'): string {
    // Check backend categories first, then localStorage
    const allCats = [
      ...this.categoryService.categories(),
      ...this.dataService.categories()
    ];
    const match = allCats.find(c => c.name === catName && c.type === type);
    return match ? match.color : (type === 'income' ? '#10b981' : '#ef4444');
  }

  protected categoriesForType = computed(() => {
    const type = this.activeModalType();
    if (!type) return [];

    const serviceCats = this.categoryService.mergedCategories(type);
    const localCats = this.dataService.categories().filter(c => c.type === type);

    const seen = new Set<string>();
    const result: Category[] = [];

    for (const c of [...serviceCats, ...localCats]) {
      const key = c.name.trim().toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(c);
      }
    }
    return result;
  });

  private isCategoryManuallyTouched = false;
  private debounceTimer: any = null;

  protected openModal(type: 'income' | 'expense'): void {
    this.activeModalType.set(type);
    this.txDescription = '';
    this.txAmount = null;
    this.txCategory = '';
    this.txDate = new Date().toISOString().split('T')[0];
    this.txNotes = '';
    this.isCategoryManuallyTouched = false;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }

  protected closeModal(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.activeModalType.set(null);
  }

  protected onDescriptionChange(val: string): void {
    this.txDescription = val;
    if (this.isCategoryManuallyTouched) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    if (!val || !val.trim()) {
      this.txCategory = '';
      this.cdr.markForCheck();
      return;
    }

    this.debounceTimer = setTimeout(() => {
      const type = this.activeModalType();
      if (!type) return;

      const suggestion = this.categoryService.suggestCategory(val, type);
      if (suggestion) {
        this.txCategory = suggestion;
        this.cdr.markForCheck();
      }
    }, 400);
  }

  protected onCategoryManualChange(): void {
    this.isCategoryManuallyTouched = true;
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

  protected deleteTransaction(id: string): void {
    this.dataService.deleteTransaction(id);
  }
}
