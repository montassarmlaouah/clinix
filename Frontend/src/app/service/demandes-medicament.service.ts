import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DemandeMedicament {
  id: string;
  patient: { id: string; nom: string; prenom: string; numeroPatient?: string };
  demandeur: { id: string; nom: string; prenom: string };
  clinique?: { id: string; nom: string };
  chambre?: { id: string; numero: string };
  statut: string;
  notes?: string;
  items: DemandeMedicamentItem[];
  dateCreation: string;
}

export interface DemandeMedicamentItem {
  id: string;
  medicament: { id: string; nom: string; forme?: string; dosage?: string };
  quantite: number;
  instructions?: string;
}

export interface DemandeMedicamentRequest {
  patientId: string;
  chambreId?: string;
  notes?: string;
  items: { medicamentId: string; quantite: number; instructions?: string }[];
}

@Injectable({ providedIn: 'root' })
export class DemandesMedicamentService {
  private base = `${environment.apiUrl}/api/demandes-medicament`;

  constructor(private http: HttpClient) {}

  creer(req: DemandeMedicamentRequest): Observable<DemandeMedicament> {
    return this.http.post<DemandeMedicament>(this.base, req);
  }

  listerEnAttente(cliniqueId?: string): Observable<DemandeMedicament[]> {
    let url = `${this.base}/en-attente`;
    if (cliniqueId) url += `?cliniqueId=${cliniqueId}`;
    return this.http.get<DemandeMedicament[]>(url);
  }

  listerParClinique(cliniqueId: string): Observable<DemandeMedicament[]> {
    return this.http.get<DemandeMedicament[]>(`${this.base}?cliniqueId=${cliniqueId}`);
  }

  listerParPatient(patientId: string): Observable<DemandeMedicament[]> {
    return this.http.get<DemandeMedicament[]>(`${this.base}?patientId=${patientId}`);
  }

  changerStatut(id: string, statut: string): Observable<DemandeMedicament> {
    return this.http.patch<DemandeMedicament>(`${this.base}/${id}/statut`, { statut });
  }
}
