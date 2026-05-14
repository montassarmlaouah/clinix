import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { Ordonnance } from '../model/ordonnance';

@Component({
  selector: 'app-patient-ordonnances',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patient-ordonnances.html',
  styleUrl: './patient-ordonnances.css',
})
export class PatientOrdonnancesComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  liste: Ordonnance[] = [];
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
    this.http.get<Ordonnance[]>(`${this.api}/ordonnances`, { params: { patientId: pid } }).subscribe({
      next: (data) => {
        this.liste = data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger vos ordonnances.';
        this.loading = false;
      },
    });
  }
}
