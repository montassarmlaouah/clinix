import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Garde } from '../model/garde';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GardeService {
  private baseUrl = `${environment.apiUrl}/api/gardes`;

  constructor(private http: HttpClient) {}

  creerShiftJour(payload: {
    utilisateurId: string;
    date: string;
    matin: boolean;
    planningId?: string;
    serviceId?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/shift-jour`, payload, {
      responseType: 'text' as 'json'
    });
  }

  creerGardeNuit(payload: {
    utilisateurId: string;
    dateDebut: string;
    planningId?: string;
    serviceId?: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/garde-nuit`, payload, {
      responseType: 'text' as 'json'
    });
  }

  obtenirGardesParUtilisateur(utilisateurId: string): Observable<Garde[]> {
    return this.http.get<Garde[]>(`${this.baseUrl}/utilisateur/${utilisateurId}`);
  }

  obtenirGardesParPlanning(planningId: string): Observable<Garde[]> {
    return this.http.get<Garde[]>(`${this.baseUrl}/planning/${planningId}`);
  }

  telechargerPlanningUtilisateurPdf(utilisateurId: string, debut: string, fin: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/utilisateur/${utilisateurId}/pdf`, {
      params: { debut, fin },
      responseType: 'blob'
    });
  }
}
