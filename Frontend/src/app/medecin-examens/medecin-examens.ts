import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PatientService } from '../service/patient-service';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { ImagerieDICOM } from '../model/imagerie-dicom';
import { StatutImagerie } from '../model/enums';

@Component({
  selector: 'app-medecin-examens',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './medecin-examens.html',
  styleUrl: './medecin-examens.css',
})
export class MedecinExamensComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  patients: any[] = [];
  patientId = '';
  form = {
    type: 'RADIO',
    motif: '',
    indicationsCliniques: '',
    questionsMedecin: '',
    piecesJointes: '',
    niveauUrgence: 'NORMALE' as string,
  };
  liste: ImagerieDICOM[] = [];
  loading = false;
  error = '';
  success = '';
  searchText = '';
  showDemandeModal = false;

  constructor(
    private http: HttpClient,
    private patientService: PatientService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const cid = this.auth.getCliniqueId();
    const req$ = cid ? this.patientService.getPatientsByClinique(cid) : this.patientService.obtenirTousLesPatients();
    req$.subscribe({
      next: (data) => (this.patients = data || []),
      error: () => (this.error = 'Impossible de charger les patients.'),
    });
    this.chargerMesDemandes();
  }

  get medecinId(): string | null {
    return this.auth.getUserId();
  }

  get statTotal(): number {
    return this.liste.length;
  }

  get statEnAttente(): number {
    return this.liste.filter((e) => !e.statut || e.statut === 'EN_ATTENTE').length;
  }

  get statEnCours(): number {
    return this.liste.filter((e) => e.statut === 'EN_COURS').length;
  }

  get statTermines(): number {
    return this.liste.filter((e) => e.statut === 'TERMINE' || e.statut === 'VALIDE').length;
  }

  get filteredListe(): ImagerieDICOM[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.liste;
    return this.liste.filter((e) => {
      const patient = `${e.patient?.prenom || ''} ${e.patient?.nom || ''}`.toLowerCase();
      const type = (e.type || '').toLowerCase();
      const motif = (e.motif || '').toLowerCase();
      const statut = (e.statut || '').toLowerCase();
      return patient.includes(q) || type.includes(q) || motif.includes(q) || statut.includes(q);
    });
  }

  chargerMesDemandes(): void {
    const mid = this.medecinId;
    if (!mid) return;
    this.loading = true;
    this.http.get<ImagerieDICOM[]>(`${this.api}/imageries/medecin/${mid}`).subscribe({
      next: (data) => {
        this.liste = data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur chargement examens.';
        this.loading = false;
      },
    });
  }

  ouvrirModalDemande(): void {
    this.showDemandeModal = true;
    this.error = '';
  }

  fermerModalDemande(): void {
    this.showDemandeModal = false;
  }

  resetForm(): void {
    this.patientId = '';
    this.form = {
      type: 'RADIO',
      motif: '',
      indicationsCliniques: '',
      questionsMedecin: '',
      piecesJointes: '',
      niveauUrgence: 'NORMALE',
    };
  }

  demander(): void {
    const mid = this.medecinId;
    if (!this.patientId || !mid || !this.form.type.trim()) {
      this.error = 'Patient, type et médecin requis.';
      return;
    }
    this.error = '';
    this.http
      .post<ImagerieDICOM>(`${this.api}/imageries/demander`, {
        patientId: this.patientId,
        medecinId: mid,
        type: this.form.type.trim(),
        motif: this.form.motif || '',
        indicationsCliniques: this.form.indicationsCliniques || '',
        questionsMedecin: this.form.questionsMedecin || '',
        piecesJointes: this.form.piecesJointes || '',
        niveauUrgence: this.form.niveauUrgence || 'NORMALE',
      })
      .subscribe({
        next: () => {
          this.success = 'Demande d\'imagerie envoyée au service de radiologie.';
          this.resetForm();
          this.fermerModalDemande();
          this.chargerMesDemandes();
        },
        error: () => (this.error = 'Demande refusée.'),
      });
  }

  libelleStatut(statut?: StatutImagerie | string): string {
    switch ((statut || 'EN_ATTENTE').toUpperCase()) {
      case 'EN_COURS':
        return 'En cours';
      case 'TERMINE':
        return 'Terminé';
      case 'VALIDE':
        return 'Validé';
      case 'REFUSE':
        return 'Refusé';
      default:
        return 'En attente';
    }
  }

  statutPillClass(statut?: StatutImagerie | string): string {
    switch ((statut || 'EN_ATTENTE').toUpperCase()) {
      case 'EN_COURS':
        return 'vp-doc';
      case 'TERMINE':
      case 'VALIDE':
        return 'vp-ok';
      case 'REFUSE':
        return 'vp-ko';
      default:
        return 'vp-nurse';
    }
  }

  libelleUrgence(niveau?: string): string {
    switch ((niveau || 'NORMALE').toUpperCase()) {
      case 'BASSE':
        return 'Basse';
      case 'HAUTE':
        return 'Haute';
      case 'URGENTE':
        return 'Urgente';
      default:
        return 'Normale';
    }
  }
}
