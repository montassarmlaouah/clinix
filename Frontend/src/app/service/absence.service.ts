import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Absence, AbsenceDTO } from '../model/absence';

@Injectable({
  providedIn: 'root',
})
export class AbsenceService {
  private baseUrl = 'http://localhost:8080/api/absences';

  constructor(private http: HttpClient) {}

  creerDemande(dto: AbsenceDTO): Observable<Absence> {
    return this.http.post<Absence>(`${this.baseUrl}/demande`, dto);
  }

  obtenirAbsencesParInfirmier(utilisateurId: string): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.baseUrl}/infirmier/${utilisateurId}`);
  }

  obtenirToutesAbsences(): Observable<Absence[]> {
    return this.http.get<Absence[]>(this.baseUrl);
  }

  obtenirAbsencesParPeriode(debut: string, fin: string): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.baseUrl}/periode`, { params: { debut, fin } });
  }

  obtenirDemandesEnAttente(): Observable<Absence[]> {
    return this.http.get<Absence[]>(`${this.baseUrl}/en-attente`);
  }

  approuverDemande(absenceId: string): Observable<Absence> {
    return this.http.patch<Absence>(`${this.baseUrl}/${absenceId}/approuver`, {});
  }

  refuserDemande(absenceId: string, motifRefus: string): Observable<Absence> {
    return this.http.patch<Absence>(`${this.baseUrl}/${absenceId}/refuser`, {}, {
      params: { motifRefus }
    });
  }
}

