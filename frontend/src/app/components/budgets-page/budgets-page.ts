import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { Budget } from '../../models';

@Component({
  selector: 'app-budgets-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-6xl mx-auto">
      <!-- Top Section -->
      <div class="flex items-center justify-between">
        @if (!isFormOpen()) {
          <button 
            (click)="openCreateForm()" 
            class="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span class="text-base font-extrabold">+</span> Create New Budget
          </button>
        } @else {
          <div></div>
        }
        <div class="bg-white border border-slate-200 rounded-xl px-6 py-4 flex items-center justify-between w-64 shadow-sm">
          <span class="text-sm font-semibold text-slate-500">Budget Health</span>
          <span [class]="budgetHealth.class">{{ budgetHealth.label }}</span>
        </div>
      </div>

      <!-- Create / Edit Budget Card -->
      @if (isFormOpen()) {
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 class="text-lg font-bold text-slate-800">{{ editingId ? 'Edit Budget' : 'Create New Budget' }}</h2>
            <button (click)="resetForm()" class="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" aria-label="Close form">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <form (ngSubmit)="saveBudget()" class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <!-- Category -->
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Category</label>
                <select [(ngModel)]="formData.category" name="category" required class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 transition-all">
                  <option value="" disabled>Select a category</option>
                  @for (cat of categoryService.mergedCategories('expense'); track cat.name) {
                    <option [value]="cat.name">{{ cat.name }}</option>
                  }
                </select>
              </div>
              
              <!-- Budget Amount -->
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">Budget Amount</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                  <input type="number" [(ngModel)]="formData.budget_amount" name="amount" required min="0.01" step="0.01" placeholder="0.00" class="w-full bg-white border border-slate-200 rounded-lg pl-7 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 transition-all">
                </div>
              </div>
            </div>

            <!-- Month -->
            <div class="mb-6 w-full md:w-1/2 md:pr-3">
              <label class="block text-sm font-bold text-slate-700 mb-2">Month</label>
              <div class="relative">
                <input type="month" [(ngModel)]="formData.month" name="month" required class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 transition-all">
              </div>
            </div>

            <!-- Description -->
            <div class="mb-6">
              <label class="block text-sm font-bold text-slate-700 mb-2">Description (Optional)</label>
              <textarea [(ngModel)]="formData.description" name="description" rows="3" placeholder="Add any additional details..." class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm text-slate-700 transition-all"></textarea>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 mt-4">
              <button type="button" (click)="resetForm()" class="px-5 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="submit" [disabled]="!formData.category || !formData.budget_amount || !formData.month" class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer">
                {{ editingId ? 'Update Budget' : 'Create Budget' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Budgets Table -->
      <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-8">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th class="px-6 py-4 font-semibold text-slate-500">Category</th>
                <th class="px-6 py-4 font-semibold text-slate-500">Budget</th>
                <th class="px-6 py-4 font-semibold text-slate-500">Spent</th>
                <th class="px-6 py-4 font-semibold text-slate-500">Remaining</th>
                <th class="px-6 py-4 font-semibold text-slate-500">Status</th>
                <th class="px-6 py-4 font-semibold text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm text-slate-700">
              @for (budget of budgetService.budgets(); track budget._id || budget.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 font-medium text-slate-900">{{ budget.category }}</td>
                  <td class="px-6 py-4">₹{{ budget.budget_amount | number:'1.2-2' }}</td>
                  <td class="px-6 py-4">₹{{ budget.spent || 0 | number:'1.2-2' }}</td>
                  <td class="px-6 py-4">₹{{ (budget.remaining || 0) | number:'1.2-2' }}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                          [ngClass]="getStatusClass(budget.spent || 0, budget.budget_amount)">
                      {{ getStatusText(budget.spent || 0, budget.budget_amount) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button (click)="editBudget(budget)" class="text-blue-500 hover:text-blue-700 transition-colors p-1 cursor-pointer">
                        Edit
                      </button>
                      <button (click)="deleteBudget(budget._id || budget.id!)" class="text-red-500 hover:text-red-700 transition-colors p-1 cursor-pointer">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              }
              @if (budgetService.budgets().length === 0) {
                <tr>
                  <td colspan="6" class="px-6 py-8 text-center text-slate-500">
                    No budgets found. Create one above to get started.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class BudgetsPageComponent implements OnInit {
  budgetService = inject(BudgetService);
  categoryService = inject(CategoryService);

  editingId: string | null = null;
  readonly isFormOpen = signal<boolean>(false);

  formData: any = {
    category: '',
    budget_amount: null,
    month: '',
    description: ''
  };

  ngOnInit() {
    this.budgetService.loadBudgets();
    this.categoryService.loadCategories();
    this.initFormDate();
  }

  initFormDate() {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    this.formData.month = currentMonth;
  }

  get budgetHealth() {
    const list = this.budgetService.budgets();
    if (!list || list.length === 0) {
      return { label: 'Good', class: 'bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-xs' };
    }

    let hasCritical = false;
    let hasWarning = false;

    for (const b of list) {
      const amount = b.budget_amount || 0;
      const spent = b.spent || 0;
      if (amount > 0) {
        const pct = (spent / amount) * 100;
        if (pct >= 100) {
          hasCritical = true;
        } else if (pct >= 75) {
          hasWarning = true;
        }
      }
    }

    if (hasCritical) {
      return { label: 'Critical', class: 'bg-red-100 text-red-800 font-bold px-2.5 py-0.5 rounded-full text-xs' };
    }
    if (hasWarning) {
      return { label: 'Warning', class: 'bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-xs' };
    }
    return { label: 'Good', class: 'bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-xs' };
  }

  getStatusClass(spent: number, amount: number) {
    if (!amount) return 'bg-slate-100 text-slate-800';
    const pct = (spent / amount) * 100;
    if (pct < 75) return 'bg-emerald-100 text-emerald-800';
    if (pct < 100) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  }

  getStatusText(spent: number, amount: number) {
    if (!amount) return 'Unknown';
    const pct = (spent / amount) * 100;
    if (pct < 75) return 'On Track';
    if (pct < 100) return 'Near Limit';
    return 'Over Budget';
  }

  openCreateForm() {
    this.editingId = null;
    this.formData = {
      category: '',
      budget_amount: null,
      month: '',
      description: ''
    };
    this.initFormDate();
    this.isFormOpen.set(true);
  }

  resetForm() {
    this.editingId = null;
    this.isFormOpen.set(false);
    this.formData = {
      category: '',
      budget_amount: null,
      month: '',
      description: ''
    };
    this.initFormDate();
  }

  editBudget(budget: Budget) {
    this.editingId = budget._id || budget.id || null;
    this.formData = {
      category: budget.category,
      budget_amount: budget.budget_amount,
      month: budget.month,
      description: budget.description || ''
    };
    this.isFormOpen.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveBudget() {
    if (this.editingId) {
      this.budgetService.updateBudget(this.editingId, this.formData).subscribe(() => {
        this.resetForm();
      });
    } else {
      this.budgetService.addBudget(this.formData).subscribe(() => {
        this.resetForm();
      });
    }
  }

  deleteBudget(id: string) {
    if (confirm('Are you sure you want to delete this budget?')) {
      this.budgetService.deleteBudget(id).subscribe();
    }
  }
}
