import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { MedecinStatistiques, MedecinWorkspaceService } from '../service/medecin-workspace.service';

@Component({
  selector: 'app-medecin-statistiques',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './medecin-statistiques.html',
  styleUrl: './medecin-statistiques.css',
})
export class MedecinStatistiquesComponent implements OnInit {
  stats: MedecinStatistiques | null = null;
  loading = true;
  error = '';

  constructor(
    private workspace: MedecinWorkspaceService,
    public auth: AuthService,
  ) {}

  ngOnInit(): void {
    const medecinId = this.auth.getUserId();
    if (!medecinId) {
      this.error = 'Médecin non identifié.';
      this.loading = false;
      return;
    }
    this.workspace.statistiques(medecinId).subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les statistiques.';
        this.loading = false;
      },
    });
  }
}
