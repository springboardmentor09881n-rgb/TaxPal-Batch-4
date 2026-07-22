import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
