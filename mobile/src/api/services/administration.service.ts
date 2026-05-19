import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { ADMINISTRATIONS } from '@/src/api/endpoints';

export interface AdministrationTraitement {
  id: string | number;
  patient?: { id?: string | number; nom?: string; prenom?: string };
  infirmier?: { id?: string | number; nom?: string; prenom?: string };
  nomMedicament?: string;
  typeTraitement?: string;
  dosage?: string;
  voieAdministration?: string;
  heureAdministration?: string;
  administre?: boolean;
  statutExecution?: string;
  prioriteUrgente?: boolean;
  remarquesInfirmier?: string;
  pieceJointeUrl?: string;
  statut?: string;
  validationMedecin?: boolean | null;
}

export interface CreateAdministrationPayload {
  patientId: string | number;
  infirmierId: string | number;
  medecinDemandeurId: string | number;
  typeTraitement: string;
  nomMedicament: string;
  dosage: string;
  voieAdministration: string;
  administre: boolean;
  heureAdministration: string;
}

export const administrationService = {
  byInfirmier: (infirmierId: string | number) =>
    apiGet<AdministrationTraitement[]>(ADMINISTRATIONS.BY_INFIRMIER(infirmierId)),

  create: (payload: CreateAdministrationPayload) =>
    apiPost<AdministrationTraitement>(ADMINISTRATIONS.CREATE, payload),

  patchStatutExecution: (
    id: string | number,
    payload: { statut: string; remarques?: string },
  ) => apiPatch<AdministrationTraitement>(ADMINISTRATIONS.STATUT_EXECUTION(id), payload),

  toggleUrgent: (id: string | number, urgent: boolean) =>
    apiPatch<AdministrationTraitement>(ADMINISTRATIONS.PRIORITE_URGENTE(id), { urgent }),

  pieceJointe: (id: string | number, url: string) =>
    apiPatch<AdministrationTraitement>(ADMINISTRATIONS.PIECE_JOINTE(id), { url }),

  validationMedecin: (id: string | number, valide: boolean, commentaire = '') =>
    apiPatch<AdministrationTraitement>(ADMINISTRATIONS.VALIDATION_MEDECIN(id), { valide, commentaire }),
};
