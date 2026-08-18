import { Component, ElementRef, ViewChild, inject, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatbotService } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes pulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
      50% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
    }
    .animate-slide-up {
      animation: slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .pulse-glow {
      animation: pulseGlow 2.5s infinite;
    }
  `],
  template: `
    <!-- Floating Chat Toggle Button -->
    <div class="fixed bottom-6 right-6 z-[1000] flex flex-col items-end pointer-events-auto">
      @if (!chatbotService.isOpen()) {
        <button
          type="button"
          (click)="chatbotService.toggleChat()"
          class="relative flex items-center gap-3 px-4 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xl shadow-indigo-600/30 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer pulse-glow group"
          aria-label="Open TaxPal Assist Chatbot"
        >
          <!-- Bot Icon -->
          <div class="relative shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>

          <span class="text-sm tracking-tight pr-1 font-bold hidden sm:inline">TaxPal Assist</span>

          <!-- Unread Badge -->
          @if (chatbotService.unreadCount() > 0) {
            <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-md animate-bounce">
              {{ chatbotService.unreadCount() }}
            </span>
          }
        </button>
      }

      <!-- Expandable Chat Panel Window -->
      @if (chatbotService.isOpen()) {
        <div
          class="w-[calc(100vw-2rem)] sm:w-[410px] h-[580px] max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-indigo-950/40 flex flex-col overflow-hidden animate-slide-up backdrop-blur-xl"
        >
          <!-- Header -->
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="relative w-9 h-9 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold shadow-inner">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5" />
                </svg>
                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white leading-none">TaxPal Assist</h3>
                <p class="text-[11px] font-medium text-emerald-400 mt-1 flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ChatBot
                </p>
              </div>
            </div>

            <!-- Header Action Controls -->
            <div class="flex items-center gap-1">
              <button
                type="button"
                (click)="chatbotService.clearChat()"
                title="Reset Conversation"
                class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              <button
                type="button"
                (click)="chatbotService.closeChat()"
                title="Close Assistant"
                class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Message History Container -->
          <div #scrollContainer class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth bg-slate-900/90 text-slate-200">
            @for (msg of chatbotService.messages(); track msg.id) {
              <div
                class="flex flex-col"
                [class.items-end]="msg.sender === 'user'"
                [class.items-start]="msg.sender === 'bot'"
              >
                <!-- Sender Badge -->
                <span class="text-[10px] font-medium text-slate-500 mb-1 px-1">
                  {{ msg.sender === 'user' ? 'You' : 'TaxPal Assist' }} • {{ msg.timestamp | date:'shortTime' }}
                </span>

                <!-- Message Content Bubble -->
                <div
                  class="max-w-[88%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm"
                  [class.bg-indigo-600]="msg.sender === 'user'"
                  [class.text-white]="msg.sender === 'user'"
                  [class.rounded-tr-xs]="msg.sender === 'user'"
                  [class.bg-slate-800]="msg.sender === 'bot'"
                  [class.text-slate-100]="msg.sender === 'bot'"
                  [class.border]="msg.sender === 'bot'"
                  [class.border-slate-700/80]="msg.sender === 'bot'"
                  [class.rounded-tl-xs]="msg.sender === 'bot'"
                >
                  <!-- Formatted HTML text content -->
                  <div [innerHTML]="formatMessage(msg.text)"></div>

                  <!-- Direct Router Navigation Action Button -->
                  @if (msg.actionRoute && msg.actionLabel) {
                    <div class="mt-3 pt-2.5 border-t border-slate-700/60">
                      <button
                        type="button"
                        (click)="navigateTo(msg.actionRoute)"
                        class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                      >
                        <span>{{ msg.actionLabel }}</span>
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>

                <!-- Quick Prompt Chips underneath Bot messages -->
                @if (msg.sender === 'bot' && msg.quickPrompts && msg.quickPrompts.length > 0) {
                  <div class="mt-2.5 flex flex-wrap gap-1.5 max-w-[92%]">
                    @for (prompt of msg.quickPrompts; track prompt) {
                      <button
                        type="button"
                        (click)="sendQuickPrompt(prompt)"
                        class="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-indigo-950 border border-slate-700 hover:border-indigo-500/50 text-[11px] font-medium text-slate-300 hover:text-indigo-300 transition-all cursor-pointer text-left"
                      >
                        💡 {{ prompt }}
                      </button>
                    }
                  </div>
                }
              </div>
            }

            <!-- Typing Indicator -->
            @if (chatbotService.isThinking()) {
              <div class="flex flex-col items-start">
                <span class="text-[10px] font-medium text-slate-500 mb-1 px-1">TaxPal Assist is searching...</span>
                <div class="bg-slate-800 border border-slate-700/80 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                  <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse [animation-delay:0.15s]"></span>
                  <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse [animation-delay:0.3s]"></span>
                </div>
              </div>
            }
          </div>

          <!-- Bottom Text Input Bar -->
          <div class="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
            <form (ngSubmit)="onSubmit()" class="flex items-center gap-2">
              <input
                type="text"
                [(ngModel)]="userQuery"
                name="userQuery"
                placeholder="Ask TaxPal Assist..."
                autocomplete="off"
                class="flex-1 bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-400 text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                [disabled]="!userQuery.trim() || chatbotService.isThinking()"
                class="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold transition-all cursor-pointer shrink-0 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L32 12M6 12l5-5m-5 5l5 5" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L18 6L14 12L18 18L6 12Z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ChatbotWidgetComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef;

  protected readonly chatbotService = inject(ChatbotService);
  private readonly router = inject(Router);

  userQuery = '';

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  onSubmit(): void {
    if (!this.userQuery.trim()) return;
    const query = this.userQuery;
    this.userQuery = '';
    this.chatbotService.sendMessage(query, this.router.url);
  }

  sendQuickPrompt(prompt: string): void {
    this.chatbotService.sendMessage(prompt, this.router.url);
  }

  navigateTo(route?: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  formatMessage(text: string): string {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold text **word** -> <strong>word</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');

    // Code ticks `code` -> <code class="...">code</code>
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-slate-700/80 px-1.5 py-0.5 rounded text-[11px] font-mono text-indigo-300">$1</code>');

    // Bullet points (- or *)
    formatted = formatted.replace(/^\s*[-•]\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>');

    // Newlines
    formatted = formatted.replace(/\n/g, '<br/>');

    return formatted;
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch {
      // Ignore scroll errors
    }
  }
}
