import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Hospitalisation } from '../model/hospitalisation';
import { NoteHospitalisation, NoteHospitalisationPayload } from '../model/note-hospitalisation';
import { environment } from '../../environments/environment';

export interface CreerHospitalisationPayload {
  dateEntree: string;
  motif: string;
  patientId: string;
  medecinId: string;
  chambreId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HospitalisationService {
  private apiUrl = `${environment.apiUrl}/api/hospitalisations`;

  constructor(private http: HttpClient) { }

  /** Clôture une hospitalisation (sortie du patient, chambre libérée côté serveur). */
  terminerHospitalisation(id: string, dateSortie: string): Observable<Hospitalisation> {
    const params = new HttpParams().set('dateSortie', dateSortie);
    return this.http.patch<Hospitalisation>(`${this.apiUrl}/${id}/terminer`, null, { params });
  }

  creerHospitalisation(payload: CreerHospitalisationPayload): Observable<Hospitalisation> {
    const body: any = {
      dateEntree: payload.dateEntree,
      motif: payload.motif,
      patient: { id: payload.patientId },
      medecin: { id: payload.medecinId }
    };

    if (payload.chambreId) {
      body.chambre = { id: payload.chambreId };
    }

    return this.http.post<Hospitalisation>(this.apiUrl, body);
  }

  obtenirHospitalisationsEnCours(): Observable<Hospitalisation[]> {
    return this.http.get<Hospitalisation[]>(`${this.apiUrl}/en-cours`);
  }

  obtenirHospitalisationsParPatient(patientId: string): Observable<Hospitalisation[]> {
    return this.http.get<Hospitalisation[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  obtenirNotes(hospitalisationId: string): Observable<NoteHospitalisation[]> {
    return this.http.get<NoteHospitalisation[]>(`${this.apiUrl}/${hospitalisationId}/notes`);
  }

  ajouterNote(hospitalisationId: string, payload: NoteHospitalisationPayload): Observable<NoteHospitalisation> {
    return this.http.post<NoteHospitalisation>(`${this.apiUrl}/${hospitalisationId}/notes`, payload);
  }
}
