import { apiGet, apiPost } from '@/src/api/client';
import { BILLING } from '@/src/api/endpoints';
import { billingScopeQuery } from '@/src/utils/billingScope';

export type BillingScope = 'clinique' | 'cabinet';

export interface OffreAbonnementSummary {
  id: string;
  nom: string;
  description?: string;
  prixMensuel?: number;
  prixAnnuel?: number;
  dureeMois?: number;
  categorie?: string;
  smsGratuitsInclus?: number;
  nombreChambresMax?: number;
  nombrePersonnelMax?: number;
  nombrePatientsMax?: number;
  nombreRendezVousMax?: number;
  periodeEssaiJours?: number;
  popular?: boolean;
  economieAnnuelleEstimee?: number;
}

export interface AbonnementSummary {
  id?: string;
  statut?: string;
  offreNom?: string;
  dateDebut?: string;
  datePremierPaiement?: string;
  dateFin?: string;
  montantPaye?: number;
  periodeFacturation?: string;
  accesAutorise?: boolean;
  cliniqueNom?: string;
  medecinCabinetNom?: string;
}

export interface SmsQuotaStatus {
  autorise?: boolean;
  message?: string;
  limite?: number;
  utilises?: number;
  restants?: number;
  offreNom?: string;
  periodeDebut?: string;
  periodeFin?: string;
}

export async function fetchOffresActives(scope: BillingScope): Promise<OffreAbonnementSummary[]> {
  const url = scope === 'cabinet' ? BILLING.OFFRES_ACTIVES_CABINET : BILLING.OFFRES_ACTIVES;
  const data = await apiGet<OffreAbonnementSummary[]>(url);
  return data ?? [];
}

export async function fetchAbonnementCourant(scope: BillingScope): Promise<AbonnementSummary | null> {
  try {
    return await apiGet<AbonnementSummary>(
      `${BILLING.ABONNEMENT_COURANT}${billingScopeQuery(scope)}`,
    );
  } catch {
    return null;
  }
}

export async function fetchHistoriqueAbonnements(scope: BillingScope): Promise<AbonnementSummary[]> {
  const data = await apiGet<AbonnementSummary[]>(
    `${BILLING.HISTORIQUE}${billingScopeQuery(scope)}`,
  );
  return data ?? [];
}

export async function fetchSmsQuota(): Promise<SmsQuotaStatus | null> {
  try {
    return await apiGet<SmsQuotaStatus>(BILLING.SMS_QUOTA);
  } catch {
    return null;
  }
}

export async function confirmStripeCheckout(
  sessionId: string,
  scope: BillingScope,
): Promise<{ message?: string; abonnement?: AbonnementSummary }> {
  return apiPost(BILLING.CONFIRM_CHECKOUT, { sessionId, scope });
}

export async function startStripeCheckout(payload: {
  offreId: string;
  interval: 'MONTHLY' | 'YEARLY';
  scope: BillingScope;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl?: string; url?: string; sessionId?: string }> {
  return apiPost(BILLING.CHECKOUT, payload);
}

export async function souscriptionSimulee(
  offreId: string,
  interval: 'MONTHLY' | 'YEARLY',
  scope: BillingScope,
): Promise<void> {
  await apiPost(BILLING.SOUSCRIPTION_SIMULEE, { offreId, interval, scope });
}

export function prixPourPeriode(
  offre: OffreAbonnementSummary,
  interval: 'MONTHLY' | 'YEARLY',
): number {
  if (interval === 'YEARLY') {
    return offre.prixAnnuel ?? (offre.prixMensuel ?? 0) * 12;
  }
  return offre.prixMensuel ?? 0;
}
