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
}
