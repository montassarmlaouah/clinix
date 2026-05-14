import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PatientService } from '../service/patient-service';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { ImagerieDICOM } from '../model/imagerie-dicom';

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
          this.form = {
            type: 'RADIO',
            motif: '',
            indicationsCliniques: '',
            questionsMedecin: '',
            piecesJointes: '',
            niveauUrgence: 'NORMALE',
          };
          this.chargerMesDemandes();
        },
        error: () => (this.error = 'Demande refusée.'),
      });
  }
}
