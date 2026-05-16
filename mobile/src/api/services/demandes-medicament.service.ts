import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { DEMANDES_MEDICAMENT } from '@/src/api/endpoints';

export interface DemandeMedicamentItem {
  id: string | number;
  statut?: string;
  notes?: string;
  dateCreation?: string;
  patient?: { nom?: string; prenom?: string };
  demandeur?: { nom?: string; prenom?: string };
  items?: Array<{ quantite: number; medicament?: { nom?: string } }>;
}

export const demandesMedicamentService = {
  list: (query?: string) =>
    apiGet<DemandeMedicamentItem[]>(`${DEMANDES_MEDICAMENT.LIST}${query ? `?${query}` : ''}`),

  enAttente: (cliniqueId?: string | number | null) =>
    apiGet<DemandeMedicamentItem[]>(
      `${DEMANDES_MEDICAMENT.EN_ATTENTE}${cliniqueId ? `?cliniqueId=${cliniqueId}` : ''}`,
    ),

  byId: (id: string | number) =>
    apiGet<DemandeMedicamentItem>(DEMANDES_MEDICAMENT.BY_ID(id)),

  create: (payload: unknown) =>
    apiPost<DemandeMedicamentItem>(DEMANDES_MEDICAMENT.CREATE, payload),

  updateStatut: (id: string | number, statut: string) =>
    apiPatch<DemandeMedicamentItem>(DEMANDES_MEDICAMENT.STATUT(id), { statut }),
};
