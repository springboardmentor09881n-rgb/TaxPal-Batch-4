import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-signup',
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
          <h2 class="text-2xl font-bold text-slate-900">Create an Account</h2>
          <p class="mt-2 text-sm text-slate-500">Enter your information to create your TaxPal account</p>
        </div>

        <!-- Form -->
        <form class="mt-6 space-y-4" (submit)="onSubmit($event)">
          <!-- Username -->
          <div>
            <label for="username" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Username</label>
            <input 
              id="username" 
              name="username" 
              type="text" 
              required 
              [(ngModel)]="username"
              placeholder="Choose a username"
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              [(ngModel)]="password"
              placeholder="Choose a password"
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Full Name -->
          <div>
            <label for="name" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
            <input 
              id="name" 
              name="name" 
              type="text" 
              required 
              [(ngModel)]="name"
              placeholder="Enter your full name"
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              [(ngModel)]="email"
              placeholder="Enter your email address"
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- State/UT -->
          <div>
            <label for="state" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">State / Union Territory</label>
            <select 
              id="state" 
              name="state" 
              required
              [(ngModel)]="state"
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Delhi">Delhi</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Telangana">Telangana</option>
            </select>
          </div>

          <!-- Income Bracket -->
          <div>
            <label for="incomeBracket" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Income Bracket (Optional)</label>
            <select 
              id="incomeBracket" 
              name="incomeBracket" 
              [(ngModel)]="incomeBracket"
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select your income bracket</option>
              <option value="Low">Low (Under ₹5L)</option>
              <option value="Medium">Medium (₹5L - ₹15L)</option>
              <option value="High">High (Over ₹15L)</option>
            </select>
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
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md shadow-blue-500/10 cursor-pointer mt-6"
          >
            Create Account
          </button>
        </form>

        <!-- Toggle View -->
        <div class="text-center mt-6">
          <p class="text-xs text-slate-500">
            Already have an account? 
            <button 
              type="button" 
              (click)="goToLogin()"
              class="font-bold text-blue-600 hover:underline bg-transparent border-0 cursor-pointer focus:outline-none"
            >
              Sign in
            </button>
          </p>
        </div>

        <div class="text-center text-[10px] text-slate-400 mt-6 leading-relaxed">
          By creating an account, you agree to our <a href="#" class="underline">Terms of Service</a> and <a href="#" class="underline">Privacy Policy</a>.
        </div>
      </div>
    </div>
  `
})
export class Signup {
  protected username = '';
  protected password = '';
  protected name = '';
  protected email = '';
  protected state = 'Maharashtra';
  protected incomeBracket = '';
  protected readonly error = signal<string | null>(null);

  // Emitters
  public readonly navigateToLogin = output<void>();

  constructor(private dataService: DataService) {}

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.error.set(null);

    if (!this.username || !this.password || !this.name || !this.email || !this.state) {
      this.error.set('Please fill out all required fields.');
      return;
    }

    const success = this.dataService.signup({
      username: this.username,
      password: this.password,
      name: this.name,
      email: this.email,
      state: this.state,
      incomeBracket: this.incomeBracket || 'Medium'
    });

    if (!success) {
      this.error.set('Username already exists.');
    }
  }

  protected goToLogin(): void {
    this.navigateToLogin.emit();
  }
}
