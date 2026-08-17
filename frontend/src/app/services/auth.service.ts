import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly currentUser = signal<User | null>(null);

  constructor() {
    this.restoreSession();
  }

  public restoreSession(): void {
    const sessionUser = sessionStorage.getItem('tp_active_user');
    if (sessionUser) {
      try {
        const parsedUser = JSON.parse(sessionUser);
        this.currentUser.set(this.normalizeUser(parsedUser));
      } catch {
        this.logout();
      }
    }
  }

  public async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ token: string; user: any }>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
          catchError(() => of(null))
        )
      );

      if (response?.token && response.user) {
        const normalizedUser = this.normalizeUser({
          ...response.user,
          token: response.token,
        });
        sessionStorage.setItem('tp_token', response.token);
        sessionStorage.setItem('tp_active_user', JSON.stringify(normalizedUser));
        this.currentUser.set(normalizedUser);
        return true;
      }
    } catch {
      // Return false on error
    }
    return false;
  }

  public async signup(signupData: any): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/register`, {
          username: signupData.username,
          password: signupData.password,
          fullName: signupData.name || signupData.fullName,
          email: signupData.email,
          country: signupData.country || 'India',
          incomeBracket: signupData.incomeBracket || 'Medium'
        }).pipe(catchError(() => of(null)))
      );

      if (response) {
        return this.login(signupData.username, signupData.password);
      }
    } catch {
      // Return false on error
    }
    return false;
  }

  public async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ message: string }>(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
          catchError((err) => of({ message: err?.error?.message || 'Error sending reset email.' }))
        )
      );
      return { success: true, message: response?.message || 'Reset email sent.' };
    } catch {
      return { success: false, message: 'Unable to connect. Please try again.' };
    }
  }

  public async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, { token, newPassword }).pipe(
          catchError((err) => of({ message: err?.error?.message || 'Reset failed.', __error: true } as any))
        )
      );
      if ((response as any).__error) {
        return { success: false, message: response.message };
      }
      return { success: true, message: response.message };
    } catch {
      return { success: false, message: 'Unable to connect. Please try again.' };
    }
  }

  public async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ message: string }>(
          `${this.apiUrl}/auth/change-password`,
          { currentPassword, newPassword }
        ).pipe(
          catchError((err) => of({ message: err?.error?.message || 'Password update failed.', __error: true } as any))
        )
      );
      if ((response as any).__error) {
        return { success: false, message: response.message };
      }
      return { success: true, message: response.message };
    } catch {
      return { success: false, message: 'Unable to connect. Please try again.' };
    }
  }

  public setCurrentUser(user: any): void {
    const normalized = this.normalizeUser(user);
    this.currentUser.set(normalized);
    sessionStorage.setItem('tp_active_user', JSON.stringify(normalized));
  }

  public logout(): void {
    sessionStorage.removeItem('tp_token');
    sessionStorage.removeItem('tp_active_user');
    this.currentUser.set(null);
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser() || !!sessionStorage.getItem('tp_token');
  }

  private normalizeUser(user: any): User {
    return {
      ...user,
      id: user.id || user._id,
      name: user.name || user.fullName || user.username || 'User',
      fullName: user.fullName || user.name || user.username || 'User',
    };
  }
}
