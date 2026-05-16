import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { DEMANDES_OPERATION } from '@/src/api/endpoints';

export interface DemandeOperation {
  id: string | number;
  patientId?: string | number;
  patient?: { nom?: string; prenom?: string };
  typeOperation?: string;
  description?: string;
  datePrevue?: string;
  statut?: string;
  priorite?: string;
  demandeurId?: string | number;
}

export interface CreateDemandeOperationPayload {
  patientId: string | number;
  typeOperation: string;
  priorite?: string;
  description?: string;
  datePrevue?: string;
  origine?: 'CLINIQUE' | 'CABINET';
  cliniqueCibleId?: string | number;
}

export const demandesOperationService = {
  list: (query?: string) =>
    apiGet<DemandeOperation[]>(`${DEMANDES_OPERATION.LIST}${query ? `?${query}` : ''}`),

  byId: (id: string | number) => apiGet<DemandeOperation>(DEMANDES_OPERATION.BY_ID(id)),

  create: (payload: CreateDemandeOperationPayload) =>
    apiPost<DemandeOperation>(DEMANDES_OPERATION.CREATE, payload),

  updateStatut: (id: string | number, statut: string) =>
    apiPatch<DemandeOperation>(DEMANDES_OPERATION.STATUT(id), { statut }),
};
