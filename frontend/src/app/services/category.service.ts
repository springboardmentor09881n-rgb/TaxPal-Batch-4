import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DataService } from './data.service';
import { ToastService } from './toast.service';

const DEFAULT_CATEGORIES: Category[] = [
  // Expense Categories
  { name: 'Office Rent', type: 'expense', color: '#3b82f6' },
  { name: 'Business Expenses', type: 'expense', color: '#10b981' },
  { name: 'Utilities', type: 'expense', color: '#f59e0b' },
  { name: 'Food', type: 'expense', color: '#ef4444' },
  { name: 'Software Subscriptions', type: 'expense', color: '#8b5cf6' },
  { name: 'Professional Development', type: 'expense', color: '#ec4899' },
  { name: 'Marketing', type: 'expense', color: '#06b6d4' },
  { name: 'Travel', type: 'expense', color: '#f97316' },
  { name: 'Meals & Entertainment', type: 'expense', color: '#6366f1' },
  { name: 'Housing', type: 'expense', color: '#3b82f6' },
  { name: 'Transportation', type: 'expense', color: '#f59e0b' },
  { name: 'Shopping', type: 'expense', color: '#ec4899' },
  { name: 'Other', type: 'expense', color: '#64748b' },
  // Income Categories
  { name: 'Consulting', type: 'income', color: '#10b981' },
  { name: 'Design Project', type: 'income', color: '#3b82f6' },
  { name: 'SaaS Subscriptions', type: 'income', color: '#8b5cf6' },
  { name: 'Ad Revenue', type: 'income', color: '#f59e0b' },
  { name: 'Other', type: 'income', color: '#64748b' }
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private dataService = inject(DataService);
  private toastService = inject(ToastService);

  readonly categories = this.dataService.categories;

  private getAuthOptions() {
    const token = localStorage.getItem('tp_token') || sessionStorage.getItem('tp_token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  }

  loadCategories(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`, this.getAuthOptions()).pipe(
      catchError((err) => {
        this.toastService.showError('Failed to load categories from backend. Using local backup.');
        const userId = this.dataService.currentUser()?.id;
        if (userId) {
          const local = JSON.parse(localStorage.getItem('tp_categories') || '[]');
          this.dataService.categories.set(local.filter((c: any) => c.userId === userId));
        }
        return of([]);
      })
    ).subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.dataService.categories.set(res);
          localStorage.setItem('tp_categories', JSON.stringify(res));
        }
      }
    });
  }

  mergedCategories(type?: 'income' | 'expense'): Category[] {
    const dbCats = this.categories();
    const filteredDefaults = type ? DEFAULT_CATEGORIES.filter(c => c.type === type) : DEFAULT_CATEGORIES;
    const filteredDb = type ? dbCats.filter(c => c.type === type) : dbCats;

    const seenNames = new Set<string>();
    const result: Category[] = [];

    // DB categories take priority
    for (const c of filteredDb) {
      const key = `${c.type}:${c.name.trim().toLowerCase()}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        result.push(c);
      }
    }

    // Append default categories if not already defined in DB
    for (const c of filteredDefaults) {
      const key = `${c.type}:${c.name.trim().toLowerCase()}`;
      if (!seenNames.has(key)) {
        seenNames.add(key);
        result.push(c);
      }
    }

    return result;
  }

  addCategory(category: any): Observable<Category> {
    return this.http.post<Category>(`${environment.apiUrl}/categories`, category, this.getAuthOptions()).pipe(
      tap((newCat) => {
        const current = this.dataService.categories();
        this.dataService.categories.set([...current, newCat]);

        // Sync localStorage
        const local = JSON.parse(localStorage.getItem('tp_categories') || '[]');
        localStorage.setItem('tp_categories', JSON.stringify([...local, newCat]));
      }),
      catchError((err) => {
        this.toastService.showError('Failed to save category on server.');
        throw err;
      })
    );
  }

  updateCategory(id: string, category: any): Observable<Category> {
    return this.http.put<Category>(`${environment.apiUrl}/categories/${id}`, category, this.getAuthOptions()).pipe(
      tap((updatedCat) => {
        const current = this.dataService.categories().map(c => c._id === id || c.id === id ? { ...c, ...updatedCat } : c);
        this.dataService.categories.set(current);

        // Sync localStorage
        const local = JSON.parse(localStorage.getItem('tp_categories') || '[]');
        const updatedLocal = local.map((c: any) => (c._id === id || c.id === id) ? { ...c, ...updatedCat } : c);
        localStorage.setItem('tp_categories', JSON.stringify(updatedLocal));
      }),
      catchError((err) => {
        this.toastService.showError('Failed to update category on server.');
        throw err;
      })
    );
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/categories/${id}`, this.getAuthOptions()).pipe(
      tap(() => {
        this.dataService.categories.set(this.dataService.categories().filter((item: Category) => item._id !== id && item.id !== id));

        // Sync localStorage
        const local = JSON.parse(localStorage.getItem('tp_categories') || '[]');
        localStorage.setItem('tp_categories', JSON.stringify(local.filter((item: any) => item._id !== id && item.id !== id)));
      }),
      catchError((err) => {
        this.toastService.showError('Failed to delete category on server.');
        throw err;
      })
    );
  }

  suggestCategory(description: string, type: 'income' | 'expense'): string | null {
    const text = (description || '').trim().toLowerCase();
    if (!text) return null;

    const availableCategories = this.mergedCategories(type);
    if (!availableCategories || availableCategories.length === 0) return null;

    const categoryNames = availableCategories.map(c => c.name);

    // Rule dictionary mapping keywords to potential category names
    const rules: { keywords: string[]; category: string }[] = type === 'expense' ? [
      { keywords: ['rent', 'pg', 'flat', 'lease', 'hotdesk', 'office rent'], category: 'Office Rent' },
      { keywords: ['housing', 'apartment', 'mortgage'], category: 'Housing' },
      { keywords: ['aws', 'hosting', 'server', 'cloud', 'domain', 'azure', 'gcp'], category: 'Business Expenses' },
      { keywords: ['uber', 'ola', 'flight', 'train', 'cab', 'petrol', 'diesel', 'fuel', 'taxi', 'outstation', 'airfare'], category: 'Travel' },
      { keywords: ['bus', 'metro', 'commute', 'transit', 'transport'], category: 'Transportation' },
      { keywords: ['swiggy', 'zomato', 'food', 'lunch', 'dinner', 'cafe', 'restaurant', 'coffee', 'starbucks', 'mcdonalds', 'meal', 'snacks', 'eating out'], category: 'Meals & Entertainment' },
      { keywords: ['groceries', 'supermarket', 'vegetables', 'fruits'], category: 'Food' },
      { keywords: ['slack', 'github', 'chatgpt', 'zoom', 'software', 'saas', 'subscription', 'notion', 'figma', 'jetbrains', 'adobe', 'netflix', 'spotify'], category: 'Software Subscriptions' },
      { keywords: ['wifi', 'internet', 'electricity', 'water', 'utility', 'broadband', 'recharge', 'mobile bill', 'power'], category: 'Utilities' },
      { keywords: ['course', 'udemy', 'coursera', 'book', 'certification', 'training', 'workshop', 'tuition'], category: 'Professional Development' },
      { keywords: ['ads', 'facebook ads', 'google ads', 'campaign', 'marketing', 'promotion', 'flyer', 'adverts'], category: 'Marketing' },
      { keywords: ['shirt', 'clothes', 'amazon', 'flipkart', 'shopping', 'shoes', 'electronics', 'gadget'], category: 'Shopping' }
    ] : [
      { keywords: ['design', 'client project', 'freelance project', 'ui/ux', 'website design'], category: 'Design Project' },
      { keywords: ['consulting', 'advisor', 'consultant', 'review', 'coaching'], category: 'Consulting' },
      { keywords: ['saas', 'subscription payout', 'app sales', 'mrr'], category: 'SaaS Subscriptions' },
      { keywords: ['ad revenue', 'adsense', 'youtube', 'monetization', 'sponsorship'], category: 'Ad Revenue' },
      { keywords: ['salary', 'stipend', 'payroll', 'wages', 'bonus'], category: 'Consulting' }
    ];

    // Try matching rules
    for (const rule of rules) {
      if (rule.keywords.some(kw => text.includes(kw))) {
        const match = categoryNames.find(c => c.toLowerCase() === rule.category.toLowerCase());
        if (match) return match;
      }
    }

    // Fallback
    for (const catName of categoryNames) {
      if (catName.toLowerCase() !== 'other' && text.includes(catName.toLowerCase())) {
        return catName;
      }
    }

    return null;
  }
}
