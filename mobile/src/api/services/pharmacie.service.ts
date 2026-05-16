import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from '@/src/api/client';
import { DEMANDES_MEDICAMENT, MEDICAMENTS, STOCKS } from '@/src/api/endpoints';

export interface Medicament {
  id: string;
  nom: string;
  description?: string;
}

export interface Stock {
  id: string;
  quantite: number;
  lot: string;
  seuilAlerte: number;
  dateExpiration?: string;
  medicament?: Medicament;
}

export interface DemandeMedicament {
  id: string;
  statut: string;
  notes?: string;
  dateCreation?: string;
  patient?: { nom?: string; prenom?: string; numeroPatient?: string };
  demandeur?: { nom?: string; prenom?: string };
  items?: Array<{
    quantite: number;
    instructions?: string;
    medicament?: { nom?: string };
  }>;
}

function cliniqueQuery(cliniqueId?: string | number | null): string {
  return cliniqueId ? `?cliniqueId=${cliniqueId}` : '';
}

export const pharmacieService = {
  listMedicaments: () => apiGet<Medicament[]>(MEDICAMENTS.LIST),

  createMedicament: (payload: { nom: string; description?: string | null }) =>
    apiPost<Medicament>(MEDICAMENTS.CREATE, payload),

  updateMedicament: (id: string, payload: { nom: string; description?: string | null }) =>
    apiPut<Medicament>(MEDICAMENTS.UPDATE(id), payload),

  deleteMedicament: (id: string) => apiDelete<void>(MEDICAMENTS.DELETE(id)),

  listStocks: (cliniqueId?: string | number | null) =>
    apiGet<Stock[]>(`${STOCKS.LIST}${cliniqueQuery(cliniqueId)}`),

  listStocksBas: (cliniqueId?: string | number | null) =>
    apiGet<Stock[]>(`${STOCKS.BAS}${cliniqueQuery(cliniqueId)}`),

  listDemandesEnAttente: (cliniqueId?: string | number | null) =>
    apiGet<DemandeMedicament[]>(
      `${DEMANDES_MEDICAMENT.EN_ATTENTE}${cliniqueQuery(cliniqueId)}`,
    ),

  changerStatutDemande: (
    id: string,
    statut: 'DELIVREE' | 'PARTIELLE' | 'REFUSEE',
  ) => apiPatch<DemandeMedicament>(DEMANDES_MEDICAMENT.STATUT(id), { statut }),
};
