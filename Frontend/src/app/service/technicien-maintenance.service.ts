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

  /** Renvoie notifications + e-mails (SMTP doit être configuré côté serveur). */
  renvoyerAlerteEmail(equipementId: string, note?: string): Observable<unknown> {
    return this.http.post(`${this.base}/equipements/${equipementId}/alerte-email`, note ? { note } : {});
  }
}
