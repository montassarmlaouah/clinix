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

  // ── Stubs supprimés — les routes n'existent pas côté backend ────────────────

  /**
   * @deprecated Route /alertes/medicales/medecin/:id inexistante.
   * Utiliser `getAllAlertesSurveillance()` ou `getAlertesPatient(patientId)`.
   */
  getByMedecin: (_medecinId: string, _orgId?: string | number): Promise<AlerteMedicaleResponse[]> => {
    return Promise.reject(
      new Error('[alerteMedicaleService.getByMedecin] Route inexistante. Utiliser getAlertesPatient() ou getAllAlertesSurveillance().'),
    );
  },

  /**
   * @deprecated Route /alertes/medicales inexistante.
   * Utiliser `signalerMedecin()` via INFIRMIER_WORKSPACE.SIGNALEMENT_MEDECIN.
   */
  create: (_req: AlerteMedicaleRequest): Promise<void> => {
    return Promise.reject(
      new Error('[alerteMedicaleService.create] Route /alertes/medicales inexistante. Utiliser signalerMedecin().'),
    );
  },

  /**
   * @deprecated Route /alertes/medicales/:id/lue inexistante.
   */
  marquerLue: (_id: string): Promise<void> => {
    return Promise.reject(
      new Error('[alerteMedicaleService.marquerLue] Route inexistante.'),
    );
  },

  /**
   * @deprecated Utiliser `getAllAlertesSurveillance()` ou `getAlertesPatient()`.
   */
  getAlertesInfirmier: (_medecinId: string, _orgId?: string | number): Promise<AlerteInfirmierResponse[]> => {
    return Promise.reject(
      new Error('[alerteMedicaleService.getAlertesInfirmier] Route inexistante. Utiliser getAlertesPatient() ou getAllAlertesSurveillance().'),
    );
  },
};
