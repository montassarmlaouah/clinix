import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MSG_ABONNEMENT_CABINET_REQUIS, redirectSiAbonnementCabinetRequis } from '../service/cabinet-access.util';
import { forkJoin, of, catchError } from 'rxjs';
import { PatientService } from '../service/patient-service';
import { RendezVousService } from '../service/rendez-vous.service';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { Consultation } from '../model/consultation';
import { Patient } from '../model/patient';
import { RendezVous, RendezVousDTO } from '../model/rendez-vous';

@Component({
  selector: 'app-medecin-consultation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './medecin-consultation.html',
  styleUrl: './medecin-consultation.css',
})
export class MedecinConsultationComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  patientsClinique: Patient[] = [];
  patientsCabinet: Patient[] = [];
  patientId = '';
  liste: Consultation[] = [];
  form = { motif: '' };
  diagForm = { diagnostic: '', observations: '' };
  selectedConsultationId = '';
  loading = false;
  error = '';
  success = '';

  cliniqueId: string | null = null;
  rdvClinique: RendezVous[] = [];
  rdvCabinet: RendezVous[] = [];

  cabinetForm = {
    nom: '',
    prenom: '',
    telephone: '',
    dateNaissance: '',
    sexe: '',
    adresse: '',
  };

  rdvCabForm = {
    patientId: '',
    dateHeureLocal: '',
    motif: '',
  };

  constructor(
    private http: HttpClient,
    private patientService: PatientService,
    private rdvService: RendezVousService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cliniqueId = this.auth.getCliniqueId();
    const mid = this.medecinId;
    if (!mid) {
      this.error = 'Identifiant médecin manquant dans la session.';
      return;
    }
    this.auth.hydrateCabinetAccess().subscribe(() => this.chargerDonnees(mid));
  }

  private chargerDonnees(mid: string): void {
    const clin$ = this.cliniqueId
      ? this.patientService.getPatientsByClinique(this.cliniqueId)
      : of([] as Patient[]);
    const cabinet$ = this.auth.peutAccederEspaceCabinet()
      ? this.patientService.getPatientsCabinetMedecin(mid).pipe(
          catchError((e) => {
            const msg = e?.error?.message;
            if (typeof msg === 'string' && msg) {
              this.error = msg;
            }
            return of([] as Patient[]);
          })
        )
      : of([] as Patient[]);

    forkJoin({ clinique: clin$, cabinet: cabinet$ }).subscribe({
      next: ({ clinique, cabinet }) => {
        this.patientsClinique = (clinique ?? []) as Patient[];
        this.patientsCabinet = (cabinet ?? []) as Patient[];
        this.chargerRdv();
      },
      error: () => (this.error = 'Impossible de charger les patients (clinique / cabinet).'),
    });
  }

  get peutCabinet(): boolean {
    return this.auth.peutAccederEspaceCabinet();
  }

  get medecinId(): string | null {
    return this.auth.getUserId();
  }

  chargerRdv(): void {
    const mid = this.medecinId;
    if (!mid) return;
    if (this.cliniqueId) {
      this.rdvService.listerRdvCliniquePourMedecin(mid, this.cliniqueId).subscribe({
        next: (d) => (this.rdvClinique = d || []),
        error: () => {},
      });
    } else {
      this.rdvClinique = [];
    }
    this.rdvService.listerRdvCabinetPourMedecin(mid).subscribe({
      next: (d) => (this.rdvCabinet = d || []),
      error: () => {},
    });
  }

  chargerListe(): void {
    if (!this.patientId) return;
    this.loading = true;
    this.http.get<Consultation[]>(`${this.api}/consultations/patient/${this.patientId}`).subscribe({
      next: (data) => {
        this.liste = data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur chargement consultations.';
        this.loading = false;
      },
    });
  }

  creer(): void {
    const mid = this.medecinId;
    if (!this.patientId || !mid || !this.form.motif.trim()) {
      this.error = 'Patient, médecin et motif obligatoires.';
      return;
    }
    this.error = '';
    this.http
      .post<Consultation>(`${this.api}/consultations`, {
        patientId: this.patientId,
        medecinId: mid,
        motif: this.form.motif.trim(),
      })
      .subscribe({
        next: () => {
          this.success = 'Consultation créée.';
          this.form.motif = '';
          this.chargerListe();
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (e) => {
          const msg = e.error?.message || e.error?.error || '';
          this.error = (typeof msg === 'string' && msg) ? msg : 'Création impossible.';
        },
      });
  }

  enregistrerDiagnostic(): void {
    if (!this.selectedConsultationId) return;
    this.http
      .patch<Consultation>(`${this.api}/consultations/${this.selectedConsultationId}/diagnostic`, {
        diagnostic: this.diagForm.diagnostic,
        observations: this.diagForm.observations,
      })
      .subscribe({
        next: () => {
          this.success = 'Diagnostic enregistré.';
          this.chargerListe();
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (e) => {
          const msg = e.error?.message || '';
          this.error = (typeof msg === 'string' && msg) ? msg : 'Enregistrement impossible.';
        },
      });
  }

  ajouterPatientCabinet(): void {
    const mid = this.medecinId;
    if (!mid) return;
    if (redirectSiAbonnementCabinetRequis(this.auth, this.router)) {
      return;
    }
    if (!this.auth.peutAccederEspaceCabinet()) {
      this.error = MSG_ABONNEMENT_CABINET_REQUIS;
      return;
    }
    const f = this.cabinetForm;
    if (!f.nom?.trim() || !f.prenom?.trim() || !f.telephone?.trim() || !f.dateNaissance) {
      this.error = 'Nom, prénom, téléphone et date de naissance obligatoires pour un patient cabinet.';
      return;
    }
    this.error = '';
    this.patientService
      .creerPatientCabinet(mid, {
        nom: f.nom.trim(),
        prenom: f.prenom.trim(),
        telephone: f.telephone.trim(),
        dateNaissance: f.dateNaissance,
        sexe: f.sexe || undefined,
        adresse: f.adresse || undefined,
      })
      .subscribe({
        next: (p) => {
          this.success = 'Patient cabinet enregistré.';
          this.patientsCabinet = [p, ...this.patientsCabinet.filter((x) => x.id !== p.id)];
          this.cabinetForm = { nom: '', prenom: '', telephone: '', dateNaissance: '', sexe: '', adresse: '' };
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (e) => {
          const msg = e.error?.message;
          this.error = typeof msg === 'string' ? msg : 'Création patient cabinet impossible.';
        },
      });
  }

  creerRdvCabinet(): void {
    const mid = this.medecinId;
    const f = this.rdvCabForm;
    if (!mid || !f.patientId || !f.dateHeureLocal || !f.motif?.trim()) {
      this.error = 'Patient cabinet, date/heure et motif obligatoires pour le RDV.';
      return;
    }
    const dateHeure = new Date(f.dateHeureLocal).toISOString();
    this.error = '';
    const dto: RendezVousDTO = {
      patientId: f.patientId,
      medecinId: mid,
      dateHeure,
      motif: f.motif.trim(),
    };
    this.rdvService.creerRendezVous(dto, 'cabinet').subscribe({
        next: () => {
          this.success = 'Rendez-vous cabinet créé.';
          this.rdvCabForm = { patientId: '', dateHeureLocal: '', motif: '' };
          this.chargerRdv();
          setTimeout(() => (this.success = ''), 3000);
        },
        error: (e) => {
          const msg = e.error?.message;
          this.error = typeof msg === 'string' ? msg : 'Création du rendez-vous impossible.';
        },
      });
  }

  confirmerRdvClinique(r: RendezVous): void {
    if (!r.id || r.statut === 'CONFIRME') return;
    this.rdvService.confirmerRendezVousParMedecin(r.id).subscribe({
      next: () => {
        this.success = 'Rendez-vous clinique confirmé.';
        this.chargerRdv();
        setTimeout(() => (this.success = ''), 3000);
      },
      error: (e) => {
        const msg = e.error?.message;
        this.error = typeof msg === 'string' ? msg : 'Confirmation impossible.';
      },
    });
  }

  nomPatient(r: RendezVous): string {
    const p = r.patient as any;
    if (!p) return '—';
    return `${p.prenom || ''} ${p.nom || ''}`.trim() || '—';
  }

  peutConfirmerClinique(r: RendezVous): boolean {
    return r.statut === 'PLANIFIE';
  }
}
