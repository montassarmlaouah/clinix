import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TypePrestation =
  | 'HOSPITALISATION'
  | 'SOINS_INFIRMIERS'
  | 'LABORATOIRE'
  | 'RADIOLOGIE'
  | 'MATERIEL_MEDICAL';

export type StatutFacturePatient = 'BROUILLON' | 'EMISE' | 'PAYEE' | 'TELETRANSMIS';

export interface PrestationFacturation {
  id: string;
  cliniqueId: string;
  type: TypePrestation;
  code: string;
  libelle: string;
  tarifUnitaire: number;
  tauxRemboursementPct: number;
  actif: boolean;
}

export interface LigneFacturePatient {
  id: string;
  typePrestation: TypePrestation;
  codeActe: string;
  libelle: string;
  quantite: number;
  prixUnitaire: number;
  montantLigne: number;
  tauxRemboursementPct: number;
}

export interface FacturePatient {
  id: string;
  numeroFacture: string;
  patient: { id: string; nom: string; prenom: string; numeroPatient?: string; telephone?: string };
  clinique: { id: string; nom: string; adresse?: string; telephone?: string };
  hospitalisation?: { id: string };
  dateFacture: string;
  dateSortie?: string;
  nombreJours: number;
  montantTotal: number;
  montantRemboursable: number;
  ticketModerateur: number;
  montantPaye: number;
  statut: StatutFacturePatient;
  referenceTeletransmission?: string;
  lignes: LigneFacturePatient[];
}

export interface LignePrestationRequest {
  type: TypePrestation;
  quantite?: number;
}

export interface GenererFactureRequest {
  hospitalisationId: string;
  prestationsSupplementaires?: LignePrestationRequest[];
}

export interface TeletransmissionResult {
  statut: string;
  reference: string;
  message: string;
  montantPrisEnCharge: number;
  dateTransmission: string;
}

@Injectable({ providedIn: 'root' })
export class FacturationPatientService {
  private base = `${environment.apiUrl}/api/facturation-patient`;

  constructor(private http: HttpClient) {}

  prestations(cliniqueId: string): Observable<PrestationFacturation[]> {
    return this.http.get<PrestationFacturation[]>(`${this.base}/prestations/clinique/${cliniqueId}`);
  }

  parClinique(cliniqueId: string): Observable<FacturePatient[]> {
    return this.http.get<FacturePatient[]>(`${this.base}/clinique/${cliniqueId}`);
  }

  detail(id: string): Observable<FacturePatient> {
    return this.http.get<FacturePatient>(`${this.base}/${id}`);
  }

  generer(body: GenererFactureRequest): Observable<FacturePatient> {
    return this.http.post<FacturePatient>(`${this.base}/generer`, body);
  }

  emettre(id: string): Observable<FacturePatient> {
    return this.http.post<FacturePatient>(`${this.base}/${id}/emettre`, {});
  }

  validerPaiement(id: string, montantPaye?: number, modePaiement?: string): Observable<FacturePatient> {
    return this.http.post<FacturePatient>(`${this.base}/${id}/valider-paiement`, { montantPaye, modePaiement });
  }

  teletransmettre(id: string): Observable<TeletransmissionResult> {
    return this.http.post<TeletransmissionResult>(`${this.base}/${id}/teletransmettre`, {});
  }

  pdfUrl(id: string): string {
    return `${this.base}/${id}/pdf`;
  }

  telechargerPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/pdf`, { responseType: 'blob' });
  }
}
