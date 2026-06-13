import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CliniqueSmsOverviewDTO } from '../model/abonnement.model';
import { CliniqueTunisieSmsConfigDTO, CliniqueTunisieSmsUpdateDTO } from '../model/tunisie-sms-config';
import { Clinique, CreerCliniqueAvecAdminDTO } from '../model/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CliniqueService {
  private baseUrl = `${environment.apiUrl}/api/cliniques`;

  constructor(private http: HttpClient) { }

  // Créer une clinique
  creerClinique(clinique: Clinique): Observable<Clinique> {
    return this.http.post<Clinique>(this.baseUrl, clinique);
  }

  // Obtenir toutes les cliniques
  obtenirToutesLesCliniques(): Observable<Clinique[]> {
    return this.http.get<Clinique[]>(this.baseUrl);
  }

  // Alias pour getAllCliniques
  getAllCliniques(): Observable<Clinique[]> {
    return this.obtenirToutesLesCliniques();
  }

  // Obtenir les cliniques actives
  obtenirCliniquesActives(): Observable<Clinique[]> {
    return this.http.get<Clinique[]>(`${this.baseUrl}/actives`);
  }

  // Obtenir une clinique par ID
  obtenirCliniqueParId(id: string): Observable<Clinique> {
    return this.http.get<Clinique>(`${this.baseUrl}/${id}`);
  }

  // Alias pour getCliniqueById
  getCliniqueById(id: string): Observable<Clinique> {
    return this.obtenirCliniqueParId(id);
  }

  // Mettre à jour une clinique
  mettreAJourClinique(id: string, clinique: Clinique): Observable<Clinique> {
    return this.http.put<Clinique>(`${this.baseUrl}/${id}`, clinique);
  }

  // Alias pour updateClinique
  updateClinique(id: string, clinique: Clinique): Observable<Clinique> {
    return this.mettreAJourClinique(id, clinique);
  }

  // Supprimer une clinique
  supprimerClinique(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Alias pour deleteClinique
  deleteClinique(id: string): Observable<void> {
    return this.supprimerClinique(id);
  }

  // Calculer l'occupation d'une clinique
  calculerOccupation(id: string): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${id}/occupation`);
  }

  // Créer une clinique avec son administrateur (Super Admin)
  creerCliniqueAvecAdministrateur(dto: CreerCliniqueAvecAdminDTO): Observable<Clinique> {
    return this.http.post<Clinique>(`${this.baseUrl}/avec-administrateur`, dto);
  }

  // Vérifier si un téléphone existe
  verifierTelephone(telephone: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/admin/verifier-telephone/${telephone}`);
  }

  obtenirConfigurationTunisieSms(cliniqueId: string): Observable<CliniqueTunisieSmsConfigDTO> {
    return this.http.get<CliniqueTunisieSmsConfigDTO>(`${this.baseUrl}/${cliniqueId}/configuration-tunisiesms`);
  }

  mettreAJourConfigurationTunisieSms(
    cliniqueId: string,
    dto: CliniqueTunisieSmsUpdateDTO
  ): Observable<CliniqueTunisieSmsConfigDTO> {
    return this.http.put<CliniqueTunisieSmsConfigDTO>(`${this.baseUrl}/${cliniqueId}/configuration-tunisiesms`, dto);
  }

  /** Super admin : tableau de toutes les cliniques (SMS / clé). */
  obtenirVueSmsSuperAdmin(): Observable<CliniqueSmsOverviewDTO[]> {
    return this.http.get<CliniqueSmsOverviewDTO[]>(`${this.baseUrl}/vue-sms-super-admin`);
  }
}
