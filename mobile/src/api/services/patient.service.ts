import { apiGet, apiPost, apiPut } from '@/src/api/client';
import { PATIENTS } from '@/src/api/endpoints';

// ── Types — STRICTEMENT alignés avec backend Patient / PatientDTO ─────────────
export interface Patient {
  id:             string;
  nom:            string;
  prenom:         string;
  telephone:      string;
  email?:         string;
  dateNaissance?: string;
  adresse?:       string;
  cliniqueId?:    string;
  sexe?:          string;
  groupeSanguin?: string;
  typeAdmission?: string;
  numeroPatient?: string;
  verifieParSecretaire?: boolean;
  dossierMedical?: unknown;
  // Champs UI historiques — le backend peut ne pas les renseigner
  cin?:                    string;
  numeroSecuriteSociale?:  string;
  medecinReferentId?:      string | number;
  medecinReferentNom?:     string;
  medecinIds?:             string[];
  medecins?:               { id: string; nom: string; prenom: string; specialite?: string; principal?: boolean }[];
  chambreId?:              string | null;
  chambreNumero?:          string | null;
  age?:                    number;
}

export interface CreatePatientPayload {
  nom:            string;
  prenom:         string;
  telephone:      string;
  dateNaissance?: string;
  sexe?:          string;
  adresse?:       string;
  cliniqueId:     string | number;
  groupeSanguin?: string;
  typeAdmission?: string;
  motDePasse?:    string;
  // Champs UI historiques — le backend peut les ignorer
  numeroSecuriteSociale?: string;
  medecinReferentId?:     string | number | null;
  medecinIds?:            string[];
  chambreId?:             string | null;
}

export interface UpdatePatientPayload {
  nom:            string;
  prenom:         string;
  telephone:      string;
  dateNaissance?: string;
  sexe?:          string;
  adresse?:       string;
  cliniqueId?:    string | number;
  groupeSanguin?: string;
  typeAdmission?: string;
  // Champs UI historiques — le backend peut les ignorer
  numeroSecuriteSociale?: string;
  medecinReferentId?:     string | number | null;
  medecinIds?:            string[];
  chambreId?:             string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const patientService = {
  getAll: () =>
    apiGet<Patient[]>(PATIENTS.LIST),

  getByClinique: (cliniqueId: number | string) =>
    apiGet<Patient[]>(PATIENTS.BY_CLINIQUE(cliniqueId)),

  getByService: (serviceId: number | string) =>
    apiGet<Patient[]>(PATIENTS.BY_SERVICE(serviceId)),

  getByNumero: (numero: string) =>
    apiGet<Patient>(PATIENTS.BY_NUMERO(numero)),

  getPatient: (id: number | string) =>
    apiGet<Patient>(PATIENTS.BY_ID(id)),

  createPatient: (data: CreatePatientPayload) =>
    apiPost<Patient>(PATIENTS.CREATE, data),

  updatePatient: (id: number | string, data: UpdatePatientPayload) =>
    apiPut<Patient>(PATIENTS.UPDATE(id), data),

  verifierSecretaire: (id: number | string) =>
    apiPut<Patient>(PATIENTS.VERIFIER_SECRETAIRE(id), {}),

  deletePatient: (id: number | string) =>
    apiGet<Patient>(PATIENTS.DELETE(id)),
};
