import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { SignupPageComponent } from './pages/signup-page/signup-page';
import { DashboardLayoutComponent } from './pages/dashboard-layout/dashboard-layout';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page';
import { TransactionsPageShellComponent } from './pages/transactions-page/transactions-page';
import { BudgetsPageShellComponent } from './pages/budgets-page/budgets-page';
import { SettingsPageComponent } from './pages/settings-page/settings-page';
import { ForgotPasswordComponent } from './pages/forgot-password-page/forgot-password';
import { ResetPasswordComponent } from './pages/reset-password-page/reset-password';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  { path: 'signup', component: SignupPageComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: '',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardPageComponent },
      { path: 'transactions', component: TransactionsPageShellComponent },
      { path: 'budgets', component: BudgetsPageShellComponent },
      { path: 'settings', component: SettingsPageComponent },
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];

