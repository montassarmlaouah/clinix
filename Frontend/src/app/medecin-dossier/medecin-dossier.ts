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
  selector: 'app-medecin-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './medecin-dossier.html',
  styleUrl: './medecin-dossier.css',
})
export class MedecinDossierComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  patients: any[] = [];
  patientId = '';
  dossier: DossierMedical | null = null;
  loading = false;
  error = '';
  searchPatient = '';

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

  get statPatients(): number {
    return this.patients.length;
  }

  get statDossierOuvert(): number {
    return this.dossier ? 1 : 0;
  }

  get filteredPatients(): any[] {
    const q = this.searchPatient.trim().toLowerCase();
    if (!q) return this.patients;
    return this.patients.filter((p) =>
      `${p.prenom || ''} ${p.nom || ''}`.toLowerCase().includes(q)
    );
  }

  get allergiesText(): string {
    if (!this.dossier?.allergies?.length) return '—';
    return Array.isArray(this.dossier.allergies)
      ? this.dossier.allergies.join(', ')
      : String(this.dossier.allergies);
  }

  chargerDossier(): void {
    if (!this.patientId) return;
    this.loading = true;
    this.error = '';
    this.dossier = null;
    this.http.get<DossierMedical>(`${this.api}/dossiers-medicaux/patient/${this.patientId}`).subscribe({
      next: (d) => {
        this.dossier = d;
        this.loading = false;
      },
      error: () => {
        this.error = 'Dossier introuvable ou accès refusé.';
        this.loading = false;
      },
    });
  }
}
