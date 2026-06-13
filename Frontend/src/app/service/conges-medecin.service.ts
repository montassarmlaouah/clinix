import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CongesMedecin {
  id: string;
  medecin: { id: string; nom: string; prenom: string; specialite?: string };
  dateDebut: string;
  dateFin: string;
  typeConge: string;
  statut: string;
  motif?: string;
  dateCreation: string;
}

export interface CongesMedecinRequest {
  medecinId: string;
  dateDebut: string;
  dateFin: string;
  typeConge: string;
  motif?: string;
}

@Injectable({ providedIn: 'root' })
export class CongesMedecinService {
  private base = `${environment.apiUrl}/api/conges-medecin`;

  constructor(private http: HttpClient) {}

  demanderConge(req: CongesMedecinRequest): Observable<CongesMedecin> {
    return this.http.post<CongesMedecin>(this.base, req);
  }

  listerParMedecin(medecinId: string): Observable<CongesMedecin[]> {
    return this.http.get<CongesMedecin[]>(`${this.base}/medecin/${medecinId}`);
  }

  changerStatut(id: string, statut: string): Observable<CongesMedecin> {
    return this.http.patch<CongesMedecin>(`${this.base}/${id}/statut`, { statut });
  }

  medecinsdisponibles(cliniqueId: string, date?: string): Observable<any[]> {
    let url = `${this.base}/disponibles?cliniqueId=${cliniqueId}`;
    if (date) url += `&date=${date}`;
    return this.http.get<any[]>(url);
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
