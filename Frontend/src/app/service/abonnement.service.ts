import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AbonnementCliniqueSummary, OffreAbonnement, StripeConfigAdminDTO } from '../model/abonnement.model';
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
  }): Observable<{ checkoutUrl?: string; sessionId?: string }> {
    return this.http.post<{ checkoutUrl?: string; sessionId?: string }>(`${this.base}/checkout`, {
      offreId: payload.offreId,
      interval: payload.interval,
      successUrl: payload.successUrl,
      cancelUrl: payload.cancelUrl,
    });
  }

  souscriptionSimulee(offreId: string, interval: 'MONTHLY' | 'YEARLY'): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.base}/souscription-simulee`, { offreId, interval });
  }

  getStripeConfig(): Observable<StripeConfigAdminDTO> {
    return this.http.get<StripeConfigAdminDTO>(`${this.base}/stripe-config`);
  }

  getCurrentSubscription(): Observable<AbonnementCliniqueSummary | null> {
    return this.http.get<AbonnementCliniqueSummary | null>(`${this.base}/abonnement-courant`);
  }

  getSubscriptionHistory(): Observable<AbonnementCliniqueSummary[]> {
    return this.http.get<AbonnementCliniqueSummary[]>(`${this.base}/abonnements/historique`);
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
