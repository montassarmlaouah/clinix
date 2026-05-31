import { apiDelete, apiDownloadFile, apiGet, apiPatch, apiPost } from '@/src/api/client';
import { GARDES, PLANNINGS } from '@/src/api/endpoints';

export interface PlanningRecord {
  id: string;
  type?: string;
  date?: string;
  dateDebut?: string;
  dateFin?: string;
  valide?: boolean;
  utilisateurs?: Array<{ id: string; nom?: string; prenom?: string; telephone?: string }>;
}

export interface GardeRecord {
  id: string;
  debut?: string;
  fin?: string;
  type?: string;
  utilisateur?: { id?: string; nom?: string; prenom?: string; telephone?: string };
  service?: { id?: string; nom?: string };
}

export const planningService = {
  listAll: () => apiGet<PlanningRecord[]>(PLANNINGS.LIST),

  listByUtilisateur: (utilisateurId: string | number) =>
    apiGet<PlanningRecord[]>(PLANNINGS.BY_UTILISATEUR(utilisateurId)),

  listByPeriode: (debut: string, fin: string) =>
    apiGet<PlanningRecord[]>(PLANNINGS.BY_PERIODE(debut, fin)),

  getById: (id: string | number) => apiGet<PlanningRecord>(PLANNINGS.BY_ID(id)),

  createHebdo: (payload: { dateDebut: string; utilisateurIds: string[]; createurId: string }) =>
    apiPost<PlanningRecord>(PLANNINGS.CREATE_HEBDO, payload),

  createMensuel: (payload: { dateDebut: string; utilisateurIds: string[]; createurId: string }) =>
    apiPost<PlanningRecord>(PLANNINGS.CREATE_MENSUEL, payload),

  valider: (id: string | number) => apiPatch<PlanningRecord>(PLANNINGS.VALIDER(id), {}),

  invalider: (id: string | number) => apiPatch<PlanningRecord>(PLANNINGS.INVALIDER(id), {}),

  delete: (id: string | number) => apiDelete<void>(PLANNINGS.DELETE(id)),

  gardesByPlanning: (planningId: string | number) =>
    apiGet<GardeRecord[]>(GARDES.BY_PLANNING(planningId)),

  gardesByUtilisateur: (utilisateurId: string | number) =>
    apiGet<GardeRecord[]>(GARDES.BY_UTILISATEUR(utilisateurId)),

  creerShiftJour: (payload: {
    utilisateurId: string;
    date: string;
    matin: boolean;
    planningId?: string;
    serviceId?: string;
  }) => apiPost<GardeRecord>(GARDES.SHIFT_JOUR, payload),

  creerGardeNuit: (payload: {
    utilisateurId: string;
    dateDebut: string;
    planningId?: string;
    serviceId?: string;
  }) => apiPost<GardeRecord>(GARDES.GARDE_NUIT, payload),

  async downloadPlanningPdf(
    planningId: string | number,
    fileName: string,
    params?: { serviceId?: string; utilisateurId?: string },
  ): Promise<string> {
    return apiDownloadFile(PLANNINGS.PDF(planningId, params), fileName);
  },

  async downloadUtilisateurWeekPdf(
    utilisateurId: string | number,
    debut: string,
    fin: string,
    fileName: string,
  ): Promise<string> {
    return apiDownloadFile(GARDES.PDF_UTILISATEUR(utilisateurId, debut, fin), fileName);
  },
};
