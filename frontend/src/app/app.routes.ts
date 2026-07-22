import { Routes } from '@angular/router';
import { LoginPageComponent } from './pages/login-page/login-page';
import { SignupPageComponent } from './pages/signup-page/signup-page';
import { DashboardLayoutComponent } from './pages/dashboard-layout/dashboard-layout';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page';
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

    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
