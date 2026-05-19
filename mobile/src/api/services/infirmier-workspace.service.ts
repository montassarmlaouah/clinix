import { apiPost } from '@/src/api/client';
import { INFIRMIER_WORKSPACE } from '@/src/api/endpoints';

export interface SignalementMedecinPayload {
  medecinId: string;
  patientId?: string;
  message: string;
}

export const infirmierWorkspaceService = {
  rapportFinJournee: (infirmierId: string | number, message: string) =>
    apiPost<{ status: string }>(INFIRMIER_WORKSPACE.RAPPORT_FIN_JOURNEE(infirmierId), { message }),

  signalementMedecin: (infirmierId: string | number, payload: SignalementMedecinPayload) =>
    apiPost<{ status: string }>(INFIRMIER_WORKSPACE.SIGNALEMENT_MEDECIN(infirmierId), payload),
};
