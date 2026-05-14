import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Service, ServiceDTO } from '../model/service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ServiceMedicalService {
  private baseUrl = `${environment.apiUrl}/api/services`;

  constructor(private http: HttpClient) { }

  // Créer un service
  creerService(serviceDTO: ServiceDTO): Observable<Service> {
    return this.http.post<Service>(this.baseUrl, serviceDTO);
  }

  // Obtenir tous les services
  obtenirTousLesServices(): Observable<Service[]> {
    return this.http.get<Service[]>(this.baseUrl);
  }

  // Alias pour compatibilité
  lister(): Observable<Service[]> {
    return this.obtenirTousLesServices();
  }

  // Obtenir un service par ID
  obtenirServiceParId(id: string): Observable<Service> {
    return this.http.get<Service>(`${this.baseUrl}/${id}`);
  }

  // Obtenir les services d'une clinique
  obtenirServicesParClinique(cliniqueId: string): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.baseUrl}/clinique/${cliniqueId}`);
  }

  // Alias pour getServicesByClinique
  getServicesByClinique(cliniqueId: string): Observable<Service[]> {
    return this.obtenirServicesParClinique(cliniqueId);
  }

  // Obtenir les services actifs d'une clinique
  obtenirServicesActifsParClinique(cliniqueId: string): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.baseUrl}/clinique/${cliniqueId}/actifs`);
  }

  // Mettre à jour un service
  mettreAJourService(id: string, serviceDTO: ServiceDTO): Observable<Service> {
    return this.http.put<Service>(`${this.baseUrl}/${id}`, serviceDTO);
  }

  // Désactiver un service
  desactiverService(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
