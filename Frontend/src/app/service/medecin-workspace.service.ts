import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MedecinStatistiques {
  patientsCabinet: number;
  patientsConsultationsDistincts: number;
  consultationsTotal: number;
  consultationsCeMois: number;
  ordonnancesTotal: number;
  rendezVousAujourdhui: number;
  soinsEnAttenteValidation: number;
}

@Injectable({ providedIn: 'root' })
export class MedecinWorkspaceService {
  private base(medecinId: string) {
    return `${environment.apiUrl}/api/medecins/${medecinId}/workspace`;
  }

  constructor(private http: HttpClient) {}

  statistiques(medecinId: string): Observable<MedecinStatistiques> {
    return this.http.get<MedecinStatistiques>(`${this.base(medecinId)}/statistiques`);
  }

  infirmiersMemeClinique(medecinId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base(medecinId)}/infirmiers`);
  }

  suiviSoins(medecinId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base(medecinId)}/soins-suivi`);
  }
}
