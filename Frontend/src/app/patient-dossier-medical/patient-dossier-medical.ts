import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { DossierMedical } from '../model/dossier-medical';

@Component({
  selector: 'app-patient-dossier-medical',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-dossier-medical.html',
  styleUrl: './patient-dossier-medical.css',
})
export class PatientDossierMedicalComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  dossier: DossierMedical | null = null;
  loading = false;
  error = '';

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const pid = this.auth.getUserId();
    if (!pid) {
      this.error = 'Session patient invalide.';
      return;
    }
    this.loading = true;
    this.http.get<DossierMedical>(`${this.api}/dossiers-medicaux/patient/${pid}`).subscribe({
      next: (d) => {
        this.dossier = d;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger votre dossier médical.';
        this.loading = false;
      },
    });
  }
}
