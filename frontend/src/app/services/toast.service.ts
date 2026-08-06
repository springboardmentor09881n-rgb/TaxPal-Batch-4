import { Injectable, signal } from '@angular/core';

export interface ErrorToast {
  id: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly errors = signal<ErrorToast[]>([]);

  showError(message: string, duration = 5000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ErrorToast = { id, message };
    this.errors.update(current => [...current, newToast]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string): void {
    this.errors.update(current => current.filter(t => t.id !== id));
  }
}
