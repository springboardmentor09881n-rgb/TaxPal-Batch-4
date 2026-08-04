import { Component, EventEmitter, Input, Output } from '@angular/core';

export type NotificationPriority = 'High' | 'Medium' | 'Low';

@Component({
  selector: 'app-tax-notification-panel',
  standalone: true,
  template: `
    <div
      class="relative w-full max-w-md rounded-2xl bg-white border border-slate-200/60 shadow-lg shadow-slate-900/5 p-5 sm:p-6"
      role="alert"
      aria-live="polite"
    >
      <div class="flex items-start gap-4">
        <!-- Bell icon -->
        <div class="shrink-0 h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center">
          <svg class="h-5.5 w-5.5" style="color:#2563EB" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-sm font-bold text-slate-900 tracking-tight">{{ title }}</h3>

            <!-- Priority badge -->
            <span
              class="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
              [class.bg-red-50]="priority === 'High'"
              [class.text-red-600]="priority === 'High'"
              [class.bg-amber-50]="priority === 'Medium'"
              [class.text-amber-600]="priority === 'Medium'"
              [class.bg-slate-100]="priority === 'Low'"
              [class.text-slate-500]="priority === 'Low'"
            >
              {{ priority }}
            </span>
          </div>

          <p class="mt-1.5 text-sm text-slate-500 leading-relaxed">{{ message }}</p>

          <!-- Due date -->
          <div class="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>Due {{ dueDate }}</span>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              (click)="viewCalendar.emit()"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer transition-colors"
              style="background-color:#2563EB"
              onmouseover="this.style.backgroundColor='#1d4ed8'"
              onmouseout="this.style.backgroundColor='#2563EB'"
            >
              View Calendar
            </button>
            <button
              type="button"
              (click)="markAsDone.emit()"
              class="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
            >
              Mark as Done
            </button>
          </div>
        </div>

        <!-- Dismiss -->
        <button
          type="button"
          (click)="dismiss.emit()"
          aria-label="Dismiss notification"
          class="shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `
})
export class TaxNotificationPanel {
  @Input() title = 'Quarterly Tax Reminder';
  @Input() message = '';
  @Input() dueDate = '';
  @Input() priority: NotificationPriority = 'High';

  @Output() viewCalendar = new EventEmitter<void>();
  @Output() markAsDone = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
}
