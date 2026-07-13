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
        const user = { ...res.user, token: res.token };
        this.currentUser.set(user);
        sessionStorage.setItem('tp_active_user', JSON.stringify(user));
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem('tp_active_user');
  }

  restoreSession(): void {
    const sessionUser = sessionStorage.getItem('tp_active_user');
    if (sessionUser) {
      this.currentUser.set(JSON.parse(sessionUser));
    }
  }

  isAuthenticated(): boolean {
    return !!this.currentUser() || !!sessionStorage.getItem('tp_active_user');
  }
}
