import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { InfirmierWorkspaceService } from '../service/infirmier-workspace.service';
import { environment } from '../../environments/environment';
import { AdministrationTraitement } from '../model/administration-traitement';

@Component({
  selector: 'app-infirmier-taches-soins',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './infirmier-taches-soins.html',
  styleUrl: './infirmier-taches-soins.css',
})
export class InfirmierTachesSoinsComponent implements OnInit {
  private api = `${environment.apiUrl}/api/administrations`;

  infirmierId: string | null = null;
  taches: AdministrationTraitement[] = [];
  rapportMessage = '';
  signalement = { medecinId: '', patientId: '', message: '' };
  medecins: any[] = [];
  patients: any[] = [];
  success = '';
  error = '';

  constructor(
    private http: HttpClient,
    public auth: AuthService,
    private workspace: InfirmierWorkspaceService
  ) {}

  ngOnInit(): void {
    this.infirmierId = this.auth.getUserId();
    if (!this.infirmierId) {
      this.error = 'Session infirmier invalide.';
      return;
    }
    this.charger();
    const cid = this.auth.getCliniqueId();
    if (cid) {
      this.http.get<any[]>(`${environment.apiUrl}/api/medecins/clinique/${cid}`).subscribe({
        next: (d) => (this.medecins = d || []),
        error: () => {},
      });
      this.http.get<any[]>(`${environment.apiUrl}/api/patients/clinique/${cid}`).subscribe({
        next: (d) => (this.patients = d || []),
        error: () => {},
      });
    }
  }

  charger(): void {
    if (!this.infirmierId) return;
    this.http.get<AdministrationTraitement[]>(`${this.api}/infirmier/${this.infirmierId}`).subscribe({
      next: (d) => {
        this.taches = d || [];
        for (const t of this.taches) {
          (t as any)._remarqueDraft = t.remarquesInfirmier || '';
          (t as any)._pjUrl = t.pieceJointeUrl || '';
        }
      },
      error: () => (this.error = 'Impossible de charger les tâches.'),
    });
  }

  statut(t: AdministrationTraitement): string {
    if (t.statutExecution) return t.statutExecution;
    return t.administre ? 'REALISE' : 'PLANIFIE';
  }

  patchStatut(t: AdministrationTraitement, statut: string): void {
    if (!t.id) return;
    this.error = '';
    this.success = '';
    const remarques = (t as any)._remarqueDraft || '';
    this.http
      .patch<AdministrationTraitement>(`${this.api}/${t.id}/statut-execution`, { statut, remarques })
      .subscribe({
        next: () => {
          this.success = 'Statut mis à jour.';
          this.charger();
        },
        error: () => (this.error = 'Mise à jour impossible.'),
      });
  }

  toggleUrgent(t: AdministrationTraitement): void {
    if (!t.id) return;
    const urgent = !t.prioriteUrgente;
    this.http.patch(`${this.api}/${t.id}/priorite-urgente`, { urgent }).subscribe({
      next: () => this.charger(),
      error: () => (this.error = 'Impossible de modifier la priorité.'),
    });
  }

  enregistrerPieceJointe(t: AdministrationTraitement): void {
    const url = (t as any)._pjUrl;
    if (!t.id || !url?.trim()) return;
    this.http.patch(`${this.api}/${t.id}/piece-jointe`, { url: url.trim() }).subscribe({
      next: () => {
        this.success = 'Lien enregistré.';
        this.charger();
      },
      error: () => (this.error = 'Enregistrement du lien impossible.'),
    });
  }

  envoyerRapport(): void {
    if (!this.infirmierId || !this.rapportMessage.trim()) return;
    this.workspace.rapportFinJournee(this.infirmierId, this.rapportMessage.trim()).subscribe({
      next: () => {
        this.success = 'Rapport transmis aux médecins de la clinique.';
        this.rapportMessage = '';
      },
      error: () => (this.error = 'Envoi du rapport impossible.'),
    });
  }

  envoyerSignalement(): void {
    if (!this.infirmierId || !this.signalement.medecinId || !this.signalement.message.trim()) {
      this.error = 'Médecin et message obligatoires.';
      return;
    }
    this.workspace
      .signalementMedecin(this.infirmierId, {
        medecinId: this.signalement.medecinId,
        patientId: this.signalement.patientId || undefined,
        message: this.signalement.message.trim(),
      })
      .subscribe({
        next: () => {
          this.success = 'Signalement envoyé au médecin.';
          this.signalement = { medecinId: '', patientId: '', message: '' };
        },
        error: () => (this.error = 'Signalement impossible.'),
      });
  }

  nomPatient(t: AdministrationTraitement): string {
    const p = t.patient as any;
    if (!p) return '—';
    return `${p.prenom || ''} ${p.nom || ''}`.trim() || '—';
  }
}
