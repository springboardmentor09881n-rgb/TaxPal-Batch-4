import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Transaction, Category } from '../../services/data.service';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Title -->
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h1>
        <p class="text-xs text-slate-500 mt-1">Review and manage your complete ledger of logs.</p>
      </div>

      <!-- Filters Row -->
      <div class="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Search bar -->
        <div>
          <label for="search" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Search Description</label>
          <input 
            id="search"
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="Search details..."
            class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Type filter -->
        <div>
          <label for="type" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Transaction Type</label>
          <select 
            id="type"
            [(ngModel)]="filterType"
            class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Transactions</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
        </div>

        <!-- Category filter -->
        <div>
          <label for="cat" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
          <select 
            id="cat"
            [(ngModel)]="filterCategory"
            class="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            @for (cat of getCategoriesList(); track cat.id) {
              <option [value]="cat.name">{{ cat.name }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold">
                <th class="px-6 py-4 w-28">Date</th>
                <th class="px-6 py-4">Description</th>
                <th class="px-6 py-4 w-40">Category</th>
                <th class="px-6 py-4 w-28 text-right">Amount</th>
                <th class="px-6 py-4 w-24 text-center">Type</th>
                <th class="px-6 py-4 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (tx of filteredTransactions(); track tx.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-3.5 text-slate-500 font-medium">{{ tx.date }}</td>
                  <td class="px-6 py-3.5">
                    <p class="font-semibold text-slate-800">{{ tx.description }}</p>
                    @if (tx.notes) {
                      <p class="text-[10px] text-slate-400 mt-0.5 leading-relaxed italic">{{ tx.notes }}</p>
                    }
                  </td>
                  <td class="px-6 py-3.5 text-slate-500">
                    <span class="inline-flex items-center gap-1.5">
                      <span class="h-2 w-2 rounded-full shrink-0" [style.background-color]="getCategoryColor(tx.category, tx.type)"></span>
                      {{ tx.category }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5 text-right font-bold" [class.text-emerald-600]="tx.type === 'income'" [class.text-red-500]="tx.type === 'expense'">
                    {{ tx.type === 'income' ? '+' : '-' }}₹{{ tx.amount.toLocaleString('en-IN', {minimumFractionDigits: 2}) }}
                  </td>
                  <td class="px-6 py-3.5 text-center">
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
                  <td class="px-6 py-3.5 text-center">
                    <button 
                      type="button" 
                      (click)="deleteTransaction(tx.id)"
                      class="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
                      aria-label="Delete transaction"
                    >
                      <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="py-12 text-center text-slate-400 font-medium">No transactions match your search parameters.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class TransactionsPage {
  protected searchQuery = '';
  protected filterType = 'all';
  protected filterCategory = 'all';

  constructor(private dataService: DataService) {}

  protected filteredTransactions = computed(() => {
    return this.dataService.transactions().filter(tx => {
      const matchQuery = tx.description.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                          (tx.notes && tx.notes.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const matchType = this.filterType === 'all' || tx.type === this.filterType;
      const matchCategory = this.filterCategory === 'all' || tx.category === this.filterCategory;
      
      return matchQuery && matchType && matchCategory;
    });
  });

  protected getCategoriesList(): Category[] {
    const list = this.dataService.categories();
    if (this.filterType !== 'all') {
      return list.filter(c => c.type === this.filterType);
    }
    return list;
  }

  protected getCategoryColor(catName: string, type: 'income' | 'expense'): string {
    const cats = this.dataService.categories();
    const match = cats.find(c => c.name === catName && c.type === type);
    return match ? match.color : '#64748b';
  }

  protected deleteTransaction(id: string): void {
    if (confirm('Are you sure you want to delete this transaction record?')) {
      this.dataService.deleteTransaction(id);
    }
  }
}
