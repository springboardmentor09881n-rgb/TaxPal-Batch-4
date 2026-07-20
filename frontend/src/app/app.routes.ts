import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { SignupPageComponent } from './pages/signup-page/signup-page';
import { DashboardLayoutComponent } from './pages/dashboard-layout/dashboard-layout';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page';
import { TransactionsPageComponent } from './pages/transactions-page/transactions-page';
import { BudgetsPageComponent } from './pages/budgets-page/budgets-page';
import { SettingsPageComponent } from './pages/settings-page/settings-page';
import { TaxEstimatorPageComponent } from './pages/tax-estimator-page/tax-estimator-page';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'signup', component: SignupPageComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'transactions', component: TransactionsPageComponent },
      { path: 'budgets', component: BudgetsPageComponent },
      { path: 'tax-estimator', component: TaxEstimatorPageComponent },
      { path: 'settings', component: SettingsPageComponent },

    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
