
// Enums and constants
export type { AppRole } from './enums';
export { ROLES_PERSONNEL } from './enums';

// User types
export type { User } from './user';
export type { Patient, PatientDTO } from './patient';
export type { Medecin } from './medecin';

// Clinique
export type { Clinique } from './clinique';

// Service
export type { Service, ServiceDTO } from './service';

// Rendez-vous
export type { RendezVous, RendezVousDTO } from './rendez-vous';

// Auth DTOs
export type { 
  LoginRequest, 
  AuthResponse, 
  CreerCliniqueAvecAdminDTO,
  CreerCabinetMedecinDTO,
  CabinetMedecinCreationResponse,
  CreerPersonnelDTO,
  VerificationCodeRequest
} from './auth.dto';

