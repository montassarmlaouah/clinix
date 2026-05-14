import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RendezVous, RendezVousDTO } from '../model/user.model';

@Injectable({
  providedIn: 'root',
})
export class RendezVousService {
  private baseUrl = `${environment.apiUrl}/api/rendez-vous`;

  constructor(private http: HttpClient) { }

  // Créer un nouveau rendez-vous
  creerRendezVous(rendezVousDTO: RendezVousDTO): Observable<RendezVous> {
    return this.http.post<RendezVous>(this.baseUrl, rendezVousDTO);
  }

  // Alias pour createRendezVous
  createRendezVous(rendezVousDTO: RendezVousDTO): Observable<RendezVous> {
    return this.creerRendezVous(rendezVousDTO);
  }

  // Obtenir tous les rendez-vous
  getAllRendezVous(): Observable<RendezVousDTO[]> {
    return this.http.get<RendezVousDTO[]>(this.baseUrl);
  }

  // Obtenir un rendez-vous par ID
  getRendezVousById(id: string): Observable<RendezVous> {
    return this.http.get<RendezVous>(`${this.baseUrl}/${id}`);
  }

  // Mettre à jour un rendez-vous
  updateRendezVous(id: string, rendezVousDTO: RendezVousDTO): Observable<RendezVous> {
    return this.http.put<RendezVous>(`${this.baseUrl}/${id}`, rendezVousDTO);
  }

  // Supprimer un rendez-vous
  deleteRendezVous(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Obtenir les rendez-vous par patient
  obtenirRendezVousParPatient(patientId: string): Observable<RendezVousDTO[]> {
    return this.http.get<RendezVousDTO[]>(`${this.baseUrl}/patient/${patientId}`);
  }

  // Alias pour getRendezVousByPatient
  getRendezVousByPatient(patientId: string): Observable<RendezVousDTO[]> {
    return this.obtenirRendezVousParPatient(patientId);
  }

  // Obtenir les rendez-vous par médecin
  obtenirRendezVousParMedecin(medecinId: string): Observable<RendezVousDTO[]> {
    return this.http.get<RendezVousDTO[]>(`${this.baseUrl}/medecin/${medecinId}`);
  }

  // Alias pour getRendezVousByMedecin
  getRendezVousByMedecin(medecinId: string): Observable<RendezVousDTO[]> {
    return this.obtenirRendezVousParMedecin(medecinId);
  }

  // Obtenir les rendez-vous par clinique
  getRendezVousByClinique(cliniqueId: string): Observable<RendezVousDTO[]> {
    return this.http.get<RendezVousDTO[]>(`${this.baseUrl}/clinique/${cliniqueId}`);
  }

  // Confirmer un rendez-vous
  confirmerRendezVous(id: string): Observable<RendezVous> {
    return this.http.patch<RendezVous>(`${this.baseUrl}/${id}/confirmer`, {});
  }

  // Annuler un rendez-vous
  annulerRendezVous(id: string): Observable<RendezVous> {
    return this.http.patch<RendezVous>(`${this.baseUrl}/${id}/annuler`, {});
  }

  // Reporter un rendez-vous
  reporterRendezVous(id: string, nouvelleDate: string): Observable<RendezVous> {
    const params = new HttpParams().set('nouvelleDate', nouvelleDate);
    return this.http.patch<RendezVous>(`${this.baseUrl}/${id}/reporter`, {}, { params });
  }

  /** Rendez-vous de la clinique pour une journée (planning infirmier / visites). */
  listerCliniquePourJour(cliniqueId: string, dateIso?: string): Observable<RendezVous[]> {
    let params = new HttpParams();
    if (dateIso) {
      params = params.set('date', dateIso);
    }
    return this.http.get<RendezVous[]>(`${this.baseUrl}/clinique/${cliniqueId}/jour`, { params });
  }

  validationVisiteInfirmier(
    id: string,
    body: { observations?: string; signer: boolean }
  ): Observable<RendezVous> {
    return this.http.patch<RendezVous>(`${this.baseUrl}/${id}/validation-visite-infirmier`, body);
  }

  /** RDV patients de la clinique (hors suivi cabinet exclusif). */
  listerRdvCliniquePourMedecin(medecinId: string, cliniqueId: string): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.baseUrl}/medecin/${medecinId}/clinique/${cliniqueId}`);
  }

  /** RDV patients cabinet du médecin. */
  listerRdvCabinetPourMedecin(medecinId: string): Observable<RendezVous[]> {
    return this.http.get<RendezVous[]>(`${this.baseUrl}/medecin/${medecinId}/rdv-cabinet`);
  }

  confirmerRendezVousParMedecin(id: string): Observable<RendezVous> {
    return this.http.patch<RendezVous>(`${this.baseUrl}/${id}/confirmer-medecin`, {});
  }
}
