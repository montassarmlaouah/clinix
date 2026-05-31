import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient, PatientDTO } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private baseUrl = `${environment.apiUrl}/api/patients`;

  constructor(private http: HttpClient) { }

  // Créer un nouveau patient
  creerPatient(patientDTO: PatientDTO): Observable<Patient> {
    return this.http.post<Patient>(this.baseUrl, patientDTO);
  }

  // Obtenir tous les patients
  obtenirTousLesPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(this.baseUrl);
  }

  // Obtenir un patient par ID
  obtenirPatientParId(id: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/${id}`);
  }

  // Obtenir un patient par numéro
  obtenirPatientParNumero(numeroPatient: string): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/numero/${numeroPatient}`);
  }

  // Obtenir les patients d'une clinique
  getPatientsByClinique(cliniqueId: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/clinique/${cliniqueId}`);
  }

  // Obtenir les patients hospitalisés dans un service
  getPatientsByService(serviceId: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/service/${serviceId}`);
  }

  // Mettre à jour un patient
  mettreAJourPatient(id: string, patientDTO: PatientDTO): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}`, patientDTO);
  }

  // Vérification administrative par secrétaire
  verifierParSecretaire(id: string): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}/verifier-secretaire`, {});
  }

  // Supprimer un patient
  supprimerPatient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  reactiverPatient(id: string): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}/reactiver`, {});
  }

  getPatientsInactifsParClinique(cliniqueId: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/clinique/${cliniqueId}/inactifs`);
  }

  // Rechercher des patients
  rechercherPatients(keyword: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.baseUrl}/recherche?keyword=${keyword}`);
  }

  /** Patients suivis en cabinet par le médecin connecté (GET /api/medecins/{id}/patients). */
  getPatientsCabinetMedecin(medecinId: string): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${environment.apiUrl}/api/medecins/${medecinId}/patients`, {
      params: { scope: 'cabinet' },
    });
  }

  creerPatientCabinet(medecinId: string, dto: PatientDTO): Observable<Patient> {
    return this.http.post<Patient>(`${environment.apiUrl}/api/medecins/${medecinId}/patients`, dto, {
      params: { scope: 'cabinet' },
    });
  }
}
