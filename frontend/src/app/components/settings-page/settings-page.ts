<<<<<<< HEAD
import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Category } from '../../models';

type SettingsTab = 'profile' | 'categories' | 'notifications' | 'security';
type CategoryTab = 'expense' | 'income';

const PRESET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#64748b'];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-2">
      <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
      <p class="text-xs text-slate-500 mb-6">Manage your account settings and preferences</p>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left Nav -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-2 space-y-1">
            <button
              (click)="activeTab.set('profile')"
              class="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer transition-all focus:outline-none"
              [class.bg-blue-50]="activeTab() === 'profile'"
              [class.text-blue-700]="activeTab() === 'profile'"
              [class.text-slate-500]="activeTab() !== 'profile'"
              [class.hover:bg-slate-50]="activeTab() !== 'profile'"
            >
              <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              Profile
            </button>
            <button
              (click)="activeTab.set('categories')"
              class="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer transition-all focus:outline-none"
              [class.bg-blue-50]="activeTab() === 'categories'"
              [class.text-blue-700]="activeTab() === 'categories'"
              [class.text-slate-500]="activeTab() !== 'categories'"
              [class.hover:bg-slate-50]="activeTab() !== 'categories'"
            >
              <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
              Categories
            </button>
            <button
              (click)="activeTab.set('notifications')"
              class="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer transition-all focus:outline-none"
              [class.bg-blue-50]="activeTab() === 'notifications'"
              [class.text-blue-700]="activeTab() === 'notifications'"
              [class.text-slate-500]="activeTab() !== 'notifications'"
              [class.hover:bg-slate-50]="activeTab() !== 'notifications'"
            >
              <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
              Notifications
            </button>
            <button
              (click)="activeTab.set('security')"
              class="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-left cursor-pointer transition-all focus:outline-none"
              [class.bg-blue-50]="activeTab() === 'security'"
              [class.text-blue-700]="activeTab() === 'security'"
              [class.text-slate-500]="activeTab() !== 'security'"
              [class.hover:bg-slate-50]="activeTab() !== 'security'"
            >
              <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
              Security
            </button>
          </div>
        </div>

        <!-- Right Content -->
        <div class="lg:col-span-9 space-y-6">

          <!-- PROFILE TAB -->
          @if (activeTab() === 'profile') {
            <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 class="text-sm font-bold text-slate-900 mb-6">Profile Information</h3>
              <form (submit)="saveProfile($event)" class="space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Full Name</label>
                    <input type="text" [(ngModel)]="profileName" name="profileName" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Email</label>
                    <input type="email" [(ngModel)]="profileEmail" name="profileEmail" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Country</label>
                    <input type="text" [(ngModel)]="profileCountry" name="profileCountry" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">State</label>
                    <input type="text" [(ngModel)]="profileState" name="profileState" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Income Bracket</label>
                    <select [(ngModel)]="profileIncomeBracket" name="profileIncomeBracket" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  @if (profileSaved()) {
                    <span class="text-xs font-semibold text-emerald-600 mr-auto">Profile updated successfully.</span>
                  }
                  <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer">Save Changes</button>
                </div>
              </form>
            </div>
          }

          <!-- CATEGORIES TAB -->
          @if (activeTab() === 'categories') {
            <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-slate-900">Category Management</h3>
              </div>

              <!-- Sub tabs -->
              <div class="flex items-center gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
                <button
                  (click)="categoryTab.set('expense')"
                  class="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all focus:outline-none"
                  [class.bg-white]="categoryTab() === 'expense'"
                  [class.shadow-sm]="categoryTab() === 'expense'"
                  [class.text-slate-900]="categoryTab() === 'expense'"
                  [class.text-slate-500]="categoryTab() !== 'expense'"
                >Expense Categories</button>
                <button
                  (click)="categoryTab.set('income')"
                  class="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all focus:outline-none"
                  [class.bg-white]="categoryTab() === 'income'"
                  [class.shadow-sm]="categoryTab() === 'income'"
                  [class.text-slate-900]="categoryTab() === 'income'"
                  [class.text-slate-500]="categoryTab() !== 'income'"
                >Income Categories</button>
              </div>

              <!-- Category List -->
              <div class="space-y-2 mb-6">
                @for (cat of visibleCategories(); track cat.id) {
                  <div class="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50/60">
                    @if (editingCategoryId() === cat.id) {
                      <div class="flex items-center gap-3 flex-grow">
                        <input type="color" [(ngModel)]="editColor" class="h-8 w-8 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                        <input type="text" [(ngModel)]="editName" class="flex-grow px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div class="flex items-center gap-2 shrink-0 ml-3">
                        <button (click)="saveEditCategory()" class="text-emerald-600 hover:text-emerald-700 text-xs font-bold cursor-pointer bg-transparent border-0">Save</button>
                        <button (click)="cancelEditCategory()" class="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer bg-transparent border-0">Cancel</button>
                      </div>
                    } @else {
                      <span class="flex items-center gap-3 text-sm font-semibold text-slate-800">
                        <span class="h-3 w-3 rounded-full shrink-0" [style.background-color]="cat.color"></span>
                        {{ cat.name }}
                      </span>
                      <div class="flex items-center gap-3 shrink-0">
                        <button (click)="startEditCategory(cat)" class="text-slate-400 hover:text-blue-600 cursor-pointer bg-transparent border-0 focus:outline-none" aria-label="Edit category">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button (click)="deleteCategory(cat.id)" class="text-slate-400 hover:text-red-500 cursor-pointer bg-transparent border-0 focus:outline-none" aria-label="Delete category">
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    }
                  </div>
                } @empty {
                  <div class="text-center py-8 text-slate-400 text-xs">No categories yet in this list.</div>
                }
              </div>

              <!-- Add New Category -->
              @if (showAddCategory()) {
                <div class="border border-slate-200 rounded-xl p-4 mb-4 space-y-3 bg-slate-50/50">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Category Name</label>
                      <input type="text" [(ngModel)]="newCategoryName" placeholder="e.g. Others" class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Color</label>
                      <div class="flex items-center gap-2 flex-wrap">
                        @for (c of presetColors; track c) {
                          <button
                            type="button"
                            (click)="newCategoryColor = c"
                            class="h-6 w-6 rounded-full border-2 cursor-pointer"
                            [style.background-color]="c"
                            [class.border-slate-900]="newCategoryColor === c"
                            [class.border-transparent]="newCategoryColor !== c"
                            [attr.aria-label]="'Pick color ' + c"
                          ></button>
                        }
                        <input type="color" [(ngModel)]="newCategoryColor" class="h-7 w-7 rounded-full border border-slate-200 cursor-pointer p-0.5" />
                      </div>
                    </div>
                  </div>
                  <div class="flex items-center justify-end gap-3">
                    <button (click)="cancelAddCategory()" class="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 border border-slate-200 cursor-pointer">Cancel</button>
                    <button (click)="addCategory()" class="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer">Add Category</button>
                  </div>
                </div>
              } @else {
                <button
                  (click)="openAddCategory()"
                  class="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer"
                >
                  + Add New Category
                </button>
              }

              @if (!hasOtherCategory()) {
                <div class="flex items-center justify-between mt-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                  <p class="text-[11px] text-slate-500">
                    No "Others" category yet for {{ categoryTab() }}s — add one to catch miscellaneous entries.
                  </p>
                  <button (click)="addOtherCategory()" class="text-xs font-bold text-blue-600 hover:underline bg-transparent border-0 cursor-pointer shrink-0 ml-3">
                    + Add "Others"
                  </button>
                </div>
              }
            </div>
          }

          <!-- NOTIFICATIONS TAB -->
          @if (activeTab() === 'notifications') {
            <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 class="text-sm font-bold text-slate-900 mb-6">Notification Preferences</h3>
              <div class="divide-y divide-slate-100">
                @for (pref of notificationPrefs(); track pref.key) {
                  <div class="flex items-center justify-between py-4">
                    <div>
                      <p class="text-sm font-semibold text-slate-800">{{ pref.label }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">{{ pref.description }}</p>
                    </div>
                    <button
                      type="button"
                      (click)="toggleNotification(pref.key)"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none"
                      [class.bg-blue-600]="pref.enabled"
                      [class.bg-slate-200]="!pref.enabled"
                    >
                      <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform" [class.translate-x-6]="pref.enabled" [class.translate-x-1]="!pref.enabled"></span>
                    </button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- SECURITY TAB -->
          @if (activeTab() === 'security') {
            <div class="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 class="text-sm font-bold text-slate-900 mb-6">Change Password</h3>
              <form (submit)="changePassword($event)" class="space-y-4 max-w-md">
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Current Password</label>
                  <input type="password" [(ngModel)]="currentPassword" name="currentPassword" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">New Password</label>
                  <input type="password" [(ngModel)]="newPassword" name="newPassword" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-600 uppercase mb-2">Confirm New Password</label>
                  <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" class="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                @if (securityError()) {
                  <p class="text-xs font-semibold text-red-500">{{ securityError() }}</p>
                }
                @if (securitySuccess()) {
                  <p class="text-xs font-semibold text-emerald-600">Password updated successfully.</p>
                }
                <div class="flex items-center justify-end pt-4 border-t border-slate-100">
                  <button type="submit" class="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 cursor-pointer">Update Password</button>
                </div>
              </form>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class SettingsPage {
  protected readonly activeTab = signal<SettingsTab>('profile');
  protected readonly categoryTab = signal<CategoryTab>('expense');
  protected readonly presetColors = PRESET_COLORS;

  // Profile
  protected profileName = '';
  protected profileEmail = '';
  protected profileCountry = '';
  protected profileState = '';
  protected profileIncomeBracket = 'Medium';
  protected readonly profileSaved = signal(false);

  // Categories
  protected readonly editingCategoryId = signal<string | null>(null);
  protected editName = '';
  protected editColor = '#64748b';

  protected readonly showAddCategory = signal(false);
  protected newCategoryName = '';
  protected newCategoryColor = PRESET_COLORS[0];

  // Notifications (local demo preferences)
  private readonly notifState = signal([
    { key: 'email', label: 'Email Notifications', description: 'Receive updates about your account via email.', enabled: true },
    { key: 'budget', label: 'Budget Alerts', description: 'Get notified when you are close to a budget limit.', enabled: true },
    { key: 'tax', label: 'Tax Reminders', description: 'Reminders for upcoming advance tax due dates.', enabled: true },
    { key: 'weekly', label: 'Weekly Summary', description: 'A weekly digest of your income and expenses.', enabled: false }
  ]);
  protected notificationPrefs = computed(() => this.notifState());

  // Security
  protected currentPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';
  protected readonly securityError = signal('');
  protected readonly securitySuccess = signal(false);

  constructor(private dataService: DataService) {
    const user = this.dataService.currentUser();
    this.profileName = user?.name || '';
    this.profileEmail = user?.email || '';
    this.profileCountry = user?.country || '';
    this.profileState = user?.state || '';
    this.profileIncomeBracket = user?.incomeBracket || 'Medium';
  }

  protected visibleCategories = computed<Category[]>(() =>
    this.dataService.categories().filter(c => c.type === this.categoryTab())
  );

  protected hasOtherCategory = computed(() =>
    this.visibleCategories().some(c => c.name.trim().toLowerCase() === 'other' || c.name.trim().toLowerCase() === 'others')
  );

  // --- Profile ---
  protected saveProfile(event: Event): void {
    event.preventDefault();
    const user = this.dataService.currentUser();
    if (!user) return;

    const updatedUser = {
      ...user,
      name: this.profileName,
      email: this.profileEmail,
      country: this.profileCountry,
      state: this.profileState,
      incomeBracket: this.profileIncomeBracket
    };

    this.dataService.currentUser.set(updatedUser);
    sessionStorage.setItem('tp_active_user', JSON.stringify(updatedUser));

    this.profileSaved.set(true);
    setTimeout(() => this.profileSaved.set(false), 2500);
  }

  // --- Categories ---
  protected startEditCategory(cat: Category): void {
    this.editingCategoryId.set(cat.id);
    this.editName = cat.name;
    this.editColor = cat.color;
  }

  protected cancelEditCategory(): void {
    this.editingCategoryId.set(null);
  }

  protected saveEditCategory(): void {
    const id = this.editingCategoryId();
    if (!id || !this.editName.trim()) return;

    // Update via delete + re-add since DataService has no direct update method.
    const original = this.dataService.categories().find(c => c.id === id);
    if (!original) return;

    const oldName = original.name;
    const newName = this.editName.trim();

    this.dataService.deleteCategory(id);
    this.dataService.addCategory({
      type: original.type,
      name: newName,
      color: this.editColor
    });

    if (oldName !== newName) {
      this.dataService.renameCategoryCascade(oldName, newName, original.type);
    }

    this.editingCategoryId.set(null);
  }

  protected openAddCategory(): void {
    this.showAddCategory.set(true);
    this.newCategoryName = '';
    this.newCategoryColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
  }

  protected cancelAddCategory(): void {
    this.showAddCategory.set(false);
  }

  protected addCategory(): void {
    if (!this.newCategoryName.trim()) return;

    this.dataService.addCategory({
      type: this.categoryTab(),
      name: this.newCategoryName.trim(),
      color: this.newCategoryColor
    });

    this.showAddCategory.set(false);
    this.newCategoryName = '';
  }

  protected deleteCategory(id: string): void {
    this.dataService.deleteCategory(id);
  }

  protected addOtherCategory(): void {
    this.dataService.addCategory({
      type: this.categoryTab(),
      name: 'Others',
      color: '#64748b'
    });
  }

  // --- Notifications ---
  protected toggleNotification(key: string): void {
    this.notifState.update(prefs => prefs.map(p => (p.key === key ? { ...p, enabled: !p.enabled } : p)));
  }

  // --- Security ---
  protected async changePassword(event: Event): Promise<void> {
    event.preventDefault();
    this.securityError.set('');
    this.securitySuccess.set(false);

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.securityError.set('Please fill in all password fields.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.securityError.set('New password and confirmation do not match.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.securityError.set('New password must be at least 6 characters.');
      return;
    }

    try {
      const res = await this.dataService.changePassword(this.currentPassword, this.newPassword);
      if (res.success) {
        this.securitySuccess.set(true);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        setTimeout(() => this.securitySuccess.set(false), 2500);
      } else {
        this.securityError.set(res.message);
      }
    } catch (err: any) {
      this.securityError.set(err.message || 'An error occurred. Please try again.');
    }
  }
=======
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
>>>>>>> Riyaz
}
