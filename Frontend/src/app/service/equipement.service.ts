import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CategorieEquipement,
  Equipement,
  EquipementDTO,
  EtatTechnique,
StatutEquipement
} from '../model/materiel-medical';

@Injectable({
  providedIn: 'root'
})
export class EquipementService {
obtenirNomStatut(arg0: StatutEquipement) {
throw new Error('Method not implemented.');
}
  private readonly baseUrl = 'http://localhost:8080/api/equipements';

  constructor(private http: HttpClient) {}

  obtenirTousLesEquipements(): Observable<Equipement[]> {
    return this.http.get<Equipement[]>(this.baseUrl);
  }

  obtenirEquipementsParClinique(cliniqueId: string): Observable<Equipement[]> {
    return this.http.get<Equipement[]>(`${this.baseUrl}/clinique/${cliniqueId}`);
  }

  creerEquipement(dto: EquipementDTO): Observable<Equipement> {
    return this.http.post<Equipement>(this.baseUrl, dto);
  }

  mettreAJourEquipement(id: string, dto: EquipementDTO): Observable<Equipement> {
    return this.http.put<Equipement>(`${this.baseUrl}/${id}`, dto);
  }

  supprimerEquipement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  traiterPanne(
    id: string,
    payload: { repairType: string; repairNotes: string; repairHours: number; repairMinutes: number }
  ): Observable<Equipement> {
    return this.http.post<Equipement>(`${this.baseUrl}/${id}/traiter-panne`, payload);
  }

  obtenirNomCategorie(categorie: CategorieEquipement): string {
    const labels: Record<CategorieEquipement, string> = {
      [CategorieEquipement.LITS_MOBILIER]: 'Lits & Mobilier',
      [CategorieEquipement.DIAGNOSTIC]: 'Diagnostic'
    };
    return labels[categorie] || categorie;
  }

  obtenirNomEtatTechnique(etat: EtatTechnique): string {
    const labels: Record<EtatTechnique, string> = {
      [EtatTechnique.FONCTIONNEL]: 'Fonctionnel',
      [EtatTechnique.EN_PANNE]: 'En panne',
      [EtatTechnique.EN_MAINTENANCE]: 'En maintenance',
      [EtatTechnique.HORS_SERVICE]: 'Hors service'
    };
    return labels[etat] || etat;
  }
}
