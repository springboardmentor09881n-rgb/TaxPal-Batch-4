import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md">
        <!-- Header -->
        <div class="text-center">
          <div class="flex justify-center select-none mb-3">
            <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-2xl shadow-md shadow-blue-500/10">TP</span>
          </div>
          <h2 class="text-2xl font-bold text-slate-900">TaxPal</h2>
          <p class="mt-2 text-sm text-slate-500">Sign in to your account to continue</p>
        </div>

        <!-- Form -->
        <form class="mt-8 space-y-6" (submit)="onSubmit($event)">
          <div class="space-y-4">
            <!-- Username -->
            <div>
              <label for="username" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Username</label>
              <input 
                id="username" 
                name="username" 
                type="text" 
                required 
                [(ngModel)]="username"
                placeholder="Enter your username"
                class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- Password -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label for="password" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Password</label>
                <a href="#" class="text-xs font-medium text-blue-600 hover:underline">Forgot password?</a>
              </div>
              <input 
                id="password" 
                name="password" 
                type="password" 
                required 
                [(ngModel)]="password"
                placeholder="Enter your password"
                class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <!-- Error Alert -->
          @if (error()) {
            <div class="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {{ error() }}
            </div>
          }

          <!-- Submit Button -->
          <button 
            type="submit" 
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md shadow-blue-500/10 cursor-pointer"
          >
            Sign in
          </button>
        </form>



        <!-- Toggle View -->
        <div class="text-center mt-6">
          <p class="text-xs text-slate-500">
            Don't have an account? 
            <button 
              type="button" 
              (click)="goToSignup()"
              class="font-bold text-blue-600 hover:underline bg-transparent border-0 cursor-pointer focus:outline-none"
            >
              Sign up
            </button>
          </p>
        </div>

        <div class="text-center text-[10px] text-slate-400 mt-8">
          © 2025 TaxPal. All rights reserved.
        </div>
      </div>
    </div>
  `
})
export class Login {
  protected username = '';
  protected password = '';
  protected readonly error = signal<string | null>(null);

  // Emitters
  public readonly navigateToSignup = output<void>();

  constructor(private dataService: DataService) {}

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.error.set(null);

    if (!this.username || !this.password) {
      this.error.set('Please fill out all fields.');
      return;
    }

    const success = this.dataService.login(this.username, this.password);
    if (!success) {
      this.error.set('Invalid username or password.');
    }
  }



  protected goToSignup(): void {
    this.navigateToSignup.emit();
  }
}
