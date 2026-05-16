import { apiGet } from '@/src/api/client';
import { DOSSIERS, ORDONNANCES, RDV } from '@/src/api/endpoints';
import type { RendezVous } from '@/src/api/services/rdv.service';

export interface DossierMedical {
  id?: string;
  groupeSanguin?: string;
  allergies?: string[];
  antecedents?: string[];
  maladiesChroniques?: string[];
  analyses?: AnalyseLaboratoire[];
  consultations?: unknown[];
}

export interface AnalyseLaboratoire {
  id?: string;
  typeAnalyse?: string;
  resultat?: string;
  dateAnalyse?: string;
  statut?: string;
}

export interface Ordonnance {
  id: string;
  dateCreation?: string;
  statut?: string;
  medecin?: { nom?: string; prenom?: string };
  medicaments?: Array<{ nom?: string; posologie?: string }>;
}

export const patientPortalService = {
  getDossier: (patientId: string | number) =>
    apiGet<DossierMedical>(DOSSIERS.BY_PATIENT(patientId)),

  getOrdonnances: (patientId: string | number) =>
    apiGet<Ordonnance[]>(ORDONNANCES.BY_PATIENT(patientId)),

  getRendezVous: (patientId: string | number) =>
    apiGet<RendezVous[]>(RDV.BY_PATIENT(patientId)),
};
