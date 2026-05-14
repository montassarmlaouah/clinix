import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AbonnementService } from '../service/abonnement.service';
import { AuthService } from '../service/auth-service';
import { OffreAbonnement } from '../model/abonnement.model';
import { economieAnnuelleCalc, prixPourCarte } from '../abonnement/abonnement-pricing.util';

@Component({
  selector: 'app-abonnement-tarifs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './abonnement-tarifs.html',
  styleUrl: './abonnement-tarifs.css',
})
export class AbonnementTarifsComponent implements OnInit {
  offres: OffreAbonnement[] = [];
  loading = true;
  error = '';
  simulatingId: string | null = null;
  simSuccess = '';
  intervalSelection: 'MONTHLY' | 'YEARLY' = 'MONTHLY';

  constructor(
    private abonnementService: AbonnementService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.getCliniqueId()) {
      this.error = 'Aucune clinique associée à ce compte.';
      this.loading = false;
      return;
    }
    this.abonnementService.listerOffresActives().subscribe({
      next: (list) => {
        this.offres = (list || []).filter(
          (o) => o.actif !== false && (o.categorie == null || o.categorie === 'CLINIQUE')
        );
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger les forfaits.';
        this.loading = false;
      },
    });
  }

  setInterval(i: 'MONTHLY' | 'YEARLY'): void {
    this.intervalSelection = i;
  }

  prix(o: OffreAbonnement): number {
    return prixPourCarte(o, this.intervalSelection);
  }

  economie(o: OffreAbonnement): number {
    return economieAnnuelleCalc(o);
  }

  choisirForfait(o: OffreAbonnement): void {
    this.router.navigate(['/abonnement-paiement'], {
      queryParams: { offreId: o.id, interval: this.intervalSelection },
    });
  }

  resumeLimites(offre: OffreAbonnement): string[] {
    if (offre.categorie === 'CABINET_MEDICAL') {
      return [
        `${offre.nombrePatientsMax ?? 0} patients max`,
        `${offre.nombrePersonnelMax ?? 0} employés max`,
        `${offre.nombreRendezVousMax ?? 0} RDV max`,
      ];
    }
    return [
      `${offre.smsGratuitsInclus ?? 0} SMS inclus`,
      `${offre.nombreChambresMax ?? 0} chambres max`,
      `${offre.nombrePersonnelMax ?? 0} personnels max`,
    ];
  }

  simulerSansStripe(o: OffreAbonnement, ev: Event): void {
    ev.stopPropagation();
    this.error = '';
    this.simSuccess = '';
    this.simulatingId = o.id;
    this.abonnementService.souscriptionSimulee(o.id, this.intervalSelection).subscribe({
      next: (r) => {
        this.simulatingId = null;
        this.simSuccess = typeof r['message'] === 'string' ? r['message'] : 'Abonnement enregistré (simulation).';
      },
      error: (e: { error?: { message?: string } }) => {
        this.simulatingId = null;
        this.error = e?.error?.message || 'Simulation impossible.';
      },
    });
  }
}
