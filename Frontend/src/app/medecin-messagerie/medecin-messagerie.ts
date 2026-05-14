import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';

interface MessageInterneVue {
  id?: string;
  sujet?: string;
  contenu?: string;
  dateEnvoi?: string;
  expediteur?: { prenom?: string; nom?: string };
  lu?: boolean;
}

@Component({
  selector: 'app-medecin-messagerie',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './medecin-messagerie.html',
  styleUrl: './medecin-messagerie.css',
})
export class MedecinMessagerieComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  recus: MessageInterneVue[] = [];
  contacts: { id?: string; nom?: string; prenom?: string }[] = [];
  form = { destinataireId: '', sujet: '', contenu: '' };
  loading = false;
  error = '';
  success = '';

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const uid = this.auth.getUserId();
    if (!uid) {
      this.error = 'Utilisateur non identifié.';
      return;
    }
    this.loading = true;
    this.http.get<MessageInterneVue[]>(`${this.api}/messages/recus/${uid}`).subscribe({
      next: (data) => {
        this.recus = data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les messages.';
        this.loading = false;
      },
    });
    this.http.get<any[]>(`${this.api}/messages/contacts/${uid}`).subscribe({
      next: (c) => (this.contacts = c || []),
      error: () => {},
    });
  }

  envoyer(): void {
    const exp = this.auth.getUserId();
    if (!exp || !this.form.destinataireId || !this.form.contenu.trim()) {
      this.error = 'Destinataire et message obligatoires.';
      return;
    }
    this.error = '';
    this.http
      .post(`${this.api}/messages`, {
        expediteurId: exp,
        destinataireId: this.form.destinataireId,
        sujet: this.form.sujet || '(sans sujet)',
        contenu: this.form.contenu.trim(),
      })
      .subscribe({
        next: () => {
          this.success = 'Message envoyé.';
          this.form = { destinataireId: '', sujet: '', contenu: '' };
          setTimeout(() => (this.success = ''), 3000);
        },
        error: () => (this.error = 'Envoi impossible.'),
      });
  }
}
