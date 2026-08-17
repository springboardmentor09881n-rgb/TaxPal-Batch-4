import { Injectable, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
  title?: string;
}

// Backward compatibility alias for ErrorToast
export type ErrorToast = ToastItem;

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastItem[]>([]);

  // Backward compatibility alias getter
  get errors() {
    return this.toasts;
  }

  showError(message: string, duration = 5000): void {
    this.showToast(message, 'error', 'Error', duration);
  }

  showSuccess(message: string, duration = 4000): void {
    this.showToast(message, 'success', 'Success', duration);
  }

  private showToast(message: string, type: 'success' | 'error', title: string, duration: number): void {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message, type, title };
    this.toasts.update(current => [...current, newToast]);
    setTimeout(() => this.dismiss(id), duration);
  }

  dismiss(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
