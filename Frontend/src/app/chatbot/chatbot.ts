import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  messages: Message[] = [
    {
      text: 'Bonjour! Comment puis-je vous aider aujourd\'hui?',
      isBot: true,
      timestamp: new Date()
    }
  ];
  userMessage = '';

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
    if (!this.userMessage.trim()) return;

    // Ajouter le message utilisateur
    this.messages.push({
      text: this.userMessage,
      isBot: false,
      timestamp: new Date()
    });

    const userMsg = this.userMessage.toLowerCase();
    this.userMessage = '';

    // Simuler une réponse du bot
    setTimeout(() => {
      this.messages.push({
        text: this.getBotResponse(userMsg),
        isBot: true,
        timestamp: new Date()
      });
      this.scrollToBottom();
    }, 500);
  }

  private getBotResponse(message: string): string {
    // Réponses simples basées sur les mots-clés
    if (message.includes('bonjour') || message.includes('salut')) {
      return 'Bonjour! Comment puis-je vous aider aujourd\'hui?';
    } else if (message.includes('aide') || message.includes('help')) {
      return 'Je peux vous aider avec:\n• Informations sur les services\n• Prise de rendez-vous\n• Gestion des patients\n• Questions générales';
    } else if (message.includes('rendez-vous') || message.includes('rdv')) {
      return 'Pour prendre un rendez-vous, veuillez accéder à la section "Rendez-vous" dans le menu.';
    } else if (message.includes('service')) {
      return 'Vous pouvez gérer les services médicaux dans la section "Services Médicaux" du menu.';
    } else if (message.includes('patient')) {
      return 'La gestion des patients est disponible dans la section "Patients" du menu.';
    } else if (message.includes('merci')) {
      return 'De rien! N\'hésitez pas si vous avez d\'autres questions.';
    } else {
      return 'Je suis là pour vous aider. Pouvez-vous reformuler votre question ou taper "aide" pour voir ce que je peux faire?';
    }
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
