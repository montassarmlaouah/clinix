import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CreerCabinetMedecinDTO, Medecin, CabinetMedecinCreationResponse } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class MedecinService {
  private baseUrl = `${environment.apiUrl}/api/medecins`;
  private cabinetsUrl = `${this.baseUrl}/cabinets`;

  constructor(private http: HttpClient) { }

  /** Super admin — cabinets médecins (sans clinique) */
  listerCabinetsMedecins(): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(this.cabinetsUrl);
  }

  verifierCinCabinet(cin: string, telephone?: string): Observable<Record<string, unknown>> {
    let url = `${this.cabinetsUrl}/verifier-cin?cin=${encodeURIComponent(cin.trim())}`;
    if (telephone?.trim()) {
      url += `&telephone=${encodeURIComponent(telephone.trim())}`;
    }
    return this.http.get<Record<string, unknown>>(url);
  }

  creerCabinetMedecin(dto: CreerCabinetMedecinDTO): Observable<CabinetMedecinCreationResponse> {
    return this.http.post<CabinetMedecinCreationResponse>(this.cabinetsUrl, dto);
  }

  mettreAJourCabinetMedecin(id: string, dto: CreerCabinetMedecinDTO): Observable<Medecin> {
    return this.http.put<Medecin>(`${this.cabinetsUrl}/${id}`, dto);
  }

  supprimerCabinetMedecin(id: string): Observable<void> {
    return this.http.delete<void>(`${this.cabinetsUrl}/${id}`);
  }

  // Créer un médecin
  creerMedecin(medecin: Medecin): Observable<Medecin> {
    return this.http.post<Medecin>(this.baseUrl, medecin);
  }

  // Obtenir tous les médecins
  obtenirTousLesMedecins(): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(this.baseUrl);
  }

  // Obtenir un médecin par ID
  obtenirMedecinParId(id: string): Observable<Medecin> {
    return this.http.get<Medecin>(`${this.baseUrl}/${id}`);
  }

  // Obtenir les médecins par clinique
  obtenirMedecinsParClinique(cliniqueId: string): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(`${this.baseUrl}/clinique/${cliniqueId}`);
  }

  // Alias pour getMedecinsByClinique
  getMedecinsByClinique(cliniqueId: string): Observable<Medecin[]> {
    return this.obtenirMedecinsParClinique(cliniqueId);
  }

  // Obtenir les médecins par spécialité
  obtenirMedecinsParSpecialite(specialite: string): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(`${this.baseUrl}/specialite/${specialite}`);
  }

  // Mettre à jour un médecin
  mettreAJourMedecin(id: string, medecin: Medecin): Observable<Medecin> {
    return this.http.put<Medecin>(`${this.baseUrl}/${id}`, medecin);
  }

  // Supprimer un médecin
  supprimerMedecin(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Médecin cabinet : liste ses patients */
  listerPatientsCabinet(medecinId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${medecinId}/patients?scope=cabinet`);
  }

  /** Médecin cabinet : ajouter un patient */
  ajouterPatientCabinet(medecinId: string, dto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${medecinId}/patients?scope=cabinet`, dto);
  }
}
