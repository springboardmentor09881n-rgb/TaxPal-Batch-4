import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Category, Transaction } from '../../models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Title bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
          <p class="text-xs text-slate-500 mt-1">All your recorded income and expenses in one place.</p>
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

      <!-- KPI strip -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Income</span>
          <p class="text-xl font-black text-emerald-600 mt-2">₹{{ totalIncome().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Expenses</span>
          <p class="text-xl font-black text-red-500 mt-2">₹{{ totalExpense().toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</p>
        </div>
        <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Net Balance</span>
          <p class="text-xl font-black text-slate-900 mt-2">₹{{ (totalIncome() - totalExpense()).toLocaleString('en-IN', {minimumFractionDigits: 2}) }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Search</label>
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Search by description or notes..."
              class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Type</label>
            <select [ngModel]="filterType()" (ngModelChange)="filterType.set($event)" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Category</label>
            <select [ngModel]="filterCategory()" (ngModelChange)="filterCategory.set($event)" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Categories</option>
              @for (cat of allCategoryNames(); track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- Transactions table -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-100 text-slate-400 font-semibold">
                <th class="pb-3 w-28">Date</th>
                <th class="pb-3">Description</th>
                <th class="pb-3 w-40">Category</th>
                <th class="pb-3 w-28 text-right">Amount</th>
                <th class="pb-3 w-20 text-center">Type</th>
                <th class="pb-3 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (tx of filteredTransactions(); track tx.id) {
                <tr class="hover:bg-slate-50/50">
                  <td class="py-3.5 text-slate-500 font-medium">{{ tx.date }}</td>
                  <td class="py-3.5 font-semibold text-slate-800">
                    {{ tx.description }}
                    @if (tx.notes) {
                      <p class="text-[10px] font-normal text-slate-400 mt-0.5">{{ tx.notes }}</p>
                    }
                  </td>
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
                  <td class="py-3.5 text-center">
                    <div class="flex items-center justify-center gap-3">
                      <button
                        (click)="openEditModal(tx)"
                        class="text-slate-400 hover:text-blue-600 cursor-pointer bg-transparent border-0 focus:outline-none"
                        aria-label="Edit transaction"
                      >
                        <svg class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                      <button
                        (click)="deleteTransaction(tx.id)"
                        class="text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-0 focus:outline-none"
                        aria-label="Delete transaction"
                      >
                        <svg class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-8 text-center text-slate-400">No transactions match your filters.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Record Transaction Modal -->
      @if (activeModalType() !== null) {
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h4 class="text-sm font-bold text-slate-900">
                {{ editingTransactionId() ? 'Edit ' : 'Record New ' }}{{ activeModalType() === 'income' ? 'Income' : 'Expense' }}
              </h4>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 text-lg font-bold bg-transparent border-0 cursor-pointer">×</button>
            </div>

            <form (submit)="saveTransaction($event)" class="p-6 space-y-4">
              <div>
                <label for="desc" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Description</label>
                <input
                  id="desc" name="desc" type="text" required
                  [(ngModel)]="txDescription"
                  placeholder="e.g. Consulting retainer"
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label for="amount" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Amount</label>
                  <div class="relative">
                    <span class="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">₹</span>
                    <input
                      id="amount" name="amount" type="number" step="0.01" required min="0.01"
                      [(ngModel)]="txAmount"
                      placeholder="0.00"
                      class="w-full pl-7 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label for="date" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Date</label>
                  <input
                    id="date" name="date" type="date" required
                    [(ngModel)]="txDate"
                    class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label for="category" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Category</label>
                <select
                  id="category" name="category" required
                  [(ngModel)]="txCategory"
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select a category</option>
                  @for (cat of getCategoriesForType(); track cat.id || $index) {
                    <option [value]="cat.name">{{ cat.name }}</option>
                  }
                </select>
              </div>

              <div>
                <label for="notes" class="block text-xs font-semibold text-slate-600 uppercase mb-2">Notes (Optional)</label>
                <textarea
                  id="notes" name="notes" rows="2"
                  [(ngModel)]="txNotes"
                  placeholder="Add any additional details..."
                  class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
              </div>

              <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" (click)="closeModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer">
                  {{ editingTransactionId() ? 'Save Changes' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class TransactionsPage {
  protected readonly activeModalType = signal<'income' | 'expense' | null>(null);
  protected readonly editingTransactionId = signal<string | null>(null);

  protected readonly searchTerm = signal('');
  protected readonly filterType = signal<'all' | 'income' | 'expense'>('all');
  protected readonly filterCategory = signal('all');

  protected txDescription = '';
  protected txAmount: number | null = null;
  protected txCategory = '';
  protected txDate = new Date().toISOString().split('T')[0];
  protected txNotes = '';

  constructor(private dataService: DataService) {}

  protected totalIncome = computed(() =>
    this.dataService.transactions().filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  );

  protected totalExpense = computed(() =>
    this.dataService.transactions().filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  );

  protected allCategoryNames = computed(() => {
    const names = this.dataService.categories().map(c => c.name);
    return Array.from(new Set(names)).sort();
  });

  protected filteredTransactions = computed<Transaction[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const type = this.filterType();
    const category = this.filterCategory();
    return this.dataService.transactions()
      .filter(t => type === 'all' || t.type === type)
      .filter(t => category === 'all' || t.category === category)
      .filter(t => !term || t.description.toLowerCase().includes(term) || (t.notes || '').toLowerCase().includes(term))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  });

  protected getCategoryColor(catName: string, type: 'income' | 'expense'): string {
    const match = this.dataService.categories().find(c => c.name === catName && c.type === type);
    return match ? match.color : '#64748b';
  }

  protected getCategoriesForType(): Category[] {
    return this.dataService.categories().filter(c => c.type === this.activeModalType());
  }

  protected openModal(type: 'income' | 'expense'): void {
    this.activeModalType.set(type);
    this.editingTransactionId.set(null);
    this.txDescription = '';
    this.txAmount = null;
    this.txCategory = '';
    this.txDate = new Date().toISOString().split('T')[0];
    this.txNotes = '';
  }

  protected openEditModal(tx: Transaction): void {
    this.activeModalType.set(tx.type);
    this.editingTransactionId.set(tx.id);
    this.txDescription = tx.description;
    this.txAmount = tx.amount;
    this.txCategory = tx.category;
    this.txDate = tx.date;
    this.txNotes = tx.notes || '';
  }

  protected closeModal(): void {
    this.activeModalType.set(null);
    this.editingTransactionId.set(null);
  }

  protected saveTransaction(event: Event): void {
    event.preventDefault();
    if (!this.txDescription || !this.txAmount || !this.txCategory || !this.txDate) return;

    const payload = {
      type: this.activeModalType()!,
      description: this.txDescription,
      amount: Number(this.txAmount),
      category: this.txCategory,
      date: this.txDate,
      notes: this.txNotes
    };

    const editingId = this.editingTransactionId();
    if (editingId) {
      this.dataService.updateTransaction(editingId, payload);
    } else {
      this.dataService.addTransaction(payload);
    }

    this.closeModal();
  }

  protected deleteTransaction(id: string): void {
    this.dataService.deleteTransaction(id);
  }
}
