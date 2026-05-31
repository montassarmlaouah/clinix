import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotificationService, Notification } from '../service/notification.service';
import { AuthService } from '../service/auth-service';

export interface RoleNotificationGuide {
  roleKeys: string[];
  title: string;
  icon: string;
  received: string[];
  generated: string[];
  description: string;
}

@Component({
  selector: 'app-notifaction',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './notifaction.html',
  styleUrl: './notifaction.css',
})
export class Notifaction implements OnInit {
  notifications: Notification[] = [];
  todayNotifications: Notification[] = [];
  unreadCount: number = 0;
  loading: boolean = false;
  error: string | null = null;
  searchText = '';
  guideExpanded = false;
  expandedRoleIndex: number | null = null;

  constructor(
    private notificationService: NotificationService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadTodayNotifications();
    this.loadUnreadCount();
  }

  get unreadToday(): number {
    return this.todayNotifications.filter((n) => !n.lu).length;
  }

  get readToday(): number {
    return this.todayNotifications.length - this.unreadToday;
  }

  get filteredNotifications(): Notification[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.todayNotifications;
    return this.todayNotifications.filter((n) => {
      const titre = (n.titre || '').toLowerCase();
      const message = (n.message || '').toLowerCase();
      const type = (n.type || '').toLowerCase();
      return titre.includes(q) || message.includes(q) || type.includes(q);
    });
  }

  trackByNotifId(_index: number, n: Notification): number {
    return n.id;
  }

  libelleType(type: string | undefined): string {
    switch ((type || '').toUpperCase()) {
      case 'SUCCESS':
        return 'Succès';
      case 'WARNING':
        return 'Attention';
      case 'ERROR':
        return 'Erreur';
      default:
        return 'Information';
    }
  }

  loadTodayNotifications(): void {
    this.loading = true;
    this.error = null;
    this.notificationService.getTodayNotifications().subscribe({
      next: (data) => {
        this.todayNotifications = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des notifications';
        this.loading = false;
        console.error('Erreur:', err);
      },
    });
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCount = count;
      },
      error: (err) => {
        console.error('Erreur lors du comptage des notifications non lues:', err);
      },
    });
  }

  markAsRead(notification: Notification): void {
    if (!notification.lu) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.lu = true;
          this.loadUnreadCount();
          this.notificationService.requestCountRefresh();
        },
        error: (err) => {
          console.error('Erreur lors du marquage comme lu:', err);
        },
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.todayNotifications.forEach((n) => (n.lu = true));
        this.loadUnreadCount();
        this.notificationService.requestCountRefresh();
      },
      error: (err) => {
        console.error('Erreur lors du marquage de toutes les notifications:', err);
      },
    });
  }

  deleteNotification(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer cette notification?')) {
      this.notificationService.deleteNotification(id).subscribe({
        next: () => {
          this.todayNotifications = this.todayNotifications.filter((n) => n.id !== id);
          this.loadUnreadCount();
          this.notificationService.requestCountRefresh();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
        },
      });
    }
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'SUCCESS':
        return 'bi-check-circle-fill';
      case 'WARNING':
        return 'bi-exclamation-triangle-fill';
      case 'ERROR':
        return 'bi-x-circle-fill';
      default:
        return 'bi-info-circle-fill';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'SUCCESS':
        return 'notification-success';
      case 'WARNING':
        return 'notification-warning';
      case 'ERROR':
        return 'notification-error';
      default:
        return 'notification-info';
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  lienNotificationAutorise(n: Notification): boolean {
    return this.auth.peutAccederNotificationLien(n.actionUrl);
  }
}
