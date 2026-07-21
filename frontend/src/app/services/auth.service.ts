import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  readonly currentUser = signal<User | null>(null);

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(res => {
        const user = this.normalizeUser({ ...res.user, token: res.token });
        this.currentUser.set(user);
        sessionStorage.setItem('tp_active_user', JSON.stringify(user));
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, userData);
  }

  /** Set the current user directly (used after dataService login) */
  setCurrentUser(user: any): void {
    const normalized = this.normalizeUser(user);
    this.currentUser.set(normalized);
    sessionStorage.setItem('tp_active_user', JSON.stringify(normalized));
  }

  logout(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem('tp_active_user');
    sessionStorage.removeItem('tp_token');
  }

  restoreSession(): void {
    const sessionUser = sessionStorage.getItem('tp_active_user');
    if (sessionUser) {
      this.currentUser.set(this.normalizeUser(JSON.parse(sessionUser)));
    }
  }

  /** Normalize user object so both fullName and name are always set */
  private normalizeUser(user: any): any {
    return {
      ...user,
      id: user.id || user._id,
      name: user.name || user.fullName || user.username || 'User',
      fullName: user.fullName || user.name || user.username || 'User',
    };
  }

  isAuthenticated(): boolean {
    return !!this.currentUser() || !!sessionStorage.getItem('tp_active_user');
  }
}
