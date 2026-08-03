import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar, TabName } from '../../components/sidebar/sidebar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  template: `
    <div class="min-h-screen bg-slate-50 flex">
      <app-sidebar [activeTab]="activeTab" (tabChange)="onTabChange($event)"></app-sidebar>
      <div class="flex-grow lg:pl-64 pt-16 lg:pt-0">
        <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent implements OnInit {
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
  }

  onTabChange(tab: TabName): void {
    this.activeTab = tab;
    this.router.navigate([`/${tab}`]);
  }
}