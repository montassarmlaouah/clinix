/**
 * Types alignés sur Frontend/src/app/model — utilisés par les services mobile.
 */
export type { Patient, CreatePatientPayload, UpdatePatientPayload } from '@/src/api/services/patient.service';
export type { RendezVous, RdvStatut, Medecin, CreateRdvPayload } from '@/src/api/services/rdv.service';
export type { Medicament, Stock, DemandeMedicament } from '@/src/api/services/pharmacie.service';
export type { DossierMedical, Ordonnance, AnalyseLaboratoire } from '@/src/api/services/patient-portal.service';
export type { Equipement, TraiterPannePayload } from '@/src/api/services/technicien.service';
export type { Planning, Absence, Presence, ServiceMedical } from '@/src/api/services/chef-personnel.service';
export { Roles, roleLabels, roleColors, ROLE_ROUTES, normalizeRole, rolesMatch } from '@/src/constants/roles';
