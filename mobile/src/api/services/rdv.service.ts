import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/src/api/client';
import { MEDECINS, RDV } from '@/src/api/endpoints';

// ── Types — STRICTEMENT alignés avec backend StatutRendezVous enum ────────────
export type RdvStatut = 'PLANIFIE' | 'CONFIRME' | 'ARRIVE' | 'ANNULE' | 'TERMINE';

export interface RendezVous {
  id:              string | number;
  dateHeure:       string;       // ISO 8601
  motif:           string;
  statut:          RdvStatut;
  patientId:       string | number;
  patientNom?:     string;
  patientPrenom?:  string;
  medecinId:       string | number;
  medecinNom?:     string;
  medecinPrenom?:  string;
  medecinSpecialite?: string;
}

export interface Medecin {
  id:         string | number;
  nom:        string;
  prenom:     string;
  specialite: string;
}

export interface CreateRdvPayload {
  dateHeure: string;   // ISO 8601
  motif:     string;
  patientId: string | number;
  medecinId: string | number;
  // Champ UI historique — le backend peut l'ignorer
  typeRdv?:  string;
}

export interface RdvUrgentPayload {
  patientId:    string | number;
  signaleParId?: string | number;
  motif:        string;
  dateHeure?:   string;   // ISO 8601 — requis par le backend
  description?: string;
  niveau?:      'FAIBLE' | 'MODEREE' | 'ELEVEE' | 'CRITIQUE';
  // Alias UI historique — le backend utilise signaleParId
  medecinId?:   string | number;
}

// ── Service ───────────────────────────────────────────────────────────────────
export const rdvService = {
  getAll: () =>
    apiGet<RendezVous[]>(RDV.LIST),

  getRdvClinique: (cliniqueId: number | string) =>
    apiGet<RendezVous[]>(RDV.BY_CLINIQUE(cliniqueId)),

  getRdvCliniqueJour: (cliniqueId: number | string, date?: string) =>
    apiGet<RendezVous[]>(`${RDV.BY_CLINIQUE_JOUR(cliniqueId)}${date ? `?date=${encodeURIComponent(date)}` : ''}`),

  getRdvByMedecin: (medecinId: number | string) =>
    apiGet<RendezVous[]>(RDV.BY_MEDECIN(medecinId)),

  getRdvByMedecinClinique: (medecinId: number | string, cliniqueId: number | string) =>
    apiGet<RendezVous[]>(RDV.BY_MEDECIN_CLINIQUE(medecinId, cliniqueId)),

  getRdvByPatient: (patientId: number | string) =>
    apiGet<RendezVous[]>(RDV.BY_PATIENT(patientId)),

  createRdv: (data: CreateRdvPayload) =>
    apiPost<RendezVous>(RDV.CREATE, data),

  confirmerRdv: (id: number | string) =>
    apiPatch<RendezVous>(RDV.CONFIRMER(id), {}),

  confirmerRdvMedecin: (id: number | string) =>
    apiPatch<RendezVous>(RDV.CONFIRMER_MEDECIN(id), {}),

  annulerRdv: (id: number | string) =>
    apiPatch<RendezVous>(RDV.ANNULER(id), {}),

  reporterRdv: (id: number | string, nouvelleDate: string) =>
    apiPatch<RendezVous>(`${RDV.REPORTER(id)}?nouvelleDate=${encodeURIComponent(nouvelleDate)}`, {}),

  validationVisiteInfirmier: (
    id: number | string,
    body: { observations?: string; signer: boolean }
  ) => apiPatch<RendezVous>(RDV.VALIDATION_VISITE_INF(id), body),

  updateRdv: (id: number | string, data: CreateRdvPayload) =>
    apiPut<RendezVous>(RDV.UPDATE(id), data),

  deleteRdv: (id: number | string) =>
    apiDelete<void>(RDV.DELETE(id)),

  createRdvUrgent: (data: RdvUrgentPayload) =>
    apiPost<RendezVous>(RDV.CREATE, data),

  // ── Médecins helpers ───────────────────────────────────────────────────────
  getMedecins: () =>
    apiGet<Medecin[]>(MEDECINS.LIST),

  getMedecinsByClinique: (cliniqueId: number | string) =>
    apiGet<Medecin[]>(MEDECINS.BY_CLINIQUE(cliniqueId)),

  getMedecinsBySpecialite: (specialite: string) =>
    apiGet<Medecin[]>(MEDECINS.BY_SPECIALITE(specialite)),

  getDisponibilites: (medecinId: number | string, date: string) =>
    apiGet<string[]>(`${RDV.BY_MEDECIN(medecinId)}/disponibilites?date=${encodeURIComponent(date)}`),
};
