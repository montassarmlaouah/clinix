import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EquipeMedicaleLigne {
  medecinId?: string;
  nomComplet?: string;
  specialite: string;
  role: string;
}

export interface ProduitPharmacieLigne {
  libelle: string;
  quantite: number;
  note?: string;
}

export interface PerioperatoireDetails {
  equipe: EquipeMedicaleLigne[];
  produits: ProduitPharmacieLigne[];
  sallePrevue?: string;
  chambrePrevue?: string;
  remarquesMoyens?: string;
}

export interface DemandeOperation {
  id: string;
  patient: { id: string; nom: string; prenom: string; numeroPatient?: string };
  demandeur: { id: string; nom: string; prenom: string };
  clinique?: { id: string; nom: string };
  typeOperation: string;
  priorite: string;
  statut: string;
  description?: string;
  datePrevue?: string;
  dateCreation: string;
  origine?: string;
  periopsDetails?: PerioperatoireDetails | null;
}

export interface DemandeOperationRequest {
  patientId: string;
  typeOperation: string;
  priorite: string;
  description?: string;
  datePrevue?: string;
  origine?: string;
  cliniqueCibleId?: string;
  periopsDetails?: PerioperatoireDetails;
}

export interface DemandeOperationUpdateRequest extends DemandeOperationRequest {}

@Injectable({ providedIn: 'root' })
export class DemandesOperationService {
  private base = `${environment.apiUrl}/api/demandes-operation`;

  constructor(private http: HttpClient) {}

  creer(req: DemandeOperationRequest): Observable<DemandeOperation> {
    return this.http.post<DemandeOperation>(this.base, req);
  }

  modifier(id: string, req: DemandeOperationUpdateRequest): Observable<DemandeOperation> {
    return this.http.put<DemandeOperation>(`${this.base}/${id}`, req);
  }

  supprimer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  listerParClinique(cliniqueId: string): Observable<DemandeOperation[]> {
    return this.http.get<DemandeOperation[]>(`${this.base}?cliniqueId=${cliniqueId}`);
  }

  listerParDemandeur(demandeurId: string): Observable<DemandeOperation[]> {
    return this.http.get<DemandeOperation[]>(`${this.base}?demandeurId=${encodeURIComponent(demandeurId)}`);
  }

  listerParPatient(patientId: string): Observable<DemandeOperation[]> {
    return this.http.get<DemandeOperation[]>(`${this.base}?patientId=${patientId}`);
  }

  changerStatut(id: string, statut: string): Observable<DemandeOperation> {
    return this.http.patch<DemandeOperation>(`${this.base}/${id}/statut`, { statut });
  }
}
