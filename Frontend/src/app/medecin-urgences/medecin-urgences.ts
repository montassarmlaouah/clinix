import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';

/** Aligné sur le modèle backend Urgence (champs optionnels selon sérialisation). */
export interface UrgenceVue {
  id?: string;
  motif?: string;
  description?: string;
  niveau?: string;
  dateHeure?: string;
  patient?: { prenom?: string; nom?: string };
}

@Component({
  selector: 'app-medecin-urgences',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './medecin-urgences.html',
  styleUrl: './medecin-urgences.css',
})
export class MedecinUrgencesComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  actives: UrgenceVue[] = [];
  enAttente: UrgenceVue[] = [];
  loading = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    this.http.get<UrgenceVue[]>(`${this.api}/urgences/actives`).subscribe({
      next: (a) => {
        this.actives = a || [];
        this.loadEnAttente();
      },
      error: () => {
        this.error = 'Erreur chargement urgences actives.';
        this.loading = false;
      },
    });
  }

  private loadEnAttente(): void {
    this.http.get<UrgenceVue[]>(`${this.api}/urgences/en-attente`).subscribe({
      next: (e) => {
        this.enAttente = e || [];
        this.loading = false;
      },
      error: () => {
        this.error = (this.error ? this.error + ' ' : '') + 'Erreur file d’attente.';
        this.loading = false;
      },
    });
  }
}
