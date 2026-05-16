import { apiGet, apiPatch } from '@/src/api/client';
import { ABSENCES, PLANNINGS, PRESENCES, SERVICES } from '@/src/api/endpoints';

export interface Planning {
  id: string | number;
  type?: string;
  dateDebut?: string;
  dateFin?: string;
  valide?: boolean;
}

export interface Absence {
  id: string | number;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  motif?: string;
  infirmier?: { nom?: string; prenom?: string };
}

export interface Presence {
  id: string | number;
  infirmier?: { nom?: string; prenom?: string };
  heureArrivee?: string;
  statut?: string;
}

export interface ServiceMedical {
  id: string | number;
  nom: string;
  actif?: boolean;
}

export const chefPersonnelService = {
  listPlannings: () => apiGet<Planning[]>(PLANNINGS.LIST),

  listAbsencesEnAttente: () => apiGet<Absence[]>(ABSENCES.EN_ATTENTE),

  approuverAbsence: (id: string | number) => apiPatch<Absence>(ABSENCES.APPROUVER(id), {}),

  refuserAbsence: (id: string | number) => apiPatch<Absence>(ABSENCES.REFUSER(id), {}),

  presencesAujourdhui: () => apiGet<Presence[]>(PRESENCES.AUJOURDHUI),

  servicesByClinique: (cliniqueId: string | number) =>
    apiGet<ServiceMedical[]>(SERVICES.BY_CLINIQUE_ACTIFS(cliniqueId)),
};
