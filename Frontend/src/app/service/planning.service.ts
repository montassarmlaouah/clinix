import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Planning } from '../model/planning';

@Injectable({
  providedIn: 'root',
})
export class PlanningService {
  private baseUrl = 'http://localhost:8080/api/plannings';

  constructor(private http: HttpClient) {}

  creerPlanningHebdomadaire(payload: {
    dateDebut: string;
    utilisateurIds: string[];
    createurId: string;
  }): Observable<Planning> {
    return this.http.post<Planning>(`${this.baseUrl}/hebdomadaire`, payload);
  }

  creerPlanningMensuel(payload: {
    dateDebut: string;
    utilisateurIds: string[];
    createurId: string;
  }): Observable<Planning> {
    return this.http.post<Planning>(`${this.baseUrl}/mensuel`, payload);
  }

  obtenirTousLesPlannings(): Observable<Planning[]> {
    return this.http.get<Planning[]>(this.baseUrl);
  }

  obtenirPlanningParId(planningId: string): Observable<Planning> {
    return this.http.get<Planning>(`${this.baseUrl}/${planningId}`);
  }

  obtenirPlanningsParUtilisateur(utilisateurId: string): Observable<Planning[]> {
    return this.http.get<Planning[]>(`${this.baseUrl}/utilisateur/${utilisateurId}`);
  }

  obtenirPlanningsParPeriode(debut: string, fin: string): Observable<Planning[]> {
    return this.http.get<Planning[]>(`${this.baseUrl}/periode`, {
      params: { debut, fin }
    });
  }

  telechargerPlanningPdf(planningId: string, serviceId?: string, utilisateurId?: string): Observable<Blob> {
    const params: Record<string, string> = {};
    if (serviceId) params['serviceId'] = serviceId;
    if (utilisateurId) params['utilisateurId'] = utilisateurId;
    return this.http.get(`${this.baseUrl}/${planningId}/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  validerPlanning(planningId: string): Observable<Planning> {
    return this.http.patch<Planning>(`${this.baseUrl}/${planningId}/valider`, {});
  }
}
