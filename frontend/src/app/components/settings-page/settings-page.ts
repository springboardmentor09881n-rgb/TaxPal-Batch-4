import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../models';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto pb-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight">Settings</h1>
        <p class="text-slate-500 mt-2 text-sm font-medium">Manage your account settings and preferences</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-8 items-start">
        <!-- Sidebar Navigation -->
        <div class="w-full lg:w-64 shrink-0">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <nav class="flex flex-col">
              <button class="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left border-b border-slate-100">
                <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              
              <button class="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-slate-900 bg-slate-50 transition-colors text-left border-b border-slate-100 border-l-4 border-l-slate-900 shadow-[inset_0px_2px_4px_rgba(0,0,0,0.02)]">
                <svg class="w-5 h-5 text-slate-600 -ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Categories
              </button>
              
              <button class="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left border-b border-slate-100">
                <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </button>
              
              <button class="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-left">
                <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Security
              </button>
            </nav>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="flex-grow bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6 md:p-8 min-h-[500px]">
          <h2 class="text-lg font-bold text-slate-900 mb-6">Category Management</h2>
          
          <!-- Category Tabs -->
          <div class="flex gap-6 border-b border-slate-200 mb-6">
            <button 
              (click)="activeCategoryTab.set('expense')"
              class="pb-3 text-sm font-bold transition-all relative outline-none"
              [class.text-slate-900]="activeCategoryTab() === 'expense'"
              [class.text-slate-400]="activeCategoryTab() !== 'expense'"
              [class.hover:text-slate-600]="activeCategoryTab() !== 'expense'"
            >
              Expense Categories
              <span *ngIf="activeCategoryTab() === 'expense'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-md"></span>
            </button>
            
            <button 
              (click)="activeCategoryTab.set('income')"
              class="pb-3 text-sm font-bold transition-all relative outline-none"
              [class.text-slate-900]="activeCategoryTab() === 'income'"
              [class.text-slate-400]="activeCategoryTab() !== 'income'"
              [class.hover:text-slate-600]="activeCategoryTab() !== 'income'"
            >
              Income Categories
              <span *ngIf="activeCategoryTab() === 'income'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 rounded-t-md"></span>
            </button>
          </div>
          
          <!-- Category List -->
          <div class="space-y-3 mb-8">
            <ng-container *ngFor="let category of filteredCategories()">
              <div class="flex items-center justify-between py-2 px-3 hover:bg-slate-50 rounded-lg group transition-colors border border-transparent hover:border-slate-100">
                <div class="flex items-center gap-3">
                  <div class="w-3.5 h-3.5 rounded-full shadow-sm" [style.backgroundColor]="category.color"></div>
                  <span class="text-sm font-semibold text-slate-700">{{ category.name }}</span>
                </div>
                
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button (click)="openEditModal(category)" class="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded hover:bg-blue-50 focus:outline-none">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button (click)="deleteCategory(category)" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 focus:outline-none">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </ng-container>
            
            <div *ngIf="filteredCategories().length === 0" class="py-8 text-center text-slate-400 text-sm">
              No {{ activeCategoryTab() }} categories found.
            </div>
          </div>
          
          <!-- Add Button -->
          <button (click)="openAddModal()" class="w-full py-3.5 bg-[#007aff] hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all shadow-sm focus:outline-none flex items-center justify-center gap-2">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Category
          </button>

        </div>
      </div>
    </div>

    <!-- Modal for Add/Edit Category -->
    <div *ngIf="isModalOpen" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" (click)="$event.stopPropagation()">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-slate-900">{{ editingCategory ? 'Edit' : 'Add' }} Category</h3>
          <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form (ngSubmit)="saveCategory()" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Category Name</label>
            <input type="text" [(ngModel)]="formData.name" name="name" required class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium">
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Color Code</label>
            <div class="flex gap-2">
              <input type="color" [(ngModel)]="formData.color" name="color" required class="h-10 w-12 rounded cursor-pointer border border-slate-200">
              <input type="text" [(ngModel)]="formData.color" name="colorText" required class="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-sm font-medium uppercase font-mono">
            </div>
          </div>
          <div class="pt-4 flex gap-3 justify-end">
            <button type="button" (click)="closeModal()" class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" [disabled]="!formData.name" class="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-blue-500/20">Save Category</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class SettingsPageComponent implements OnInit {
  categoryService = inject(CategoryService);
  
  activeCategoryTab = signal<'expense' | 'income'>('expense');
  
  isModalOpen = false;
  editingCategory: Category | null = null;
  
  formData = {
    name: '',
    color: '#64748b'
  };

  ngOnInit() {
    this.categoryService.loadCategories();
  }

  filteredCategories() {
    const type = this.activeCategoryTab();
    return this.categoryService.categories().filter(c => c.type === type);
  }

  openAddModal() {
    this.editingCategory = null;
    this.formData = {
      name: '',
      color: this.getRandomColor()
    };
    this.isModalOpen = true;
  }

  openEditModal(category: Category) {
    this.editingCategory = category;
    this.formData = {
      name: category.name,
      color: category.color
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  saveCategory() {
    if (!this.formData.name) return;
    
    if (this.editingCategory) {
      const id = this.editingCategory._id || this.editingCategory.id;
      if (id) {
        this.categoryService.updateCategory(id, this.formData).subscribe(() => {
          this.closeModal();
        });
      }
    } else {
      const newCat = {
        type: this.activeCategoryTab(),
        name: this.formData.name,
        color: this.formData.color
      };
      this.categoryService.addCategory(newCat).subscribe(() => {
        this.closeModal();
      });
    }
  }

  deleteCategory(category: Category) {
    if (confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
      const id = category._id || category.id;
      if (id) {
        this.categoryService.deleteCategory(id).subscribe();
      }
    }
  }

  getRandomColor() {
    const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
