import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  /** cabinet = forfaits médecin ; clinique = forfaits établissement */
  billingScope: 'clinique' | 'cabinet' = 'clinique';
  abonnementPaye = false;
  loadingAbonnement = false;

  constructor(
    private abonnementService: AbonnementService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const qScope = (this.route.snapshot.queryParamMap.get('scope') || '').toLowerCase();
    if (qScope === 'cabinet') {
      this.billingScope = 'cabinet';
    } else if (qScope === 'clinique') {
      this.billingScope = 'clinique';
    } else if (this.auth.isMedecinCabinetExclusif()) {
      this.billingScope = 'cabinet';
    } else {
      this.billingScope = 'clinique';
    }

    const load$ =
      this.billingScope === 'cabinet'
        ? this.abonnementService.listerOffresActivesCabinet()
        : this.auth.getCliniqueId() || this.auth.isAdminClinique()
          ? this.abonnementService.listerOffresActives()
          : null;

    if (!load$) {
      this.error = 'Aucune clinique ni cabinet médical associé à ce compte.';
      this.loading = false;
      return;
    }

    load$.subscribe({
      next: (list) => {
        this.offres = (list || []).filter((o) => o.actif !== false);
        this.loading = false;
        this.verifierAbonnementExistant();
      },
      error: () => {
        this.error = 'Impossible de charger les forfaits.';
        this.loading = false;
      },
    });
  }

  private verifierAbonnementExistant(): void {
    const scope = this.billingScope === 'cabinet' ? 'cabinet' : undefined;
    this.loadingAbonnement = true;
    this.abonnementService.getCurrentSubscription(scope).subscribe({
      next: (cur) => {
        this.abonnementPaye = cur?.accesAutorise === true;
        this.loadingAbonnement = false;
        if (this.abonnementPaye) {
          this.simSuccess =
            'Vous avez déjà un abonnement actif et payé. Aucun nouveau paiement n\'est nécessaire.';
        }
      },
      error: () => {
        this.abonnementPaye = false;
        this.loadingAbonnement = false;
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
    if (this.abonnementPaye) {
      this.error = 'Abonnement déjà payé pour la période en cours.';
      return;
    }
    this.router.navigate(['/abonnement-paiement'], {
      queryParams: {
        offreId: o.id,
        interval: this.intervalSelection,
        scope: this.billingScope,
      },
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
    if (this.abonnementPaye) {
      this.error = 'Abonnement déjà payé pour la période en cours.';
      return;
    }
    this.error = '';
    this.simSuccess = '';
    this.simulatingId = o.id;
    const scope = this.billingScope === 'cabinet' ? 'cabinet' : undefined;
    this.abonnementService.souscriptionSimulee(o.id, this.intervalSelection, scope).subscribe({
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
