import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import {
  ADMINISTRATIONS,
  ALERTES,
  CONSTANTES,
  HOSPITALISATIONS,
  SURVEILLANCES,
} from '@/src/api/endpoints';

export interface AdministrationTraitement {
  id: string | number;
  nomMedicament?: string;
  typeTraitement?: string;
  dosage?: string;
  voieAdministration?: string;
  heureAdministration?: string;
  administre?: boolean;
  statut?: string;
  observations?: string;
}

export interface SurveillanceInfirmiere {
  id?: string | number;
  heureObservation?: string;
  temperature?: number;
  frequenceCardiaque?: number;
  saturationOxygene?: number;
  observations?: string;
  alerteDeclenche?: boolean;
}

export interface SurveillanceInfirmiereDTO {
  patientId: string | number;
  infirmierId?: string | number;
  heureObservation: string;
  temperature?: number;
  frequenceCardiaque?: number;
  saturationOxygene?: number;
  observations?: string;
}

export interface ConstanteVitale {
  id?: string | number;
  dateMesure?: string;
  tension?: number;
  temperature?: number;
  frequenceCardiaque?: number;
  saturationOxygene?: number;
}

export interface NoteHospitalisation {
  id?: string | number;
  contenu: string;
  dateCreation?: string;
  auteurNom?: string;
}

export interface PlanSoinPayload {
  patientId: string | number;
  infirmierId: string | number;
  heureAdministration: string;
  typeTraitement: string;
  nomMedicament: string;
  dosage: string;
  voieAdministration: string;
  observations?: string;
}

export const infirmierSoinsService = {
  traitementsAVenir: (patientId: string | number) =>
    apiGet<AdministrationTraitement[]>(ADMINISTRATIONS.BY_PATIENT_A_VENIR(patientId)),

  marquerAdministre: (id: string | number, observations = 'Administré via mobile') =>
    apiPatch<AdministrationTraitement>(ADMINISTRATIONS.ADMINISTRER(id), { observations }),

  planifierSoin: (payload: PlanSoinPayload) =>
    apiPost<AdministrationTraitement>(ADMINISTRATIONS.CREATE, payload),

  historiqueSurveillances: (patientId: string | number) =>
    apiGet<SurveillanceInfirmiere[]>(SURVEILLANCES.BY_PATIENT(patientId)),

  alertesSurveillances: (patientId: string | number) =>
    apiGet<SurveillanceInfirmiere[]>(SURVEILLANCES.BY_PATIENT_ALERTES(patientId)),

  enregistrerSurveillance: (dto: SurveillanceInfirmiereDTO) =>
    apiPost<SurveillanceInfirmiere>(SURVEILLANCES.CREATE, dto),

  enregistrerConstantes: (payload: {
    patientId: string | number;
    infirmierId: string | number;
    tension?: number;
    temperature?: number;
    frequenceCardiaque?: number;
    saturationOxygene?: number;
  }) => apiPost<ConstanteVitale>(CONSTANTES.CREATE, payload),

  historiqueConstantes: (
    patientId: string | number,
    debutIso: string,
    finIso: string,
  ) =>
    apiGet<ConstanteVitale[]>(
      `${CONSTANTES.HISTORIQUE(patientId)}?debut=${encodeURIComponent(debutIso)}&fin=${encodeURIComponent(finIso)}`,
    ),

  hospitalisationsPatient: (patientId: string | number) =>
    apiGet<{ id: string | number; statut?: string }[]>(HOSPITALISATIONS.BY_PATIENT(patientId)),

  notesHospitalisation: (hospitalisationId: string | number) =>
    apiGet<NoteHospitalisation[]>(HOSPITALISATIONS.NOTES(hospitalisationId)),

  ajouterNoteHospitalisation: (
    hospitalisationId: string | number,
    payload: { contenu: string; auteurId: string; auteurNom: string; auteurRole: string },
  ) => apiPost<NoteHospitalisation>(HOSPITALISATIONS.CREATE_NOTE(hospitalisationId), payload),

  signalerUrgence: (payload: { patientId: string | number; localisation: string; message: string }) =>
    apiPost<{ message: string }>(ALERTES.URGENCE, payload),

  signalerManqueMateriel: (payload: { equipementNom: string; quantite: string; message: string }) =>
    apiPost<{ message: string }>(ALERTES.MATERIEL, payload),
};
