import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Presence } from '../model/presence';

@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  private baseUrl = 'http://localhost:8080/api/presences';

  constructor(private http: HttpClient) {}

  marquerPresence(
    infirmierId: string,
    date: string,
    heureArrivee: string,
    chefPersonnelId: string,
    observation?: string
  ): Observable<Presence> {
    const params: Record<string, string> = {
      infirmierId,
      date,
      heureArrivee,
      chefPersonnelId,
    };
    if (observation != null && observation !== '') {
      params['observation'] = observation;
    }
    return this.http.post<Presence>(`${this.baseUrl}/marquer-presence`, null, {
      params,
    });
  }

  marquerAbsence(
    infirmierId: string,
    date: string,
    motif: string,
    chefPersonnelId: string
  ): Observable<Presence> {
    return this.http.post<Presence>(`${this.baseUrl}/marquer-absence`, null, {
      params: { infirmierId, date, motif, chefPersonnelId },
    });
  }

  marquerPresencesMultiples(
    infirmierIds: string[],
    date: string,
    chefPersonnelId: string
  ): Observable<Presence[]> {
    return this.http.post<Presence[]>(`${this.baseUrl}/marquer-multiples`, {
      infirmierIds,
      date,
      chefPersonnelId,
    });
  }

  enregistrerDepart(presenceId: string, heureDepart: string): Observable<Presence> {
    return this.http.patch<Presence>(`${this.baseUrl}/${presenceId}/depart`, null, {
      params: { heureDepart },
    });
  }

  obtenirPresencesDuJour(date: string): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${this.baseUrl}/aujourdhui`, {
      params: { date },
    });
  }

  obtenirPresencesParPeriode(debut: string, fin: string): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${this.baseUrl}/periode`, {
      params: { debut, fin },
    });
  }

  obtenirHistoriqueInfirmier(infirmierId: string): Observable<Presence[]> {
    return this.http.get<Presence[]>(`${this.baseUrl}/infirmier/${infirmierId}`);
  }

  obtenirToutesLesPresences(): Observable<Presence[]> {
    return this.http.get<Presence[]>(this.baseUrl);
  }
}
