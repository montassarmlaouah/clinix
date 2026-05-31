import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ChatService } from '../service/chat.service';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent {
  isOpen = false;
  isMinimized = false;
  isLoading = false;
  messages: Message[] = [
    {
      text: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
      isBot: true,
      timestamp: new Date()
    }
  ];
  userMessage = '';

  constructor(private chat: ChatService) {}

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.isMinimized = false;
    }
  }

  minimizeChat(): void {
    this.isMinimized = !this.isMinimized;
  }

  closeChat(): void {
    this.isOpen = false;
    this.isMinimized = false;
  }

  sendMessage(): void {
    if (!this.userMessage.trim() || this.isLoading) return;

    // Ajouter le message utilisateur
    this.messages.push({
      text: this.userMessage,
      isBot: false,
      timestamp: new Date()
    });

    const userMsg = this.userMessage;
    this.userMessage = '';
    this.isLoading = true;

    this.chat
      .ask(userMsg)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (reply) => {
          this.messages.push({
            text: reply || 'Je n’ai pas de réponse pour le moment. Réessayez.',
            isBot: true,
            timestamp: new Date(),
          });
          this.scrollToBottom();
        },
        error: (err) => {
          const body = err?.error;
          const msg =
            (typeof body === 'string' ? body : body?.message) ||
            (err?.status === 429
              ? 'Limite Gemini atteinte. Attendez une minute puis réessayez.'
              : err?.status === 503
                ? 'Assistant non configuré (clé Gemini manquante côté serveur).'
                : 'Erreur : impossible de contacter le serveur.');
          this.messages.push({
            text: String(msg),
            isBot: true,
            timestamp: new Date(),
          });
          this.scrollToBottom();
        },
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const chatBody = document.querySelector('.chat-messages');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }, 100);
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
