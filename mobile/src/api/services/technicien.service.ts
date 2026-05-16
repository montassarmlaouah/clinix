import { apiGet, apiPost } from '@/src/api/client';
import { TECHNICIEN_MAINTENANCE } from '@/src/api/endpoints';

export interface Equipement {
  id: string | number;
  nom: string;
  code?: string;
  categorie?: string;
  statut?: string;
  etatTechnique?: string;
  chambre?: { numero?: string };
  descriptionPanne?: string;
}

export interface TraiterPannePayload {
  repairType: string;
  repairNotes: string;
  repairHours: number;
  repairMinutes: number;
}

export const technicienService = {
  listEquipements: () => apiGet<Equipement[]>(TECHNICIEN_MAINTENANCE.EQUIPEMENTS),

  listEnPanne: () => apiGet<Equipement[]>(TECHNICIEN_MAINTENANCE.EQUIPEMENTS_EN_PANNE),

  getEquipement: (id: string | number) =>
    apiGet<Equipement>(TECHNICIEN_MAINTENANCE.EQUIPEMENT_BY_ID(id)),

  traiterPanne: (equipementId: string | number, payload: TraiterPannePayload) =>
    apiPost<Equipement>(TECHNICIEN_MAINTENANCE.TRAITER_PANNE(equipementId), payload),
};
