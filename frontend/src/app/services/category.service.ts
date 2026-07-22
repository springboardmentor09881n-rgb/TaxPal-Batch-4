import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

  readonly categories = signal<Category[]>([]);

  loadCategories(): void {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => {
        this.categories.set(res || []);
      },
      error: (err) => console.error('Failed to load categories', err)
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
    return this.http.post<Category>(`${environment.apiUrl}/categories`, category).pipe(
      tap((newCat) => {
        const current = this.categories();
        this.categories.set([...current, newCat]);
      })
    );
  }

  updateCategory(id: string, category: any): Observable<Category> {
    return this.http.put<Category>(`${environment.apiUrl}/categories/${id}`, category).pipe(
      tap((updatedCat) => {
        const current = this.categories().map(c => c._id === id || c.id === id ? { ...c, ...updatedCat } : c);
        this.categories.set(current);
      })
    );
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/categories/${id}`).pipe(
      tap(() => {
        this.categories.set(this.categories().filter((item: Category) => item._id !== id && item.id !== id));
      })
    );
  }
}
