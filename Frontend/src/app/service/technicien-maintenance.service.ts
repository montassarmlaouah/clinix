import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { Equipement } from '../model/materiel-medical';

@Injectable({ providedIn: 'root' })
export class TechnicienMaintenanceService {
  private readonly base = `${environment.apiUrl}/api/technicien-maintenance`;

  constructor(private http: HttpClient) {}

  listerEquipementsMaClinique(): Observable<Equipement[]> {
    return this.http.get<Equipement[]>(`${this.base}/equipements`);
  }

  listerEquipementsEnPanne(): Observable<Equipement[]> {
    return this.http.get<Equipement[]>(`${this.base}/equipements/en-panne`);
  }

  obtenirEquipement(id: string): Observable<Equipement> {
    return this.http.get<Equipement>(`${this.base}/equipements/${id}`);
  }

  /** Clôture la panne : équipement repassé en fonctionnel + e-mail aux admins clinique. */
  traiterPanne(
    equipementId: string,
    payload: { repairType: string; repairNotes: string; repairHours: number; repairMinutes: number }
  ): Observable<Equipement> {
    return this.http.post<Equipement>(`${this.base}/equipements/${equipementId}/traiter-panne`, payload);
  }
}
