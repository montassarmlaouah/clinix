import type { Medecin } from '@/src/api/services/medecinService';

export interface CreerCabinetMedecinDTO {
  nom: string;
  prenom: string;
  telephone: string;
  specialite: string;
  telephoneFixe?: string;
  localisation?: string;
  numeroPieceIdentite?: string;
}

export interface CabinetMedecinCreationResponse {
  medecin: Medecin & {
    clinique?: { id?: string; nom?: string };
    localisation?: string;
    telephoneFixe?: string;
    numeroPieceIdentite?: string;
    actif?: boolean;
    dateCreation?: string;
  };
  smsEnvoye: boolean;
  smsDetail?: string | null;
  compteExistantRattache?: boolean;
  motDePasseRegenere?: boolean;
}

export interface VerifierCinCabinetResult {
  trouve?: boolean;
  nouveauCompte?: boolean;
  rattacheClinique?: boolean;
  ambigu?: boolean;
  message?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  cliniqueNom?: string;
  medecinId?: string;
}

export interface CabinetMedecinListItem extends Medecin {
  actif?: boolean;
  localisation?: string;
  telephoneFixe?: string;
  numeroPieceIdentite?: string;
  clinique?: { id?: string; nom?: string };
  dateCreation?: string;
}
