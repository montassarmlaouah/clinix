import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdministrationTraitement } from '../model/administration-traitement';
import { SurveillanceInfirmiere, SurveillanceInfirmiereDTO } from '../model/surveillance-infirmiere';
import { ConstanteVitale } from '../model/constante-vitale';

@Injectable({
  providedIn: 'root'
})
export class InfirmierSoinsService {
  private administrationsUrl = `${environment.apiUrl}/api/administrations`;
  private surveillancesUrl = `${environment.apiUrl}/api/surveillances`;
  private constantesUrl = `${environment.apiUrl}/api/constantes-vitales`;
  private alertesUrl = `${environment.apiUrl}/api/alertes`;

  constructor(private http: HttpClient) {}

  obtenirTraitementsAVenir(patientId: string): Observable<AdministrationTraitement[]> {
    return this.http.get<AdministrationTraitement[]>(`${this.administrationsUrl}/patient/${patientId}/a-venir`);
  }

  marquerTraitementAdministre(id: string, observations: string): Observable<AdministrationTraitement> {
    return this.http.patch<AdministrationTraitement>(`${this.administrationsUrl}/${id}/administrer`, { observations });
  }

  planifierSoin(payload: {
    patientId: string;
    infirmierId: string;
    heureAdministration: string;
    typeTraitement: string;
    nomMedicament: string;
    dosage: string;
    voieAdministration: string;
    observations?: string;
  }): Observable<AdministrationTraitement> {
    return this.http.post<AdministrationTraitement>(this.administrationsUrl, payload);
  }

  enregistrerSurveillance(dto: SurveillanceInfirmiereDTO): Observable<SurveillanceInfirmiere> {
    return this.http.post<SurveillanceInfirmiere>(this.surveillancesUrl, dto);
  }

  obtenirHistoriqueSurveillances(patientId: string): Observable<SurveillanceInfirmiere[]> {
    return this.http.get<SurveillanceInfirmiere[]>(`${this.surveillancesUrl}/patient/${patientId}`);
  }

  obtenirAlertesSurveillances(patientId: string): Observable<SurveillanceInfirmiere[]> {
    return this.http.get<SurveillanceInfirmiere[]>(`${this.surveillancesUrl}/patient/${patientId}/alertes`);
  }

  enregistrerConstantes(payload: {
    patientId: string;
    infirmierId: string;
    tension?: number;
    temperature?: number;
    frequenceCardiaque?: number;
    saturationOxygene?: number;
  }): Observable<ConstanteVitale> {
    return this.http.post<ConstanteVitale>(this.constantesUrl, payload);
  }

  historiqueConstantes(patientId: string, debutIso: string, finIso: string): Observable<ConstanteVitale[]> {
    const params = new HttpParams().set('debut', debutIso).set('fin', finIso);
    return this.http.get<ConstanteVitale[]>(`${this.constantesUrl}/patient/${patientId}/historique`, { params });
  }

  signalerUrgence(payload: { patientId: string; localisation: string; message: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.alertesUrl}/urgence`, payload);
  }

  signalerManqueMateriel(payload: { equipementNom: string; quantite: string; message: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.alertesUrl}/manque-materiel`, payload);
  }
}
