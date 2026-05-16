import { apiGet, apiPatch, apiPost } from '@/src/api/client';
import { ALERTES, INFIRMIER_WORKSPACE, SURVEILLANCES } from '@/src/api/endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TypeAlerteMedicale = 'RESULTAT_CRITIQUE' | 'CONSTANTE_ANORMALE' | 'MESSAGE_URGENT';

export interface AlerteMedicaleResponse {
  id: string;
  medecinId: string;
  patientId: string | null;
  patientNom: string;
  type: TypeAlerteMedicale;
  message: string;
  lue: boolean;
  dateCreation: string;
}

export interface AlerteInfirmierResponse {
  id: string;
  motif: string;
  description: string | null;
  niveau: 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
  statut: string;
  dateSignalement: string;
  patientId?: string;
  patientNom?: string;
  signaleParId?: string;
  signaleParNom?: string;
}

export interface AlerteMedicaleRequest {
  medecinId: string;
  patientId?: string;
  type: TypeAlerteMedicale;
  message: string;
}

export interface SignalementMedecinRequest {
  patientId: string;
  motif: string;
  description?: string;
  niveau: 'FAIBLE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';
}

// ── Service ───────────────────────────────────────────────────────────────────
// ⚠️  AlerteController ne possède que POST /urgence et POST /manque-materiel.
//     Les "alertes médicales" n'existent pas comme endpoint dédié dans le backend.
//     → Signalements infirmier : InfirmierWorkspaceController
//     → Alertes patient       : SurveillanceInfirmiereController

export const alerteMedicaleService = {
  /** Envoie une alerte urgence (AlerteController — route réelle) */
  sendUrgence: (data: { message: string }) =>
    apiPost<void>(ALERTES.URGENCE, data),

  /** Envoie une alerte manque matériel (AlerteController — route réelle) */
  sendManqueMateriel: (data: { description: string }) =>
    apiPost<void>(ALERTES.MATERIEL, data),

  /** Alertes du patient (surveillance) — SurveillanceInfirmiereController */
  getAlertesPatient: (patientId: string) =>
    apiGet<AlerteInfirmierResponse[]>(SURVEILLANCES.BY_PATIENT_ALERTES(patientId)),

  /** Toutes les alertes de surveillance — SurveillanceInfirmiereController */
  getAllAlertesSurveillance: () =>
    apiGet<AlerteInfirmierResponse[]>(SURVEILLANCES.ALERTES_TOUTES),

  /** Signalement infirmier → médecin via InfirmierWorkspaceController */
  signalerMedecin: (infirmierId: string, data: SignalementMedecinRequest) =>
    apiPost<void>(INFIRMIER_WORKSPACE.SIGNALEMENT_MEDECIN(infirmierId), data),

  // ── Stubs pour compatibilité ascendante (routes inexistantes en backend) ──
  /** @deprecated Route non existante — utiliser getAlertesPatient ou getAllAlertesSurveillance */
  getByMedecin: (_medecinId: string, _orgId?: string | number) =>
    Promise.resolve([] as AlerteMedicaleResponse[]),

  /** @deprecated Route non existante — utiliser signalerMedecin */
  create: (_req: AlerteMedicaleRequest) =>
    Promise.reject(new Error('Endpoint /alertes/medicales inexistant — utiliser INFIRMIER_WORKSPACE.SIGNALEMENT_MEDECIN')),

  /** @deprecated Route non existante */
  marquerLue: (_id: string) =>
    Promise.reject(new Error('Endpoint /alertes/medicales/:id/lue inexistant')),

  /** @deprecated Route non existante */
  getAlertesInfirmier: (_medecinId: string, _orgId?: string | number) =>
    Promise.resolve([] as AlerteInfirmierResponse[]),
};
