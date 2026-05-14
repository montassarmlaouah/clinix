import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { environment } from '../../environments/environment';
import { Ordonnance } from '../model/ordonnance';

@Component({
  selector: 'app-medecin-ordonnances',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './medecin-ordonnances.html',
  styleUrl: './medecin-ordonnances.css',
})
export class MedecinOrdonnancesComponent implements OnInit {
  private api = `${environment.apiUrl}/api`;

  liste: Ordonnance[] = [];
  loading = false;
  error = '';
  medecinId: string | null = null;

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.medecinId = this.auth.getUserId();
    if (!this.medecinId) {
      this.error = 'Identifiant médecin manquant.';
      return;
    }
    this.charger();
  }

  charger(): void {
    if (!this.medecinId) return;
    this.loading = true;
    this.error = '';
    this.http.get<Ordonnance[]>(`${this.api}/ordonnances?medecinId=${encodeURIComponent(this.medecinId)}`).subscribe({
      next: (data) => {
        this.liste = data || [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les ordonnances.';
        this.loading = false;
      },
    });
  }

  signer(id: string | undefined): void {
    if (!id) return;
    this.http.patch<Ordonnance>(`${this.api}/ordonnances/${id}/signer`, {}).subscribe({
      next: () => this.charger(),
      error: () => (this.error = 'Signature impossible.'),
    });
  }

  pdfUrl(id: string | undefined): string {
    return id ? `${this.api}/ordonnances/${id}/pdf` : '#';
  }
}
