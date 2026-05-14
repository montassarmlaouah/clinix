import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { PatientService } from '../service/patient-service';
import { MedecinWorkspaceService } from '../service/medecin-workspace.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-medecin-taches-soins',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './medecin-taches-soins.html',
  styleUrl: './medecin-taches-soins.css',
})
export class MedecinTachesSoinsComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  medecinId: string | null = null;
  patients: any[] = [];
  infirmiers: any[] = [];
  suivi: any[] = [];

  form = {
    patientId: '',
    infirmierId: '',
    typeTraitement: 'Soin / surveillance',
    nomMedicament: '',
    dosage: '',
    voieAdministration: 'PO',
    heureAdministration: '',
  };

  loading = false;
  error = '';
  success = '';
  /** Filtre liste suivi (patient, infirmier, acte). */
  searchText = '';

  /** Modal « Nouvelle demande de soins ». */
  showDemandeModal = false;

  constructor(
    private http: HttpClient,
    public auth: AuthService,
    private patientsApi: PatientService,
    private workspace: MedecinWorkspaceService
  ) {}

  ngOnInit(): void {
    this.medecinId = this.auth.getUserId();
    if (!this.medecinId) {
      this.error = 'Identifiant médecin manquant.';
      return;
    }
    const cid = this.auth.getCliniqueId();
    const p$ = cid ? this.patientsApi.getPatientsByClinique(cid) : this.patientsApi.obtenirTousLesPatients();
    p$.subscribe({
      next: (data) => (this.patients = data || []),
      error: () => (this.error = 'Impossible de charger les patients.'),
    });
    this.workspace.infirmiersMemeClinique(this.medecinId).subscribe({
      next: (data) => (this.infirmiers = data || []),
      error: () => {},
    });
    this.rechargerSuivi();
  }

  rechargerSuivi(): void {
    if (!this.medecinId) return;
    this.workspace.suiviSoins(this.medecinId).subscribe({
      next: (data) => (this.suivi = data || []),
      error: () => {},
    });
  }

  creerTache(): void {
    if (!this.medecinId || !this.form.patientId || !this.form.infirmierId) {
      this.error = 'Patient et infirmier sont obligatoires.';
      return;
    }
    this.error = '';
    this.success = '';
    const heure = this.form.heureAdministration
      ? new Date(this.form.heureAdministration).toISOString()
      : new Date().toISOString();
    const body = {
      patientId: this.form.patientId,
      infirmierId: this.form.infirmierId,
      medecinDemandeurId: this.medecinId,
      typeTraitement: this.form.typeTraitement || 'Soin',
      nomMedicament: this.form.nomMedicament || '—',
      dosage: this.form.dosage || '—',
      voieAdministration: this.form.voieAdministration || 'PO',
      administre: false,
      heureAdministration: heure,
    };
    this.http.post(`${this.api}/administrations`, body).subscribe({
      next: () => {
        this.success = 'Tâche créée et transmise à l’infirmier.';
        this.rechargerSuivi();
        this.form.nomMedicament = '';
        this.form.dosage = '';
        this.form.heureAdministration = '';
      },
      error: () => (this.error = 'Création impossible (vérifiez les droits et les identifiants).'),
    });
  }

  valider(row: any, valide: boolean): void {
    if (!row?.id) return;
    this.http
      .patch(`${this.api}/administrations/${row.id}/validation-medecin`, { valide, commentaire: '' })
      .subscribe({
        next: () => {
          this.success = valide ? 'Soin validé.' : 'Soin refusé.';
          this.rechargerSuivi();
        },
        error: (e) => {
          this.error = e?.error?.message || 'Validation impossible.';
        },
      });
  }

  nomPatient(row: any): string {
    const p = row?.patient;
    if (!p) return '—';
    return `${p.prenom || ''} ${p.nom || ''}`.trim() || '—';
  }

  nomInfirmier(row: any): string {
    const i = row?.infirmier;
    if (!i) return '—';
    return `${i.prenom || ''} ${i.nom || ''}`.trim() || '—';
  }

  get filteredSuivi(): any[] {
    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) return this.suivi;
    return this.suivi.filter((r) => {
      const blob = [
        this.nomPatient(r),
        this.nomInfirmier(r),
        r?.nomMedicament,
        r?.typeTraitement,
        r?.dosage,
        r?.voieAdministration,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(q);
    });
  }

  get statTotal(): number {
    return this.suivi.length;
  }

  /** Infirmier n’a pas encore administré. */
  get statAFaire(): number {
    return this.suivi.filter((r) => !r?.administre).length;
  }

  /** Administré, en attente de validation médecin. */
  get statAValiderMedecin(): number {
    return this.suivi.filter(
      (r) => r?.administre && (r?.validationSoinsMedecin || '') === 'EN_ATTENTE'
    ).length;
  }

  /** Validé par le médecin (ou refusé = clôturé côté workflow). */
  get statTraites(): number {
    return this.suivi.filter((r) => {
      const v = (r?.validationSoinsMedecin || '') as string;
      return r?.administre && (v === 'VALIDE' || v === 'REFUSE');
    }).length;
  }

  resetForm(): void {
    this.form = {
      patientId: '',
      infirmierId: '',
      typeTraitement: 'Soin / surveillance',
      nomMedicament: '',
      dosage: '',
      voieAdministration: 'PO',
      heureAdministration: '',
    };
    this.error = '';
    this.success = '';
  }

  ouvrirModalDemande(): void {
    this.error = '';
    this.showDemandeModal = true;
  }

  fermerModalDemande(): void {
    this.showDemandeModal = false;
  }

  libelleValidation(row: any): string {
    const v = row?.validationSoinsMedecin;
    if (!row?.administre) return 'En attente infirmier';
    if (!v || v === 'EN_ATTENTE') return 'À valider médecin';
    if (v === 'VALIDE') return 'Validé';
    if (v === 'REFUSE') return 'Refusé';
    return String(v);
  }

  validationPillClass(row: any): string {
    if (!row?.administre) return 'vp-nurse';
    const v = row?.validationSoinsMedecin;
    if (!v || v === 'EN_ATTENTE') return 'vp-doc';
    if (v === 'VALIDE') return 'vp-ok';
    if (v === 'REFUSE') return 'vp-ko';
    return 'vp-neutral';
  }
}
