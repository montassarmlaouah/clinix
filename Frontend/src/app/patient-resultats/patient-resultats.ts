import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { DossierMedical } from '../model/dossier-medical';
import { AnalyseLaboratoire } from '../model/analyse-laboratoire';

@Component({
  selector: 'app-patient-resultats',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-resultats.html',
  styleUrl: './patient-resultats.css',
})
export class PatientResultatsComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  analyses: AnalyseLaboratoire[] = [];
  loading = false;
  error = '';

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const pid = this.auth.getUserId();
    if (!pid) {
      this.error = 'Session invalide.';
      return;
    }
    this.loading = true;
    this.http.get<DossierMedical>(`${this.api}/dossiers-medicaux/patient/${pid}`).subscribe({
      next: (d) => {
        this.analyses = d?.analyses || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les résultats.';
        this.loading = false;
      },
    });
  }
}
