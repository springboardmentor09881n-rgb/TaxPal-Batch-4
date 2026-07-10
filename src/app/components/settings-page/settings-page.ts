import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService, Category } from '../../services/data.service';

type SettingsTab = 'profile' | 'categories' | 'notifications' | 'security';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Title -->
      <div>
        <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p class="text-xs text-slate-500 mt-1">Manage your account settings and preferences.</p>
      </div>

      <!-- Settings Layout wrapper -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        <!-- Left Side Sub-tabs -->
        <div class="md:col-span-3 bg-white p-3 rounded-xl border border-slate-200/60 shadow-sm flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          @for (tab of tabs; track tab.id) {
            <button 
              type="button"
              (click)="activeSubTab.set(tab.id)"
              class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-left focus:outline-none"
              [class.bg-slate-100]="activeSubTab() === tab.id"
              [class.text-slate-900]="activeSubTab() === tab.id"
              [class.text-slate-500]="activeSubTab() !== tab.id"
              [class.hover:bg-slate-50]="activeSubTab() !== tab.id"
            >
              <span [innerHTML]="tab.icon"></span>
              {{ tab.name }}
            </button>
          }
        </div>

        <!-- Right Side Panel Content -->
        <div class="md:col-span-9 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm min-h-[350px]">
          
          <!-- Tab 1: Profile -->
          @if (activeSubTab() === 'profile') {
            <div class="space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">User Profile</h3>
              <div class="space-y-4 max-w-md text-xs">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="block text-slate-400 font-medium mb-1">Full Name</span>
                    <span class="block font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">{{ user()?.name }}</span>
                  </div>
                  <div>
                    <span class="block text-slate-400 font-medium mb-1">Username</span>
                    <span class="block font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">{{ user()?.username }}</span>
                  </div>
                </div>
                <div>
                  <span class="block text-slate-400 font-medium mb-1">Email Address</span>
                  <span class="block font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">{{ user()?.email }}</span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <span class="block text-slate-400 font-medium mb-1">Country of Residence</span>
                    <span class="block font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">{{ user()?.country }}</span>
                  </div>
                  <div>
                    <span class="block text-slate-400 font-medium mb-1">Estimated Income Bracket</span>
                    <span class="block font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg">{{ user()?.incomeBracket }}</span>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Tab 2: Category Management (Active Screen) -->
          @if (activeSubTab() === 'categories') {
            <div class="space-y-6">
              <div class="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 class="text-sm font-bold text-slate-900">Category Management</h3>
                
                <!-- Toggle between Income / Expense categories -->
                <div class="flex bg-slate-100 p-0.5 rounded-lg text-[10px]">
                  <button 
                    (click)="activeCategoryType.set('expense')"
                    class="px-3 py-1.5 rounded-md font-bold focus:outline-none cursor-pointer"
                    [class.bg-white]="activeCategoryType() === 'expense'"
                    [class.text-slate-900]="activeCategoryType() === 'expense'"
                    [class.text-slate-500]="activeCategoryType() !== 'expense'"
                  >
                    Expense Categories
                  </button>
                  <button 
                    (click)="activeCategoryType.set('income')"
                    class="px-3 py-1.5 rounded-md font-bold focus:outline-none cursor-pointer"
                    [class.bg-white]="activeCategoryType() === 'income'"
                    [class.text-slate-900]="activeCategoryType() === 'income'"
                    [class.text-slate-500]="activeCategoryType() !== 'income'"
                  >
                    Income Categories
                  </button>
                </div>
              </div>

              <!-- List Categories -->
              <div class="space-y-2.5 max-w-lg">
                @for (cat of filteredCategories(); track cat.id) {
                  <div class="flex items-center justify-between border border-slate-200/50 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <span class="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                      <span class="h-3 w-3 rounded-full shrink-0" [style.background-color]="cat.color"></span>
                      {{ cat.name }}
                    </span>
                    <div class="flex items-center gap-1">
                      <button 
                        (click)="deleteCategory(cat.id)"
                        class="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
                        aria-label="Delete category"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Inline Add Category Form -->
              <div class="border-t border-slate-100 pt-6 max-w-lg">
                @if (!showCreator()) {
                  <button 
                    type="button" 
                    (click)="showCreator.set(true)"
                    class="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50/20 transition-all cursor-pointer focus:outline-none"
                  >
                    + Add New Category
                  </button>
                } @else {
                  <form (submit)="addCategory($event)" class="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                    <div class="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span class="text-xs font-bold text-slate-700">Add New Category</span>
                      <button (click)="showCreator.set(false)" type="button" class="text-slate-400 text-base font-bold">×</button>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Category Name</label>
                        <input 
                          type="text" 
                          required
                          [(ngModel)]="newCatName"
                          name="newCatName"
                          placeholder="e.g. Marketing, HSA"
                          class="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Pick Accent Color</label>
                        <div class="flex items-center gap-1.5 mt-1">
                          @for (color of colorPresets; track color) {
                            <button 
                              type="button"
                              (click)="newCatColor.set(color)"
                              class="h-6 w-6 rounded-full border-2 transition-all cursor-pointer"
                              [style.background-color]="color"
                              [class.border-slate-900]="newCatColor() === color"
                              [class.border-transparent]="newCatColor() !== color"
                            ></button>
                          }
                        </div>
                      </div>
                    </div>

                    <div class="flex justify-end gap-2 text-xs font-bold pt-2">
                      <button (click)="showCreator.set(false)" type="button" class="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">Cancel</button>
                      <button type="submit" class="px-4 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-500">Save</button>
                    </div>
                  </form>
                }
              </div>
            </div>
          }

          <!-- Tab 3: Notifications -->
          @if (activeSubTab() === 'notifications') {
            <div class="space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Notification Preferences</h3>
              <p class="text-xs text-slate-400">Manage calendar alert schedules and IRS e-file notifications.</p>
              
              <div class="space-y-3 text-xs pt-2">
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                  <span class="text-slate-700 font-semibold">Email reminders 7 days before quarterly tax deadlines</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                  <span class="text-slate-700 font-semibold">Weekly budget health progress digest</span>
                </label>
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                  <span class="text-slate-700 font-semibold">Browser push notifications for newly scanned logs</span>
                </label>
              </div>
            </div>
          }

          <!-- Tab 4: Security -->
          @if (activeSubTab() === 'security') {
            <div class="space-y-4">
              <h3 class="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Security Settings</h3>
              <p class="text-xs text-slate-400">Update your credentials and audit gateway access keys.</p>
              
              <div class="space-y-4 max-w-sm pt-2 text-xs">
                <div>
                  <label class="block text-slate-400 font-medium mb-1">Current password</label>
                  <input type="password" class="w-full px-3 py-2 border border-slate-200 rounded-lg" value="password" readonly />
                </div>
                <div>
                  <label class="block text-slate-400 font-medium mb-1">New password</label>
                  <input type="password" placeholder="Enter new password" class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none" />
                </div>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Update credentials</button>
              </div>
            </div>
          }

        </div>

      </div>
    </div>
  `
})
export class SettingsPage {
  protected readonly activeSubTab = signal<SettingsTab>('categories'); // Start on Categories as active mockup tab
  protected readonly activeCategoryType = signal<'expense' | 'income'>('expense');

  // Add Category form states
  protected readonly showCreator = signal(false);
  protected newCatName = '';
  protected readonly newCatColor = signal('#8b5cf6'); // Purple default preset

  protected readonly colorPresets = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

  protected readonly tabs = [
    {
      id: 'profile' as SettingsTab,
      name: 'Profile Settings',
      icon: `<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>`
    },
    {
      id: 'categories' as SettingsTab,
      name: 'Category Management',
      icon: `<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.237 2.237 0 0 0 9.568 3Z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 7.5h.008v.008H6V7.5Z" />
      </svg>`
    },
    {
      id: 'notifications' as SettingsTab,
      name: 'Notifications',
      icon: `<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
      </svg>`
    },
    {
      id: 'security' as SettingsTab,
      name: 'Security & Password',
      icon: `<svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>`
    }
  ];

  constructor(private dataService: DataService) {}

  protected user = computed(() => this.dataService.currentUser());

  protected filteredCategories = computed(() => {
    return this.dataService.categories().filter(c => c.type === this.activeCategoryType());
  });

  protected deleteCategory(id: string): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.dataService.deleteCategory(id);
    }
  }

  protected addCategory(event: Event): void {
    event.preventDefault();
    if (!this.newCatName) return;

    this.dataService.addCategory({
      type: this.activeCategoryType(),
      name: this.newCatName.trim(),
      color: this.newCatColor()
    });

    this.newCatName = '';
    this.showCreator.set(false);
  }
}
