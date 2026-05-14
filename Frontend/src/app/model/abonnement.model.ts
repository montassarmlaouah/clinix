/** GET /api/cliniques/vue-sms-super-admin */
export interface CliniqueSmsOverviewDTO {
  cliniqueId: string;
  nomClinique: string;
  actif: boolean;
  abonnementSmsGratuits: boolean;
  cleApiConfiguree: boolean;
  tunisiesmsSender: string | null;
  cleMasquee: string | null;
}

/** Offre tarifaire */
export interface OffreAbonnement {
  id: string;
  nom: string;
  description: string | null;
  prixMensuel: number;
  smsGratuitsInclus: number;
  nombreChambresMax?: number;
  nombrePersonnelMax?: number;
  nombrePatientsMax?: number;
  nombreRendezVousMax?: number;
  /** Mois — défini par le super admin pour l’offre */
  dureeMois?: number;
  popular: boolean;
  ordreAffichage: number;
  actif: boolean;
  prixAnnuel?: number;
  categorie?: string;
  periodeEssaiJours?: number;
  stripeSynchronise?: boolean;
  economieAnnuelleEstimee?: number;
  stripeProductId?: string | null;
  stripePriceMensuelId?: string | null;
  stripePriceAnnuelId?: string | null;
}

export interface AbonnementCliniqueSummary {
  id: string;
  statut: string;
  dateDebut: string;
  dateFin: string;
  dateCreation: string;
  montantPaye: number;
  periodeFacturation?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeSessionId?: string | null;
  offreId?: string | null;
  offreNom?: string | null;
  offreCategorie?: string | null;
  cliniqueId?: string | null;
  cliniqueNom?: string | null;
}

/** Réponse GET /api/billing/stripe-config (super admin) */
export interface StripeConfigAdminDTO {
  mode: string;
  publishableKeyMasked: string;
  publishableConfigured: boolean;
  stripeSecretConfigured: boolean;
  secretResolvedFromEnvironment: boolean;
  webhookConfigured: boolean;
  webhookFromEnvironment: boolean;
  fieldCipherEnabled: boolean;
  remarqueStripeTest: string;
  securiteCle: string;
}
