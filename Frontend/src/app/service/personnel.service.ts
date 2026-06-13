import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Medecin, CreerPersonnelDTO } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class PersonnelService {
  private baseUrl = `${environment.apiUrl}/api/personnel`;

  constructor(private http: HttpClient) { }

  // Créer un membre du personnel (Admin Clinique)
  creerPersonnel(dto: CreerPersonnelDTO): Observable<any> {
    return this.http.post<any>(this.baseUrl, dto);
  }

  rechercherMedecinsRattachement(q: string, cin?: string): Observable<Array<Record<string, unknown>>> {
    let url = `${this.baseUrl}/medecins/recherche-rattachement?q=${encodeURIComponent(q)}`;
    if (cin?.trim()) {
      url += `&cin=${encodeURIComponent(cin.trim())}`;
    }
    return this.http.get<Array<Record<string, unknown>>>(url);
  }

  confirmerCodeInvitationPdf(telephone: string, role: string, codeInvitationPdf: string): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${this.baseUrl}/confirmer-code-invitation-pdf`, {
      telephone,
      role,
      codeInvitationPdf,
    });
  }

  // Vérifier si un compte en attente existe
  verifierCompteEnAttente(telephone: string, role: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/verifier-compte/${telephone}/${role}`);
  }

  // ===== MÉDECINS =====

  // Lister les médecins de la clinique de l'admin connecté
  listerMedecins(): Observable<Medecin[]> {
    return this.http.get<Medecin[]>(`${this.baseUrl}/medecins`);
  }

  // Obtenir un médecin par ID
  obtenirMedecin(id: string): Observable<Medecin> {
    return this.http.get<Medecin>(`${this.baseUrl}/medecins/${id}`);
  }

  // Supprimer un médecin
  supprimerMedecin(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/medecins/${id}`);
  }

  reactiverMedecin(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/medecins/${id}/reactiver`, {});
  }

  // ===== INFIRMIERS =====

  listerInfirmiers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/infirmiers`);
  }

  obtenirInfirmier(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/infirmiers/${id}`);
  }

  supprimerInfirmier(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/infirmiers/${id}`);
  }

  reactiverInfirmier(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/infirmiers/${id}/reactiver`, {});
  }

  // ===== RADIOLOGUES =====

  listerRadiologues(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/radiologues`);
  }

  obtenirRadiologue(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/radiologues/${id}`);
  }

  supprimerRadiologue(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/radiologues/${id}`);
  }

  reactiverRadiologue(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/radiologues/${id}/reactiver`, {});
  }

  // ===== PHARMACIENS =====

  listerPharmaciens(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/pharmaciens`);
  }

  obtenirPharmacien(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/pharmaciens/${id}`);
  }

  supprimerPharmacien(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/pharmaciens/${id}`);
  }

  reactiverPharmacien(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/pharmaciens/${id}/reactiver`, {});
  }

  // ===== SECRÉTAIRES =====

  listerSecretaires(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/secretaires`);
  }

  obtenirSecretaire(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/secretaires/${id}`);
  }

  supprimerSecretaire(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/secretaires/${id}`);
  }

  reactiverSecretaire(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/secretaires/${id}/reactiver`, {});
  }

  // ===== CHEFS PERSONNEL =====

  listerChefsPersonnel(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chefs-personnel`);
  }

  supprimerChefPersonnel(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/chefs-personnel/${id}`);
  }

  reactiverChefPersonnel(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/chefs-personnel/${id}/reactiver`, {});
  }

  // ===== TECHNICIENS MAINTENANCE =====

  listerTechniciensMaintenance(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/techniciens-maintenance`);
  }

  supprimerTechnicienMaintenance(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/techniciens-maintenance/${id}`);
  }

  reactiverTechnicienMaintenance(id: string): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/techniciens-maintenance/${id}/reactiver`, {});
  }

  // ===== ADMINISTRATEURS CLINIQUE =====
  private adminCliniqueUrl = `${environment.apiUrl}/api/administrateurs-clinique`;

  listerAdministrateursClinique(): Observable<any[]> {
    return this.http.get<any[]>(this.adminCliniqueUrl);
  }

  creerAdministrateurClinique(payload: {
    nom: string;
    prenom: string;
    telephone: string;
    email?: string;
    cliniqueId: string;
  }): Observable<any> {
    return this.http.post<any>(this.adminCliniqueUrl, payload);
  }

  obtenirAdministrateurClinique(id: string): Observable<any> {
    return this.http.get<any>(`${this.adminCliniqueUrl}/${id}`);
  }

  supprimerAdministrateurClinique(id: string): Observable<any> {
    return this.http.delete<any>(`${this.adminCliniqueUrl}/${id}`);
  }

  reinitialiserMotDePasseAdministrateur(id: string): Observable<{
    adminId: string;
    telephone: string;
    smsEnvoye: boolean;
    smsDetail: string;
    message: string;
  }> {
    return this.http.post<{
      adminId: string;
      telephone: string;
      smsEnvoye: boolean;
      smsDetail: string;
      message: string;
    }>(`${this.adminCliniqueUrl}/${id}/reinitialiser-mot-de-passe`, {});
  }
}
