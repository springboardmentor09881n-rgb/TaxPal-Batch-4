import { Component, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

interface CountryOption {
  name: string;
  currency: string;
  symbol: string;
}

@Component({
  selector: 'app-signup',
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
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-md fade-in-up">
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
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>

          <!-- Country -->
          <div>
            <label for="country" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Country</label>
            @if (loadingCountries()) {
              <div class="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-400 flex items-center gap-2">
                <span class="spinner" style="border-color: rgba(100,116,139,0.3); border-top-color: #64748b;"></span>
                Loading countries...
              </div>
            } @else {
              <select
                id="country"
                name="country"
                required
                [(ngModel)]="selectedCountry"
                (ngModelChange)="onCountryChange($event)"
                class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                @for (c of countries(); track c.name) {
                  <option [value]="c.name">{{ c.name }}</option>
                }
              </select>
            }
          </div>

          <!-- Income Bracket -->
          <div>
            <label for="incomeBracket" class="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Income Bracket (Optional)</label>
            <select
              id="incomeBracket"
              name="incomeBracket"
              [(ngModel)]="incomeBracket"
              class="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select your income bracket</option>
              @for (bracket of incomeBrackets(); track bracket.value) {
                <option [value]="bracket.value">{{ bracket.label }}</option>
              }
            </select>
          </div>

          <!-- Error Alert -->
          @if (error()) {
            <div class="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 fade-in-up">
              {{ error() }}
            </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="isRegistering()"
            class="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-md shadow-blue-500/10 cursor-pointer mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            @if (isRegistering()) {
              <span class="spinner"></span>
              Creating Account...
            } @else {
              Create Account
            }
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
export class Signup implements OnInit {
  protected username = '';
  protected password = '';
  protected name = '';
  protected email = '';
  protected selectedCountry = 'India';
  protected incomeBracket = '';
  protected readonly error = signal<string | null>(null);
  protected readonly isRegistering = signal(false);
  protected readonly loadingCountries = signal(true);
  protected readonly countries = signal<CountryOption[]>([]);
  protected readonly incomeBrackets = signal<{ value: string; label: string }[]>([]);

  // Emitters
  public readonly navigateToLogin = output<void>();

  constructor(private dataService: DataService, private authService: AuthService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.loadCountries();
  }

  private async loadCountries(): Promise<void> {
    const countriesList: CountryOption[] = [
      { name: 'India', currency: 'Indian Rupee', symbol: '₹' },
      { name: 'United States', currency: 'US Dollar', symbol: '$' },
      { name: 'United Kingdom', currency: 'British Pound', symbol: '£' },
      { name: 'European Union', currency: 'Euro', symbol: '€' },
      { name: 'Japan', currency: 'Japanese Yen', symbol: '¥' },
      { name: 'Canada', currency: 'Canadian Dollar', symbol: 'CA$' },
      { name: 'Australia', currency: 'Australian Dollar', symbol: 'A$' },
      { name: 'Singapore', currency: 'Singapore Dollar', symbol: 'S$' },
      { name: 'United Arab Emirates', currency: 'UAE Dirham', symbol: 'AED' },
    ];
    this.countries.set(countriesList);
    this.selectedCountry = 'India';
    this.updateIncomeBrackets('India');
    this.loadingCountries.set(false);
  }

  protected onCountryChange(countryName: string): void {
    this.incomeBracket = '';
    this.updateIncomeBrackets(countryName);
  }

  private updateIncomeBrackets(countryName: string): void {
    const country = this.countries().find(c => c.name === countryName);
    const sym = country?.symbol || '$';

    // Map symbol to bracket thresholds
    const brackets = this.getBracketsForSymbol(sym);
    this.incomeBrackets.set(brackets);
  }

  private getBracketsForSymbol(sym: string): { value: string; label: string }[] {
    // Indian Rupee
    if (sym === '₹') {
      return [
        { value: 'Low', label: `Low (Under ₹5L)` },
        { value: 'Medium', label: `Medium (₹5L – ₹15L)` },
        { value: 'High', label: `High (Over ₹15L)` },
      ];
    }
    // US Dollar / Canadian / Australian / Singapore
    if (['$', 'CA$', 'A$', 'S$', 'NZ$'].includes(sym) || sym.endsWith('$')) {
      return [
        { value: 'Low', label: `Low (Under ${sym}30K)` },
        { value: 'Medium', label: `Medium (${sym}30K – ${sym}100K)` },
        { value: 'High', label: `High (Over ${sym}100K)` },
      ];
    }
    // British Pound
    if (sym === '£') {
      return [
        { value: 'Low', label: `Low (Under £20K)` },
        { value: 'Medium', label: `Medium (£20K – £80K)` },
        { value: 'High', label: `High (Over £80K)` },
      ];
    }
    // Euro
    if (sym === '€') {
      return [
        { value: 'Low', label: `Low (Under €25K)` },
        { value: 'Medium', label: `Medium (€25K – €90K)` },
        { value: 'High', label: `High (Over €90K)` },
      ];
    }
    // Japanese Yen
    if (sym === '¥' || sym === '円') {
      return [
        { value: 'Low', label: `Low (Under ¥4M)` },
        { value: 'Medium', label: `Medium (¥4M – ¥12M)` },
        { value: 'High', label: `High (Over ¥12M)` },
      ];
    }
    // Default generic
    return [
      { value: 'Low', label: `Low (${sym} Low Income)` },
      { value: 'Medium', label: `Medium (${sym} Middle Income)` },
      { value: 'High', label: `High (${sym} High Income)` },
    ];
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);

    if (!this.username || !this.password || !this.name || !this.email || !this.selectedCountry) {
      this.error.set('Please fill out all required fields.');
      return;
    }

    this.isRegistering.set(true);

    try {
      const success = await this.dataService.signup({
        username: this.username,
        password: this.password,
        name: this.name,
        email: this.email,
        country: this.selectedCountry,
        incomeBracket: this.incomeBracket || 'Medium'
      });

      if (!success) {
        this.error.set('Username or email already exists.');
        return;
      }

      const user = this.dataService.currentUser();
      if (user) {
        this.authService.setCurrentUser(user);
        await this.router.navigate(['/dashboard']);
      } else {
        await this.router.navigate(['/dashboard']);
      }
    } finally {
      this.isRegistering.set(false);
    }
  }

  protected goToLogin(): void {
    this.navigateToLogin.emit();
  }
}
