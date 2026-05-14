import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { RendezVousService } from '../service/rendez-vous.service';
import { RendezVous } from '../model/rendez-vous';

@Component({
  selector: 'app-infirmier-visites-jour',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './infirmier-visites-jour.html',
  styleUrl: './infirmier-visites-jour.css',
})
export class InfirmierVisitesJourComponent implements OnInit {
  cliniqueId: string | null = null;
  dateJour = '';
  visites: RendezVous[] = [];
  success = '';
  error = '';

  constructor(
    public auth: AuthService,
    private rdv: RendezVousService
  ) {}

  ngOnInit(): void {
    this.cliniqueId = this.auth.getCliniqueId();
    const d = new Date();
    this.dateJour = d.toISOString().slice(0, 10);
    if (this.cliniqueId) {
      this.charger();
    } else {
      this.error = 'Clinique non identifiée dans la session.';
    }
  }

  charger(): void {
    if (!this.cliniqueId) return;
    this.error = '';
    this.success = '';
    this.rdv.listerCliniquePourJour(this.cliniqueId, this.dateJour).subscribe({
      next: (v) => (this.visites = v || []),
      error: () => (this.error = 'Impossible de charger les visites.'),
    });
  }

  nomPatient(r: RendezVous): string {
    const p = r.patient as any;
    if (!p) return '—';
    return `${p.prenom || ''} ${p.nom || ''}`.trim() || '—';
  }

  adressePatient(r: RendezVous): string {
    const p = r.patient as any;
    return (p?.adresse || '').trim();
  }

  lienCarte(adresse: string): string {
    if (!adresse) return '#';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(adresse)}`;
  }

  validerVisite(r: RendezVous): void {
    if (!r.id || r.visiteValideeParInfirmier) return;
    const obs = (r as any)._obsVisite || '';
    this.rdv.validationVisiteInfirmier(r.id, { observations: obs || undefined, signer: true }).subscribe({
      next: (updated) => {
        Object.assign(r, updated);
        this.success = 'Visite validée (horodatage + trace de signature enregistrés).';
      },
      error: (e) => (this.error = e.error?.message || 'Validation impossible.'),
    });
  }
}
