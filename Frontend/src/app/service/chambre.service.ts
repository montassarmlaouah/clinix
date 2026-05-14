import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chambre, ChambreDTO } from '../model/chambre';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChambreService {
  private apiUrl = `${environment.apiUrl}/api/chambres`;

  constructor(private http: HttpClient) { }

  lister(): Observable<Chambre[]> {
    return this.http.get<Chambre[]>(this.apiUrl);
  }

  listerParClinique(cliniqueId: string): Observable<Chambre[]> {
    return this.http.get<Chambre[]>(`${this.apiUrl}/clinique/${cliniqueId}`);
  }

  listerParService(serviceId: string): Observable<Chambre[]> {
    return this.http.get<Chambre[]>(`${this.apiUrl}/service/${serviceId}`);
  }

  obtenirParId(id: string): Observable<Chambre> {
    return this.http.get<Chambre>(`${this.apiUrl}/${id}`);
  }

  creer(chambre: ChambreDTO): Observable<Chambre> {
    return this.http.post<Chambre>(this.apiUrl, chambre);
  }

  modifier(id: string, chambre: ChambreDTO): Observable<Chambre> {
    return this.http.put<Chambre>(`${this.apiUrl}/${id}`, chambre);
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  verifierNumeroExiste(numero: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/existe/${numero}`);
  }

  obtenirStatistiques(): Observable<{
    total: number;
    disponibles: number;
    occupees: number;
    parType: { [key: string]: number };
  }> {
    return this.http.get<{
      total: number;
      disponibles: number;
      occupees: number;
      parType: { [key: string]: number };
    }>(`${this.apiUrl}/statistiques`);
  }

  creerPlusieurs(data: {
    serviceId: string;
    type: string;
    capacite: number;
    nombreLits: number;
    disponible?: boolean;
    nombreChambres: number;
    prefixeNumero?: string;
    numeroDebut?: number;
    equipements?: string[];
    materielIds?: string[];
  }): Observable<{ message: string; chambres: Chambre[]; nombreCree: number }> {
    return this.http.post<{ message: string; chambres: Chambre[]; nombreCree: number }>(
      `${this.apiUrl}/multiple`,
      data
    );
  }
}
