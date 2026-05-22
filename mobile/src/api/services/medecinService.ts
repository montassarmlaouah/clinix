import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/src/api/client';
import {
  CONSULTATIONS,
  IMAGERIES,
  MEDECINS,
  MEDECIN_WORKSPACE,
  ORDONNANCES,
} from '@/src/api/endpoints';
import type {
  CabinetMedecinCreationResponse,
  CabinetMedecinListItem,
  CreerCabinetMedecinDTO,
  VerifierCinCabinetResult,
} from '@/src/types/cabinet-medecin';

// ── Types — STRICTEMENT alignés avec le backend ───────────────────────────────

export interface Medecin {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  telephone: string;
  email?: string;
  numeroOrdre?: string;
}

export interface DemandeImageriePayload {
  patientId: string;
  medecinId: string;
  type: string;
  motif: string;
  indicationsCliniques?: string;
  questionsMedecin?: string;
  piecesJointes?: string;
  niveauUrgence?: string;
}

export interface ConsultationPayload {
  patientId: string;
  medecinId: string;
  motif: string;
  diagnostic?: string;
  observations?: string;
}

export interface DiagnosticPayload {
  diagnostic: string;
  observations?: string;
}

// ── Médecin service ───────────────────────────────────────────────────────────

export const medecinService = {
  getAll: () =>
    apiGet<Medecin[]>(MEDECINS.LIST),

  getByClinique: (cliniqueId: string | number) =>
    apiGet<Medecin[]>(MEDECINS.BY_CLINIQUE(cliniqueId)),

  getBySpecialite: (specialite: string) =>
    apiGet<Medecin[]>(MEDECINS.BY_SPECIALITE(specialite)),

  getById: (id: string | number) =>
    apiGet<Medecin>(MEDECINS.BY_ID(id)),

  getWorkspaceStats: (medecinId: string | number) =>
    apiGet<Record<string, unknown>>(MEDECIN_WORKSPACE.STATISTIQUES(medecinId)),

  getWorkspaceInfirmiers: (medecinId: string | number) =>
    apiGet<unknown[]>(MEDECIN_WORKSPACE.INFIRMIERS(medecinId)),

  getWorkspaceSoinsSuivi: (medecinId: string | number) =>
    apiGet<unknown[]>(MEDECIN_WORKSPACE.SOINS_SUIVI(medecinId)),

  getPatientsCabinet: (medecinId: string | number) =>
    apiGet<unknown[]>(MEDECINS.PATIENTS_LIST(medecinId)),

  addPatientCabinet: (medecinId: string | number, patientDTO: unknown) =>
    apiPost<unknown>(MEDECINS.PATIENTS_ADD(medecinId), patientDTO),

  /** Super admin — cabinets médecins */
  listCabinets: () => apiGet<CabinetMedecinListItem[]>(MEDECINS.CABINETS),

  verifierCinCabinet: (cin: string, telephone?: string) =>
    apiGet<VerifierCinCabinetResult>(MEDECINS.CABINETS_VERIFIER_CIN(cin, telephone)),

  creerCabinet: (dto: CreerCabinetMedecinDTO) =>
    apiPost<CabinetMedecinCreationResponse>(MEDECINS.CABINETS, dto),

  mettreAJourCabinet: (id: string, dto: CreerCabinetMedecinDTO) =>
    apiPut<Medecin>(MEDECINS.CABINET_BY_ID(id), dto),

  supprimerCabinet: (id: string) => apiDelete<void>(MEDECINS.CABINET_BY_ID(id)),
};

// ── Consultations ─────────────────────────────────────────────────────────────

export const consultationService = {
  create: (data: ConsultationPayload) =>
    apiPost<unknown>(CONSULTATIONS.CREATE, data),

  getByPatient: (patientId: string | number) =>
    apiGet<unknown[]>(CONSULTATIONS.BY_PATIENT(patientId)),

  getByMedecin: (medecinId: string | number) =>
    apiGet<unknown[]>(CONSULTATIONS.BY_MEDECIN(medecinId)),

  addDiagnostic: (consultationId: string | number, data: DiagnosticPayload) =>
    apiPatch<unknown>(CONSULTATIONS.DIAGNOSTIC(consultationId), data),
};

// ── Imageries / Examens ───────────────────────────────────────────────────────

export const imagerieService = {
  demander: (data: DemandeImageriePayload) =>
    apiPost<unknown>(IMAGERIES.DEMANDER, data),

  getEnAttente: () =>
    apiGet<unknown[]>(IMAGERIES.EN_ATTENTE),

  getByMedecin: (medecinId: string | number) =>
    apiGet<unknown[]>(IMAGERIES.BY_MEDECIN(medecinId)),

  getByPatient: (patientId: string | number) =>
    apiGet<unknown[]>(IMAGERIES.BY_PATIENT(patientId)),

  getById: (id: string | number) =>
    apiGet<unknown>(IMAGERIES.BY_ID(id)),
};

// ── Ordonnances ───────────────────────────────────────────────────────────────

export const ordonnanceService = {
  create: (data: unknown) =>
    apiPost<unknown>(ORDONNANCES.CREATE, data),

  getById: (id: string | number) =>
    apiGet<unknown>(ORDONNANCES.BY_ID(id)),

  list: (params?: { medecinId?: string; patientId?: string; nonValideesOnly?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.medecinId) search.append('medecinId', params.medecinId);
    if (params?.patientId) search.append('patientId', params.patientId);
    if (params?.nonValideesOnly) search.append('nonValideesOnly', 'true');
    const qs = search.toString();
    return apiGet<unknown[]>(`${ORDONNANCES.LIST}${qs ? `?${qs}` : ''}`);
  },

  addMedicament: (id: string | number, ligneMedicament: unknown) =>
    apiPost<unknown>(ORDONNANCES.ADD_MEDICAMENT(id), ligneMedicament),

  signer: (id: string | number) =>
    apiPatch<unknown>(ORDONNANCES.SIGNER(id), {}),

  valider: (id: string | number, pharmacienId: string) =>
    apiPatch<unknown>(`${ORDONNANCES.VALIDER(id)}?pharmacienId=${pharmacienId}`, {}),

  delete: (id: string | number) =>
    apiDelete<void>(ORDONNANCES.DELETE(id)),
};
