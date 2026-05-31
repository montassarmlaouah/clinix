import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './medecin-urgences.html',
  styleUrl: './medecin-urgences.css',
})
export class MedecinUrgencesComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  actives: UrgenceVue[] = [];
  enAttente: UrgenceVue[] = [];
  loading = false;
  error = '';
  searchText = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loading = true;
    this.http.get<UrgenceVue[]>(`${this.api}/urgences/actives`).subscribe({
      next: (a) => {
        this.actives = a || [];
        this.loadEnAttente();
      },
      error: () => {
        this.error = 'Impossible de charger les urgences actives.';
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
        this.error = (this.error ? this.error + ' ' : '') + 'Impossible de charger la file d’attente.';
        this.loading = false;
      },
    });
  }

  get statActives(): number {
    return this.actives.length;
  }

  get statEnAttente(): number {
    return this.enAttente.length;
  }

  get statTotal(): number {
    return this.actives.length + this.enAttente.length;
  }

  get filteredActives(): UrgenceVue[] {
    return this.filterUrgences(this.actives);
  }

  get filteredEnAttente(): UrgenceVue[] {
    return this.filterUrgences(this.enAttente);
  }

  private filterUrgences(list: UrgenceVue[]): UrgenceVue[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((u) => {
      const patient = u.patient ? `${u.patient.prenom} ${u.patient.nom}`.toLowerCase() : '';
      const motif = (u.motif || u.description || '').toLowerCase();
      const niveau = (u.niveau || '').toLowerCase();
      return patient.includes(q) || motif.includes(q) || niveau.includes(q);
    });
  }

  libellePatient(u: UrgenceVue): string {
    if (!u.patient) {
      return '—';
    }
    return `${u.patient.prenom || ''} ${u.patient.nom || ''}`.trim() || '—';
  }

  libelleMotif(u: UrgenceVue): string {
    return u.motif || u.description || '—';
  }

  niveauClass(niveau?: string): string {
    const n = (niveau || '').toUpperCase();
    if (n.includes('CRIT') || n.includes('4') || n === 'ROUGE') {
      return 'niveau-pill niveau-critique';
    }
    if (n.includes('ELEV') || n.includes('3') || n === 'ORANGE') {
      return 'niveau-pill niveau-eleve';
    }
    if (n.includes('MOD') || n.includes('2') || n === 'JAUNE') {
      return 'niveau-pill niveau-modere';
    }
    if (n.includes('FAIB') || n.includes('1') || n === 'VERT') {
      return 'niveau-pill niveau-faible';
    }
    return 'niveau-pill niveau-neutral';
  }
}
