import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar, TabName } from '../../components/sidebar/sidebar';
import { Router } from '@angular/router';
import { ToastService } from '../../services/toast.service';
import { TaxEstimateService } from '../../services/tax-estimate.service';
import { TaxNotificationPanel } from '../../components/tax-notification-panel/tax-notification-panel';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar, TaxNotificationPanel],
  styles: [`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  template: `
    <div class="min-h-screen bg-slate-50 flex">
      <app-sidebar [activeTab]="activeTab" (tabChange)="onTabChange($event)"></app-sidebar>
      <div class="flex-grow lg:pl-64 pt-16 lg:pt-0">
        <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <router-outlet></router-outlet>
        </main>
      </div>

      @if (taxEstimateService.notifications().length > 0) {
        <div
          class="fixed top-20 right-4 sm:right-6 flex flex-col gap-3 w-[calc(100%-2rem)] max-w-sm max-h-[75vh] overflow-y-auto pr-1 z-[999]"
        >
          @for (n of taxEstimateService.notifications(); track n.id) {
            <app-tax-notification-panel
              [message]="n.message"
              [dueDate]="n.dueDate"
              [priority]="n.priority || 'Medium'"
              (viewCalendar)="navigateToTaxEstimatorCalendar()"
              (markAsDone)="taxEstimateService.dismissNotification(n.id)"
              (dismiss)="taxEstimateService.dismissNotification(n.id)"
            ></app-tax-notification-panel>
          }
        </div>
      }

      <!-- Floating Error Toast Alerts overlay -->
      <div class="fixed bottom-5 right-5 z-[9999] space-y-3 pointer-events-none max-w-sm w-full px-4">
        @for (err of toastService.errors(); track err.id) {
          <div
            class="pointer-events-auto flex items-start gap-3.5 px-4 py-3.5 rounded-xl border border-red-200 bg-white/95 text-slate-800 shadow-xl shadow-red-950/5 backdrop-blur-md transition-all animate-[fadeInUp_0.2s_ease-out]"
          >
            <div class="shrink-0 text-red-500 mt-0.5">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-slate-900">Network / API Error</p>
              <p class="text-[11px] text-slate-600 mt-1 leading-normal font-medium">{{ err.message }}</p>
            </div>
            <button
              type="button"
              (click)="toastService.dismiss(err.id)"
              class="shrink-0 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer font-bold text-sm leading-none ml-auto"
              aria-label="Dismiss Error"
            >
              ×
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardLayoutComponent implements OnInit {
  protected readonly toastService = inject(ToastService);
  protected readonly taxEstimateService = inject(TaxEstimateService);
  activeTab: TabName = 'dashboard';

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url.includes('/transactions')) {
        this.activeTab = 'transactions';
      } else if (url.includes('/budgets')) {
        this.activeTab = 'budgets';
      } else if (url.includes('/tax-estimator')) {
        this.activeTab = 'tax-estimator';
      } else if (url.includes('/reports')) {
        this.activeTab = 'reports';
      } else if (url.includes('/settings')) {
        this.activeTab = 'settings';
      } else {
        this.activeTab = 'dashboard';
      }
    });
  }

  ngOnInit(): void {
    const currentPath = this.router.url.split('/')[1] as TabName;
    if (['dashboard', 'transactions', 'budgets', 'tax-estimator', 'reports', 'settings'].includes(currentPath)) {
      this.activeTab = currentPath;
    }
    this.taxEstimateService.checkAndAutoNotify();
  }

  onTabChange(tab: TabName): void {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
  }

  navigateToTaxEstimatorCalendar(): void {
    this.router.navigate(['/tax-estimator'], { queryParams: { tab: 'calendar' } });
  }
}