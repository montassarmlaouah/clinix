// src/types/superadmin.types.ts
export interface Clinique {
  id: string;
  nom: string;
  adresse: string;
  telephone?: string;
  actif: boolean;
  capacite?: number; // Ajouté pour le dashboard
  dateCreation?: string;
  statut?: { statut: 'ACTIF' | 'GRACE' | 'EXPIRE' | 'PERIODE_ESSAI' };
}

export interface CabinetMedecin {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  telephoneFixe?: string;
  specialite: string;
  localisation?: string;
  numeroPieceIdentite?: string;
  actif: boolean;
  dateCreation?: string;
  estCabinet: true;
}

// Modèle pour OffreAbonnement (complet)
export interface OffreAbonnement {
  id: string;
  nom: string;
  description?: string;
  actif: boolean;
  prixMensuel: number;
  prixAnnuel: number;
  dureeMois: number;
  categorie: 'CLINIQUE' | 'CABINET_MEDICAL';
  smsGratuitsInclus: number;
  nombreChambresMax: number;
  nombrePersonnelMax: number;
  nombrePatientsMax: number;
  nombreRendezVousMax: number;
  periodeEssaiJours: number;
  stripeSynchronise?: boolean;
  popular?: boolean;
  ordreAffichage?: number;
}

// Abonnement clinique (pour super admin)
export interface AbonnementCliniqueSummary {
  id: string;
  cliniqueId: string;
  cliniqueNom: string;
  offreId: string;
  offreNom: string;
  offreCategorie?: string;
  montantPaye: number;
  periodeFacturation: 'MONTHLY' | 'YEARLY';
  statut: 'ACTIF' | 'EN_ATTENTE_PAIEMENT' | 'IMPAYE' | 'ANNULE';
  dateDebut: string;
  dateFin: string;
  stripeSubscriptionId?: string;
}

// Configuration Stripe
export interface StripeConfig {
  mode: 'TEST' | 'LIVE';
  publishableKeyMasked?: string;
  stripeSecretConfigured: boolean;
  webhookConfigured: boolean;
  securiteCle?: string;
  remarqueStripeTest?: string;
  secretResolvedFromEnvironment?: boolean;
  webhookFromEnvironment?: boolean;
  fieldCipherEnabled?: boolean;
}