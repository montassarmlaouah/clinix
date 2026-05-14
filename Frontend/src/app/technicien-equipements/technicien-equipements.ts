import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TechnicienMaintenanceService } from '../service/technicien-maintenance.service';
import { Equipement, EtatTechnique } from '../model/materiel-medical';

@Component({
  selector: 'app-technicien-equipements',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './technicien-equipements.html',
  styleUrl: './technicien-equipements.css',
})
export class TechnicienEquipementsComponent implements OnInit {
  tous: Equipement[] = [];
  enPanne: Equipement[] = [];
  loading = false;
  error = '';
  messageSucces = '';
  noteAlerte = '';

  constructor(private readonly api: TechnicienMaintenanceService) {}

  ngOnInit(): void {
    this.recharger();
  }

  recharger(): void {
    this.loading = true;
    this.error = '';
    this.messageSucces = '';
    this.api.listerEquipementsMaClinique().subscribe({
      next: (rows) => {
        this.tous = rows || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les équipements (vérifiez votre rattachement clinique).';
        this.loading = false;
      },
    });
    this.api.listerEquipementsEnPanne().subscribe({
      next: (rows) => (this.enPanne = rows || []),
      error: () => (this.enPanne = []),
    });
  }

  libelleEtat(e: EtatTechnique | undefined): string {
    switch (e) {
      case EtatTechnique.EN_PANNE:
        return 'En panne';
      case EtatTechnique.HORS_SERVICE:
        return 'Hors service';
      case EtatTechnique.EN_MAINTENANCE:
        return 'En maintenance';
      case EtatTechnique.FONCTIONNEL:
        return 'Fonctionnel';
      default:
        return e || '—';
    }
  }

  envoyerAlerte(eq: Equipement): void {
    if (!eq.id) {
      return;
    }
    this.error = '';
    this.messageSucces = '';
    const note = this.noteAlerte?.trim() || undefined;
    this.api.renvoyerAlerteEmail(eq.id, note).subscribe({
      next: () => {
        this.messageSucces = `Alerte envoyée pour « ${eq.nom || eq.code} » (notifications + e-mails si le serveur mail est configuré).`;
        this.noteAlerte = '';
      },
      error: () => (this.error = "Impossible d'envoyer l'alerte (équipement hors périmètre ou état non éligible)."),
    });
  }
}
