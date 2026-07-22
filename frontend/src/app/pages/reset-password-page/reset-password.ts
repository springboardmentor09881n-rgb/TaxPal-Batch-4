import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule],
  styles: [`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in-up {
      animation: fadeInUp 0.35s ease both;
    }
  `],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div class="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md fade-in-up">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="flex justify-center select-none mb-3">
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-2xl shadow-md shadow-blue-500/10">TP</span>
          </div>
          <h2 class="text-2xl font-bold text-slate-900">Reset Password</h2>
          <p class="mt-2 text-sm text-slate-500">Enter and confirm your new password below.</p>
        </div>

        @if (!token()) {
          <!-- Invalid / missing token state -->
          <div class="text-center fade-in-up">
            <div class="flex justify-center mb-4">
              <div class="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg class="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Invalid Reset Link</h3>
            <p class="text-sm text-slate-500 mb-6">This password reset link is invalid or missing a token. Please request a new one.</p>
            <button type="button" (click)="goToForgotPassword()" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer">
              Request New Link
            </button>
          </div>
        } @else if (successMessage()) {
          <!-- Success State -->
          <div class="text-center fade-in-up">
            <div class="flex justify-center mb-4">
              <div class="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2">Password Reset!</h3>
            <p class="text-sm text-slate-500 mb-6">{{ successMessage() }}</p>
            <button type="button" (click)="goToLogin()" class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer">
              Sign In Now
            </button>
          </div>
        } @else {
          <!-- Reset Form -->
          <form (submit)="onSubmit($event)" class="space-y-4">
            <div>
              <label for="new-password" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">New Password</label>
              <input
                id="new-password"
                name="newPassword"
                type="password"
                required
                [(ngModel)]="newPassword"
                placeholder="Enter your new password"
                class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label for="confirm-password" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Confirm New Password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                required
                [(ngModel)]="confirmPassword"
                placeholder="Confirm your new password"
                class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            @if (error()) {
              <div class="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 fade-in-up">
                {{ error() }}
              </div>
            }

            <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <p class="text-xs text-amber-700 font-medium">⏰ This reset link expires 5 minutes after it was sent.</p>
            </div>

            <button
              type="submit"
              [disabled]="isResetting()"
              class="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md shadow-blue-500/10 cursor-pointer mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              @if (isResetting()) {
                <span class="spinner"></span>
                Resetting Password...
              } @else {
                Reset Password
              }
            </button>
          </form>
        }

        <!-- Back to Login -->
        <div class="text-center mt-6">
          <button
            type="button"
            (click)="goToLogin()"
            class="text-xs text-slate-500 hover:text-blue-600 bg-transparent border-0 cursor-pointer focus:outline-none flex items-center gap-1 mx-auto"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  protected newPassword = '';
  protected confirmPassword = '';
  protected readonly token = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly isResetting = signal(false);
  protected readonly successMessage = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.token.set(token);
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);

    if (!this.newPassword || !this.confirmPassword) {
      this.error.set('Please fill in both password fields.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    const token = this.token();
    if (!token) {
      this.error.set('Invalid or missing reset token.');
      return;
    }

    this.isResetting.set(true);
    try {
      const result = await this.dataService.resetPassword(token, this.newPassword);
      if (result.success) {
        this.successMessage.set(result.message);
      } else {
        this.error.set(result.message);
      }
    } finally {
      this.isResetting.set(false);
    }
  }

  protected goToLogin(): void {
    this.router.navigate(['/login']);
  }

  protected goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
