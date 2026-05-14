import { Component } from '@angular/core';
import { Footer } from "../../footer/footer";
import { RouterOutlet } from "@angular/router";
import { Header } from "../../header/header";
import { AuthService } from "../../service/auth-service";
import { CommonModule } from '@angular/common';
import { ChatbotComponent } from '../../chatbot/chatbot';

@Component({
  selector: 'app-main-layout',
  imports: [Footer, RouterOutlet, Header, CommonModule, ChatbotComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  constructor(public authService: AuthService) { }

  isSuperAdmin(): boolean {
    return this.authService.getRole() === 'SUPER_ADMIN';
  }

  isSidebarCollapsed = false;

  onSidebarToggle(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }
}
