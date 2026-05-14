import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AbonnementService } from '../service/abonnement.service';
import { AuthService } from '../service/auth-service';
import { AbonnementCliniqueSummary, OffreAbonnement, StripeConfigAdminDTO } from '../model/abonnement.model';

@Component({
  selector: 'app-mon-abonnement',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './mon-abonnement.html',
  styleUrl: './mon-abonnement.css',
})
export class MonAbonnementComponent implements OnInit {
  offres: OffreAbonnement[] = [];
  loading = false;
  error = '';
  success = '';

  /** Retour Stripe Checkout (admin clinique) */
  checkoutSuccesStripe = false;

  /** Super admin — création rapide */
  editingOffreId: string | null = null;
  nouvelleNom = '';
  nouvelleDescription = '';
  nouvellePrix = 0;
  nouvellePrixAnnuel = 0;
  nouvelleSms = 0;
  nouvelleChambres = 0;
  nouvellePersonnel = 0;
  nouvellePatients = 0;
  nouvelleRendezVous = 0;
  nouvelleDuree = 12;
  nouvelleCategorie: 'CLINIQUE' | 'CABINET_MEDICAL' = 'CLINIQUE';
  nouvelleEssai = 0;
  savingOffre = false;

  /** Super admin — Stripe */
  stripeCfg: StripeConfigAdminDTO | null = null;
  cfgMode: 'TEST' | 'LIVE' = 'TEST';
  cfgPublishable = '';
  cfgSecret = '';
  cfgWebhook = '';
  savingStripeCfg = false;

  abonnementCourant: AbonnementCliniqueSummary | null = null;
  historiqueAbonnements: AbonnementCliniqueSummary[] = [];

  /** Super admin : abonnements clinique au statut Actif (toutes cliniques). */
  abonnementsActifs: AbonnementCliniqueSummary[] = [];

  /** Super admin : abonnements avec paiement enregistré (montant > 0). */
  abonnementsPayes: AbonnementCliniqueSummary[] = [];

  showModalOffre = false;
  showModalStripe = false;

  constructor(
    private abonnementService: AbonnementService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    this.checkoutSuccesStripe = checkout === 'success';
    if (checkout === 'success') {
      this.success =
        'Paiement Stripe terminé. Votre abonnement sera confirmé sous peu (webhook) ; rafraîchissez après quelques secondes si besoin.';
      this.planifierRafraichissementAbonnement();
    } else if (checkout === 'cancel') {
      this.error = 'Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.';
    }

    this.loading = true;
    if (this.authService.isSuperAdmin()) {
      forkJoin({
        offres: this.abonnementService.listerToutesOffres().pipe(catchError(() => of([] as OffreAbonnement[]))),
        payes: this.abonnementService.listerAbonnementsPayesSuperAdmin().pipe(
          catchError(() => of([] as AbonnementCliniqueSummary[]))
        ),
      }).subscribe({
        next: ({ offres, payes }) => {
          this.offres = offres || [];
          this.abonnementsPayes = payes || [];
          this.loading = false;
        },
        error: () => {
          this.error = 'Impossible de charger les données.';
          this.loading = false;
        },
      });
      this.abonnementService.getStripeConfig().subscribe({
        next: (c) => {
          this.stripeCfg = c;
          if (c.mode === 'LIVE' || c.mode === 'TEST') {
            this.cfgMode = c.mode;
          }
        },
        error: () => {
          /* ignorer */
        },
      });
    } else {
      this.offres = [];
      forkJoin({
        cur: this.abonnementService.getCurrentSubscription().pipe(catchError(() => of(null))),
        hist: this.abonnementService
          .getSubscriptionHistory()
          .pipe(catchError(() => of([] as AbonnementCliniqueSummary[]))),
      }).subscribe({
        next: ({ cur, hist }) => {
          this.abonnementCourant = cur;
          this.historiqueAbonnements = hist || [];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    }
  }

  get cliniqueId(): string | null {
    return this.authService.getCliniqueId();
  }

  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  get offresActivesCount(): number {
    return this.offres.filter((o) => o.actif).length;
  }

  get isCategorieClinique(): boolean {
    return this.nouvelleCategorie === 'CLINIQUE';
  }

  basculerActif(offre: OffreAbonnement): void {
    this.error = '';
    this.abonnementService.mettreAJourOffre(offre.id, { actif: !offre.actif }).subscribe({
      next: (maj) => {
        const i = this.offres.findIndex((x) => x.id === maj.id);
        if (i >= 0) {
          this.offres[i] = maj;
        }
      },
      error: () => {
        this.error = "Impossible de modifier l'offre.";
      },
    });
  }

  supprimerOffre(offre: OffreAbonnement): void {
    if (!confirm(`Supprimer l'offre « ${offre.nom} » ?`)) {
      return;
    }
    this.error = '';
    this.abonnementService.supprimerOffre(offre.id).subscribe({
      next: () => {
        this.offres = this.offres.filter((o) => o.id !== offre.id);
        this.success = 'Offre supprimée.';
      },
      error: () => {
        this.error = "Impossible de supprimer l'offre.";
      },
    });
  }

  majDureeOffre(offre: OffreAbonnement, value: string): void {
    const n = Math.min(36, Math.max(1, parseInt(value, 10) || 1));
    const prev = offre.dureeMois ?? 1;
    if (n === prev) {
      return;
    }
    this.error = '';
    this.abonnementService.mettreAJourOffre(offre.id, { dureeMois: n }).subscribe({
      next: (maj) => {
        const i = this.offres.findIndex((x) => x.id === maj.id);
        if (i >= 0) {
          this.offres[i] = maj;
        }
      },
      error: () => {
        this.error = 'Impossible de mettre à jour la durée.';
      },
    });
  }

  synchroniserOffreStripe(o: OffreAbonnement): void {
    this.error = '';
    this.success = '';
    this.abonnementService.synchroniserStripe(o.id).subscribe({
      next: (maj) => {
        const i = this.offres.findIndex((x) => x.id === maj.id);
        if (i >= 0) {
          this.offres[i] = maj;
        }
        this.success = 'Produit Stripe et prix synchronisés.';
      },
      error: (e: { error?: { message?: string } }) => {
        this.error = e?.error?.message || 'Synchronisation Stripe impossible.';
      },
    });
  }

  creerOffreRapide(): void {
    const nom = this.nouvelleNom.trim();
    if (!nom || this.nouvellePrix < 0) {
      this.error = 'Indiquez un nom et un prix valides.';
      return;
    }
    const duree = Math.min(36, Math.max(1, this.nouvelleDuree || 1));
    this.savingOffre = true;
    this.error = '';
    this.success = '';
    const isEditing = !!this.editingOffreId;
    const payload: Partial<OffreAbonnement> = this.buildOffrePayload();

    const request$ = this.editingOffreId
      ? this.abonnementService.mettreAJourOffre(this.editingOffreId, payload)
      : this.abonnementService.creerOffre(payload);

    request$.subscribe({
        next: (o) => {
          const index = this.offres.findIndex((x) => x.id === o.id);
          if (index >= 0) {
            this.offres[index] = o;
            this.offres = [...this.offres];
          } else {
            this.offres = [...this.offres, o];
          }
          this.resetFormOffre();
          this.success = isEditing ? 'Offre mise à jour.' : 'Offre créée.';
          this.savingOffre = false;
          this.showModalOffre = false;
        },
        error: (e: { error?: { message?: string } }) => {
          this.error = e?.error?.message || 'Création impossible.';
          this.savingOffre = false;
        },
      });
  }

  modifierOffre(offre: OffreAbonnement): void {
    this.editingOffreId = offre.id;
    this.nouvelleNom = offre.nom || '';
    this.nouvelleDescription = offre.description || '';
    this.nouvellePrix = offre.prixMensuel || 0;
    this.nouvellePrixAnnuel = offre.prixAnnuel || 0;
    this.nouvelleSms = offre.smsGratuitsInclus || 0;
    this.nouvelleChambres = offre.nombreChambresMax || 0;
    this.nouvellePersonnel = offre.nombrePersonnelMax || 0;
    this.nouvellePatients = offre.nombrePatientsMax || 0;
    this.nouvelleRendezVous = offre.nombreRendezVousMax || 0;
    this.nouvelleDuree = offre.dureeMois || 12;
    this.nouvelleCategorie = (offre.categorie as 'CLINIQUE' | 'CABINET_MEDICAL') || 'CLINIQUE';
    this.nouvelleEssai = offre.periodeEssaiJours || 0;
    this.ouvrirModalOffre();
  }

  ouvrirModalNouvelleOffre(): void {
    this.editingOffreId = null;
    this.resetFormOffre();
    this.error = '';
    this.showModalOffre = true;
  }

  ouvrirModalOffre(): void {
    this.error = '';
    this.showModalOffre = true;
  }

  fermerModalOffre(): void {
    this.showModalOffre = false;
  }

  ouvrirModalStripe(): void {
    this.error = '';
    this.showModalStripe = true;
    if (!this.stripeCfg) {
      this.abonnementService.getStripeConfig().subscribe({
        next: (c) => {
          this.stripeCfg = c;
          if (c.mode === 'LIVE' || c.mode === 'TEST') {
            this.cfgMode = c.mode;
          }
        },
        error: () => {},
      });
    }
  }

  fermerModalStripe(): void {
    this.showModalStripe = false;
  }

  rafraichirAbonnementsSuperAdmin(): void {
    if (!this.authService.isSuperAdmin()) {
      return;
    }
    forkJoin({
      actifs: this.abonnementService.listerAbonnementsActifsSuperAdmin().pipe(
        catchError(() => of([] as AbonnementCliniqueSummary[]))
      ),
      payes: this.abonnementService.listerAbonnementsPayesSuperAdmin().pipe(
        catchError(() => of([] as AbonnementCliniqueSummary[]))
      ),
    }).subscribe({
      next: ({ actifs, payes }) => {
        this.abonnementsActifs = actifs || [];
        this.abonnementsPayes = payes || [];
      },
      error: () => {},
    });
  }

  statutAbonnementPillClass(statut?: string | null): string {
    const s = (statut || '').toUpperCase();
    if (s === 'ACTIF') return 'pill-actif';
    if (s === 'EN_ATTENTE_PAIEMENT') return 'pill-attente';
    if (s === 'IMPAYE' || s === 'ANNULE') return 'pill-danger';
    return 'pill-neutral';
  }

  tronquerId(id: string | null | undefined, max = 14): string {
    if (!id) return '—';
    return id.length <= max ? id : `${id.slice(0, max)}…`;
  }

  annulerEditionOffre(): void {
    this.resetFormOffre();
    this.fermerModalOffre();
  }

  enregistrerStripeConfig(): void {
    this.savingStripeCfg = true;
    this.error = '';
    this.success = '';
    this.abonnementService
      .postStripeConfig({
        modeFacturation: this.cfgMode,
        publishableKey: this.cfgPublishable || undefined,
        secretKey: this.cfgSecret || undefined,
        webhookSecret: this.cfgWebhook || undefined,
      })
      .subscribe({
        next: () => {
          this.cfgSecret = '';
          this.cfgWebhook = '';
          this.success = 'Configuration Stripe enregistrée (clés sensibles non affichées dans l’interface).';
          this.abonnementService.getStripeConfig().subscribe((c) => (this.stripeCfg = c));
          this.savingStripeCfg = false;
          this.showModalStripe = false;
        },
        error: (e: { error?: { message?: string } }) => {
          this.error = e?.error?.message || 'Enregistrement de la configuration Stripe impossible.';
          this.savingStripeCfg = false;
        },
      });
  }

  resumeLimites(offre: OffreAbonnement): string[] {
    if (offre.categorie === 'CABINET_MEDICAL') {
      return [
        `${offre.nombrePatientsMax ?? 0} patients`,
        `${offre.nombrePersonnelMax ?? 0} employés`,
        `${offre.nombreRendezVousMax ?? 0} RDV`,
      ];
    }

    return [
      `${offre.smsGratuitsInclus ?? 0} SMS`,
      `${offre.nombreChambresMax ?? 0} chambres`,
      `${offre.nombrePersonnelMax ?? 0} personnels`,
    ];
  }

  chargerAbonnementCourant(): void {
    this.abonnementService.getCurrentSubscription().subscribe({
      next: (row) => {
        this.abonnementCourant = row;
      },
      error: () => {
        this.abonnementCourant = null;
      },
    });
  }

  chargerHistoriqueAbonnements(): void {
    this.abonnementService.getSubscriptionHistory().subscribe({
      next: (rows) => {
        this.historiqueAbonnements = rows || [];
      },
      error: () => {
        this.historiqueAbonnements = [];
      },
    });
  }

  rafraichirAbonnement(): void {
    this.chargerAbonnementCourant();
    this.chargerHistoriqueAbonnements();
  }

  libelleStatutAbonnement(statut?: string | null): string {
    switch ((statut || '').toUpperCase()) {
      case 'ACTIF':
        return 'Actif';
      case 'EN_ATTENTE_PAIEMENT':
        return 'En attente de paiement';
      case 'IMPAYE':
        return 'Paiement échoué';
      case 'ANNULE':
        return 'Annulé';
      default:
        return statut || 'Inconnu';
    }
  }

  planifierRafraichissementAbonnement(): void {
    this.rafraichirAbonnement();
    setTimeout(() => this.rafraichirAbonnement(), 3000);
    setTimeout(() => this.rafraichirAbonnement(), 7000);
  }

  private buildOffrePayload(): Partial<OffreAbonnement> {
    const nom = this.nouvelleNom.trim();
    const duree = Math.min(36, Math.max(1, this.nouvelleDuree || 1));
    const existing = this.offres.find((o) => o.id === this.editingOffreId);

    return {
      nom,
      description: this.nouvelleDescription.trim() || null,
      prixMensuel: Math.max(0, this.nouvellePrix || 0),
      prixAnnuel: this.nouvellePrixAnnuel > 0 ? this.nouvellePrixAnnuel : Math.max(0, this.nouvellePrix || 0) * 12,
      smsGratuitsInclus: this.isCategorieClinique ? Math.max(0, this.nouvelleSms || 0) : 0,
      nombreChambresMax: this.isCategorieClinique ? Math.max(0, this.nouvelleChambres || 0) : 0,
      nombrePersonnelMax: Math.max(0, this.nouvellePersonnel || 0),
      nombrePatientsMax: this.isCategorieClinique ? 0 : Math.max(0, this.nouvellePatients || 0),
      nombreRendezVousMax: this.isCategorieClinique ? 0 : Math.max(0, this.nouvelleRendezVous || 0),
      dureeMois: duree,
      categorie: this.nouvelleCategorie,
      periodeEssaiJours: Math.max(0, this.nouvelleEssai || 0),
      popular: existing?.popular ?? false,
      ordreAffichage: existing?.ordreAffichage ?? this.offres.length,
      actif: existing?.actif ?? true,
    };
  }

  private resetFormOffre(): void {
    this.editingOffreId = null;
    this.nouvelleNom = '';
    this.nouvelleDescription = '';
    this.nouvellePrix = 0;
    this.nouvellePrixAnnuel = 0;
    this.nouvelleSms = 0;
    this.nouvelleChambres = 0;
    this.nouvellePersonnel = 0;
    this.nouvellePatients = 0;
    this.nouvelleRendezVous = 0;
    this.nouvelleDuree = 12;
    this.nouvelleCategorie = 'CLINIQUE';
    this.nouvelleEssai = 0;
  }
}
