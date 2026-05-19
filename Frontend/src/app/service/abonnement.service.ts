import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AbonnementCliniqueSummary,
  OffreAbonnement,
  SmsQuotaStatus,
  StripeConfigAdminDTO,
} from '../model/abonnement.model';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AbonnementService {
  private readonly base = `${environment.apiUrl}/api/billing`;

  constructor(private http: HttpClient) {}

  listerToutesOffres(): Observable<OffreAbonnement[]> {
    return this.http.get<OffreAbonnement[]>(`${this.base}/offres`);
  }

  listerOffresActives(): Observable<OffreAbonnement[]> {
    return this.http.get<OffreAbonnement[]>(`${this.base}/offres/actives`);
  }

  /** Médecin cabinet : forfaits catégorie CABINET_MEDICAL. */
  listerOffresActivesCabinet(): Observable<OffreAbonnement[]> {
    return this.http.get<OffreAbonnement[]>(`${this.base}/offres/actives-cabinet`);
  }

  creerOffre(payload: Partial<OffreAbonnement>): Observable<OffreAbonnement> {
    return this.http.post<OffreAbonnement>(`${this.base}/offres`, payload);
  }

  mettreAJourOffre(id: string, patch: Partial<OffreAbonnement>): Observable<OffreAbonnement> {
    return this.http.patch<OffreAbonnement>(`${this.base}/offres/${id}`, patch);
  }

  supprimerOffre(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/offres/${id}`);
  }

  synchroniserStripe(offreId: string): Observable<OffreAbonnement> {
    return this.http.post<OffreAbonnement>(`${this.base}/offres/${offreId}/sync-stripe`, {});
  }

  demarrerStripeCheckout(payload: {
    offreId: string;
    interval: 'MONTHLY' | 'YEARLY';
    successUrl?: string;
    cancelUrl?: string;
    scope?: 'clinique' | 'cabinet';
  }): Observable<{ checkoutUrl?: string; sessionId?: string }> {
    return this.http.post<{ checkoutUrl?: string; sessionId?: string }>(`${this.base}/checkout`, {
      offreId: payload.offreId,
      interval: payload.interval,
      successUrl: payload.successUrl,
      cancelUrl: payload.cancelUrl,
      scope: payload.scope,
    });
  }

  souscriptionSimulee(
    offreId: string,
    interval: 'MONTHLY' | 'YEARLY',
    scope?: 'clinique' | 'cabinet'
  ): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.base}/souscription-simulee`, {
      offreId,
      interval,
      scope,
    });
  }

  getStripeConfig(): Observable<StripeConfigAdminDTO> {
    return this.http.get<StripeConfigAdminDTO>(`${this.base}/stripe-config`);
  }

  getCurrentSubscription(scope?: 'clinique' | 'cabinet'): Observable<AbonnementCliniqueSummary | null> {
    const params = scope ? { scope } : undefined;
    return this.http
      .get<AbonnementCliniqueSummary>(`${this.base}/abonnement-courant`, { observe: 'response', params })
      .pipe(map((res) => (res.status === 204 ? null : res.body ?? null)));
  }

  getSubscriptionHistory(scope?: 'clinique' | 'cabinet'): Observable<AbonnementCliniqueSummary[]> {
    const params = scope ? { scope } : undefined;
    return this.http.get<AbonnementCliniqueSummary[]>(`${this.base}/abonnements/historique`, { params });
  }

  /** Admin clinique : quota SMS de l'offre active (clinique du compte). */
  getSmsQuotaCourant(): Observable<SmsQuotaStatus> {
    return this.http.get<SmsQuotaStatus>(`${this.base}/sms-quota`);
  }

  /** Super admin : quota SMS d'une clinique par identifiant. */
  getSmsQuotaClinique(cliniqueId: string): Observable<SmsQuotaStatus> {
    return this.http.get<SmsQuotaStatus>(`${this.base}/clinique/${cliniqueId}/sms-quota`);
  }

  /** Super admin : abonnements au statut Actif (toutes cliniques). */
  listerAbonnementsActifsSuperAdmin(): Observable<AbonnementCliniqueSummary[]> {
    return this.http.get<AbonnementCliniqueSummary[]>(`${this.base}/abonnements/actifs`);
  }

  /** Super admin : abonnements avec montant paye > 0 (toutes cliniques). */
  listerAbonnementsPayesSuperAdmin(): Observable<AbonnementCliniqueSummary[]> {
    return this.http.get<AbonnementCliniqueSummary[]>(`${this.base}/abonnements/payes`);
  }

  postStripeConfig(body: {
    modeFacturation?: string;
    publishableKey?: string;
    secretKey?: string;
    webhookSecret?: string;
  }): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.base}/stripe-config`, body);
  }
}
