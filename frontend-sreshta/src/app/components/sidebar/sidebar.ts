import { Component, input, output, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

export type TabName = 'dashboard' | 'transactions' | 'budgets' | 'tax-estimator' | 'reports' | 'settings';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  template: `
    <!-- Mobile hamburger top bar -->
    <div class="lg:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800 fixed top-0 left-0 right-0 z-40">
      <div class="flex items-center gap-2">
        <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-lg">TP</span>
        <span class="font-bold text-base tracking-tight text-white select-none">TaxPal</span>
      </div>
      <div class="flex items-center gap-3">
        <!-- User Avatar Initial -->
        <button 
          (click)="selectTab('settings')"
          class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 cursor-pointer"
        >
          {{ getInitials() }}
        </button>
        <button 
          type="button" 
          (click)="toggleMobileSidebar()" 
          class="p-1 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none transition-colors"
          aria-label="Toggle Navigation menu"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer Overlay Background -->
    @if (isMobileOpen()) {
      <div 
        class="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
        (click)="closeMobileSidebar()"
      ></div>
    }

    <!-- Sidebar Main Panel (Responsive drawer on mobile, static on desktop) -->
    <aside 
      class="fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-slate-900 border-r border-slate-800 text-slate-400 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-30"
      [class.translate-x-0]="isMobileOpen()"
      [class.-translate-x-full]="!isMobileOpen()"
    >
      <!-- Top Brand Header -->
      <div class="flex h-16 items-center gap-2 px-6 border-b border-slate-800">
        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xl">TP</span>
        <span class="font-extrabold text-lg tracking-tight text-white select-none">TaxPal</span>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-grow space-y-1.5 px-4 py-6 overflow-y-auto">
        @for (item of menuItems; track $index) {
          <button 
            type="button"
            (click)="selectTab(item.id)"
            class="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left focus:outline-none"
            [class.bg-blue-600]="activeTab() === item.id"
            [class.text-white]="activeTab() === item.id"
            [class.shadow-md]="activeTab() === item.id"
            [class.shadow-blue-500/10]="activeTab() === item.id"
            [class.hover:bg-slate-800]="activeTab() !== item.id"
            [class.hover:text-slate-200]="activeTab() !== item.id"
          >
            <!-- SVG Icon -->
            <span class="shrink-0" [innerHTML]="getSafeHtml(item.icon)"></span>
            {{ item.name }}
          </button>
        }
      </nav>

      <!-- Bottom User details / Action Section -->
      <div class="border-t border-slate-800 p-4 space-y-4">
        <!-- Settings button -->
        <button 
          type="button"
          (click)="selectTab('settings')"
          class="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer text-left focus:outline-none"
          [class.bg-blue-600]="activeTab() === 'settings'"
          [class.text-white]="activeTab() === 'settings'"
        >
          <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.936 6.936 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.645-.869L9.594 3.94ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" />
          </svg>
          Settings
        </button>

        <!-- User profile summary -->
        <div class="flex items-center gap-3">
          <!-- Avatar circle -->
          <div class="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm select-none border border-slate-700">
            {{ getInitials() }}
          </div>
          <div class="min-w-0 flex-grow">
            <p class="text-xs font-bold text-slate-100 truncate">{{ getUserName() }}</p>
            <p class="text-[10px] text-slate-500 truncate">{{ getUserEmail() }}</p>
          </div>
          <!-- Sign out link icon -->
          <button 
            type="button" 
            (click)="handleLogout()" 
            class="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none"
            aria-label="Logout"
          >
            <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  `
})
export class Sidebar {
  // Inputs/Outputs
  public readonly activeTab = input<TabName>('dashboard');
  public readonly tabChange = output<TabName>();

  protected readonly isMobileOpen = signal(false);

  protected readonly menuItems = [
    {
      id: 'dashboard' as TabName,
      name: 'Dashboard',
      icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>`
    },
    {
      id: 'transactions' as TabName,
      name: 'Transactions',
      icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
      </svg>`
    },
    {
      id: 'budgets' as TabName,
      name: 'Budgets',
      icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818.879-.659c1.171-.879 3.07-.879 4.242 0 1.172.879 1.172 2.303 0 3.182C13.536 21.371 12.36 21 12 21M12 3c.36 0 1.536.371 2.121.758 1.172.879 1.172 2.303 0 3.182-1.172.879-3.07.879-4.242 0-.879-.659-.879-2.083 0-2.742" />
      </svg>`
    },
    {
      id: 'tax-estimator' as TabName,
      name: 'Tax Estimator',
      icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>`
    },
    {
      id: 'reports' as TabName,
      name: 'Reports',
      icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>`
    }
  ];

  constructor(private authService: AuthService, private sanitizer: DomSanitizer) {}

  protected selectTab(tab: TabName): void {
    this.tabChange.emit(tab);
    this.closeMobileSidebar();
  }

  protected toggleMobileSidebar(): void {
    this.isMobileOpen.update(o => !o);
  }

  protected closeMobileSidebar(): void {
    this.isMobileOpen.set(false);
  }

  protected getInitials(): string {
    const user = this.authService.currentUser();
    if (!user || !user.name) return '?';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  protected getUserName(): string {
    return this.authService.currentUser()?.username || 'Guest User';
  }

  protected getUserEmail(): string {
    return this.authService.currentUser()?.email || 'guest@example.com';
  }

  protected handleLogout(): void {
    this.authService.logout();
    window.location.href = '/login';
  }

  protected getSafeHtml(html: string) {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
