import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbonnementService } from '../service/abonnement.service';
import { AuthService } from '../service/auth-service';
import { OffreAbonnement } from '../model/abonnement.model';
import { economieAnnuelleCalc, prixPourCarte } from '../abonnement/abonnement-pricing.util';

@Component({
  selector: 'app-abonnement-paiement-stripe',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './abonnement-paiement-stripe.html',
  styleUrl: './abonnement-paiement-stripe.css',
})
export class AbonnementPaiementStripeComponent implements OnInit {
  offre: OffreAbonnement | null = null;
  interval: 'MONTHLY' | 'YEARLY' = 'MONTHLY';
  billingScope: 'clinique' | 'cabinet' = 'clinique';
  loading = true;
  preparing = false;
  error = '';
  abonnementPaye = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private abonnementService: AbonnementService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const qScope = (q.get('scope') || '').toLowerCase();
    if (qScope === 'cabinet') {
      this.billingScope = 'cabinet';
    } else if (qScope === 'clinique') {
      this.billingScope = 'clinique';
    } else if (this.auth.isMedecinCabinetExclusif()) {
      this.billingScope = 'cabinet';
    } else {
      this.billingScope = 'clinique';
    }

    if (!this.auth.getCliniqueId() && this.billingScope === 'clinique' && !this.auth.peutGererAbonnementCabinet()) {
      this.error = 'Aucune clinique ni cabinet médical associé.';
      this.loading = false;
      return;
    }

    const id = q.get('offreId') || '';
    const iv = (q.get('interval') || 'MONTHLY').toUpperCase();
    this.interval = iv === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
    if (!id) {
      this.error = 'Forfait non sélectionné.';
      this.loading = false;
      this.offre = null;
      return;
    }
    this.chargerOffre(id);
    this.verifierAbonnementPaye();
  }

  private verifierAbonnementPaye(): void {
    const scope = this.billingScope === 'cabinet' ? 'cabinet' : undefined;
    this.abonnementService.getCurrentSubscription(scope).subscribe({
      next: (cur) => {
        if (cur?.accesAutorise === true) {
          this.abonnementPaye = true;
          this.error =
            'Abonnement déjà actif et payé. Aucun nouveau paiement n\'est nécessaire pour cette période.';
        }
      },
      error: () => {
        this.abonnementPaye = false;
      },
    });
  }

  private chargerOffre(id: string): void {
    this.loading = true;
    this.error = '';
    const list$ =
      this.billingScope === 'cabinet'
        ? this.abonnementService.listerOffresActivesCabinet()
        : this.abonnementService.listerOffresActives();

    list$.subscribe({
      next: (list) => {
        const found = (list || []).find((o) => o.id === id);
        if (!found) {
          this.error = 'Forfait introuvable ou inactif.';
          this.offre = null;
        } else {
          this.offre = found;
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Impossible de charger le forfait.';
        this.loading = false;
      },
    });
  }

  prix(): number {
    if (!this.offre) {
      return 0;
    }
    return prixPourCarte(this.offre, this.interval);
  }

  aujourdhuiEstime(): number {
    if (!this.offre) {
      return 0;
    }
    const trial = this.offre.periodeEssaiJours ?? 0;
    return trial > 0 ? 0 : this.prix();
  }

  economieAnnuelle(): number {
    return this.offre ? economieAnnuelleCalc(this.offre) : 0;
  }

  resumeLimites(): string[] {
    if (!this.offre) {
      return [];
    }
    const o = this.offre;
    if (o.categorie === 'CABINET_MEDICAL') {
      return [
        `${o.nombrePatientsMax ?? 0} patients max`,
        `${o.nombrePersonnelMax ?? 0} employés max`,
        `${o.nombreRendezVousMax ?? 0} RDV max`,
      ];
    }
    return [
      `${o.smsGratuitsInclus ?? 0} SMS inclus`,
      `${o.nombreChambresMax ?? 0} chambres max`,
      `${o.nombrePersonnelMax ?? 0} personnels max`,
    ];
  }

  continuerVersStripe(): void {
    if (!this.offre || this.abonnementPaye) {
      if (this.abonnementPaye) {
        this.error = 'Abonnement déjà payé pour la période en cours.';
      }
      return;
    }
    this.error = '';
    this.preparing = true;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const successUrl = `${origin}/mon-abonnement?checkout=success`;
    const cancelUrl = `${origin}/abonnement-paiement?offreId=${encodeURIComponent(this.offre.id)}&interval=${this.interval}&scope=${this.billingScope}`;

    this.abonnementService
      .demarrerStripeCheckout({
        offreId: this.offre.id,
        interval: this.interval,
        successUrl,
        cancelUrl,
        scope: this.billingScope === 'cabinet' ? 'cabinet' : undefined,
      })
      .subscribe({
        next: (r) => {
          const url = r['checkoutUrl'] as string;
          this.preparing = false;
          if (url) {
            window.location.href = url;
          } else {
            this.error = 'URL Stripe non reçue. Vérifiez la configuration backend.';
          }
        },
        error: (e: { error?: { message?: string } }) => {
          this.preparing = false;
          this.error = e?.error?.message || 'Impossible d’ouvrir le paiement Stripe.';
        },
      });
  }

  retourTarifs(): void {
    this.router.navigate(['/tarifs-abonnement'], {
      queryParams: this.billingScope === 'cabinet' ? { scope: 'cabinet' } : {},
    });
  }
}
