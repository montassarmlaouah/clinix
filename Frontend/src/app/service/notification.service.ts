import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id: number;
  titre: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  lu: boolean;
  dateCreation: string;
  destinataireId?: number | null;
  destinataireIdStr?: string | null;
  code?: string | null;
  actionUrl?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/api/notifications`;
  private readonly countRefresh$ = new Subject<void>();

  constructor(private http: HttpClient) { }

  /** Demande au header (et autres composants) de recharger le badge de notifications. */
  requestCountRefresh(): void {
    this.countRefresh$.next();
  }

  onCountRefreshRequested(): Observable<void> {
    return this.countRefresh$.asObservable();
  }

  // Récupérer toutes les notifications
  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  // Récupérer les notifications non lues
  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/non-lues`);
  }

  // Récupérer les notifications du jour
  getTodayNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/aujourdhui`);
  }

  // Marquer une notification comme lue
  markAsRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/marquer-lue`, {});
  }

  // Marquer toutes les notifications comme lues
  markAllAsRead(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/marquer-toutes-lues`, {});
  }

  // Supprimer une notification
  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Obtenir le nombre de notifications non lues
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/non-lues/count`);
  }
}
