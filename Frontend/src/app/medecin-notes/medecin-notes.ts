import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PatientService } from '../service/patient-service';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { DossierMedical } from '../model/dossier-medical';

@Component({
  selector: 'app-medecin-notes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './medecin-notes.html',
  styleUrl: './medecin-notes.css',
})
export class MedecinNotesComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  patients: any[] = [];
  patientId = '';
  dossier: DossierMedical | null = null;
  notes = '';
  loading = false;
  saving = false;
  error = '';
  success = '';

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
  }

  charger(): void {
    if (!this.patientId) return;
    this.loading = true;
    this.error = '';
    this.success = '';
    this.dossier = null;
    this.notes = '';
    this.http.get<DossierMedical>(`${this.api}/dossiers-medicaux/patient/${this.patientId}`).subscribe({
      next: (d) => {
        this.dossier = d;
        this.notes = '';
        this.loading = false;
        if (d.id) {
          this.http
            .get<{ notesConfidentielles: string }>(`${this.api}/dossiers-medicaux/${d.id}/notes-confidentielles`)
            .subscribe({
              next: (n) => (this.notes = n.notesConfidentielles || ''),
              error: () => {},
            });
        }
      },
      error: () => {
        this.error = 'Dossier introuvable ou accès refusé.';
        this.loading = false;
      },
    });
  }

  enregistrer(): void {
    if (!this.dossier?.id) return;
    this.saving = true;
    this.error = '';
    this.success = '';
    this.http
      .patch<DossierMedical>(`${this.api}/dossiers-medicaux/${this.dossier.id}/notes-confidentielles`, {
        notesConfidentielles: this.notes,
      })
      .subscribe({
        next: (d) => {
          this.dossier = d;
          this.success = 'Notes enregistrées.';
          this.saving = false;
        },
        error: () => {
          this.error = 'Enregistrement impossible.';
          this.saving = false;
        },
      });
  }
}
