import { Component, signal, computed } from '@angular/core';
import { DataService } from './services/data.service';
import { Login } from './components/login/login';
import { Signup } from './components/signup/signup';
import { Sidebar, TabName } from './components/sidebar/sidebar';
import { Dashboard } from './components/dashboard/dashboard';
import { TransactionsPage } from './components/transactions-page/transactions-page';
import { BudgetsPage } from './components/budgets-page/budgets-page';
import { TaxEstimatorPage } from './components/tax-estimator-page/tax-estimator-page';
import { ReportsPage } from './components/reports-page/reports-page';
import { SettingsPage } from './components/settings-page/settings-page';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Login,
    Signup,
    Sidebar,
    Dashboard,
    TransactionsPage,
    BudgetsPage,
    TaxEstimatorPage,
    ReportsPage,
    SettingsPage
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // Navigation states
  protected readonly authView = signal<'login' | 'signup'>('login');
  protected readonly activeTab = signal<TabName>('dashboard');

  constructor(private dataService: DataService) {}

  // Computed state derivations
  protected readonly isLoggedIn = computed(() => !!this.dataService.currentUser());

  protected setTab(tab: TabName): void {
    this.activeTab.set(tab);
  }

  protected setAuthView(view: 'login' | 'signup'): void {
    this.authView.set(view);
  }
}
