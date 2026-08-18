import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatMessage, ChatbotResponse } from '../models';
import { environment } from '../../environments/environment';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private http = inject(HttpClient);

  readonly messages = signal<ChatMessage[]>([]);
  readonly isOpen = signal<boolean>(false);
  readonly isThinking = signal<boolean>(false);
  readonly unreadCount = signal<number>(0);

  constructor() {
    this.initWelcomeMessage();
  }

  initWelcomeMessage(): void {
    const welcomeMsg: ChatMessage = {
      id: 'welcome-1',
      sender: 'bot',
      text: `👋 Hi! I'm **TaxPal Assist**. How can I help you manage your transactions, budgets, or tax calculations today?`,
      timestamp: new Date(),
      quickPrompts: [
        'What is Smart Auto-Categorization?',
        'How to set monthly budgets?',
        'How does Tax Estimator work?',
        'How to add custom categories?'
      ]
    };
    this.messages.set([welcomeMsg]);
  }

  toggleChat(): void {
    const newState = !this.isOpen();
    this.isOpen.set(newState);
    if (newState) {
      this.unreadCount.set(0);
    }
  }

  openChat(): void {
    this.isOpen.set(true);
    this.unreadCount.set(0);
  }

  closeChat(): void {
    this.isOpen.set(false);
  }

  sendMessage(query: string, currentRoute?: string): void {
    const cleanQuery = query ? query.trim() : '';
    if (!cleanQuery) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: cleanQuery,
      timestamp: new Date()
    };

    this.messages.update(msgs => [...msgs, userMsg]);
    this.isThinking.set(true);

    this.http.post<ChatbotResponse>(`${environment.apiUrl}/chatbot/query`, {
      query: cleanQuery,
      currentRoute
    }).pipe(
      catchError(() => {
        return of<ChatbotResponse>({
          success: false,
          answer: `I'm having trouble connecting right now. Please make sure the TaxPal backend service is running!`,
          quickPrompts: [
            'What is Smart Auto-Categorization?',
            'How to set monthly budgets?',
            'How does Tax Estimator work?'
          ]
        });
      }),
      finalize(() => {
        this.isThinking.set(false);
      })
    ).subscribe(res => {
      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: 'bot',
        text: res.answer || 'No response available.',
        timestamp: new Date(),
        category: res.category,
        actionRoute: res.actionRoute,
        actionLabel: res.actionLabel,
        downloadUrl: res.downloadUrl,
        downloadLabel: res.downloadLabel,
        downloadFilename: res.downloadFilename,
        quickPrompts: res.quickPrompts || []
      };

      this.messages.update(msgs => [...msgs, botMsg]);

      if (!this.isOpen()) {
        this.unreadCount.update(count => count + 1);
      }
    });
  }

  clearChat(): void {
    this.initWelcomeMessage();
  }
}
