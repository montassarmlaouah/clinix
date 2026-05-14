import type { Medecin } from './medecin';

// Login request
export interface LoginRequest {
    username: string;
    password: string;
}

// Auth response
export interface AuthResponse {
    token: string;
    message?: string;
    role?: string;
    id?: string;
    telephone?: string;
    nom?: string;
    prenom?: string;
    numeroPatient?: string;
    cliniqueId?: string;
}

// DTO pour créer une clinique avec son administrateur (Super Admin)
export interface CreerCliniqueAvecAdminDTO {
    nomClinique: string;
    adresseClinique: string;
    telephoneClinique?: string;
    nomAdmin: string;
    prenomAdmin: string;
    telephoneAdmin: string;
    emailAdmin?: string;
    motDePasseAdmin: string;
    /** MONTHLY | YEARLY — type de licence préféré (onboarding, facturation Stripe). */
    preferenceFacturation?: string;
}

/** Super admin : cabinet médecin (sans clinique) */
export interface CreerCabinetMedecinDTO {
    nom: string;
    prenom: string;
    telephone: string;
    specialite: string;
    telephoneFixe?: string;
    localisation?: string;
    /** CIN obligatoire à la création ; si médecin cabinet existe (même CIN + même mobile), identifiants conservés */
    numeroPieceIdentite?: string;
}

/** Réponse POST /api/medecins/cabinets */
export interface CabinetMedecinCreationResponse {
    medecin: Medecin;
    smsEnvoye: boolean;
    smsDetail?: string | null;
    compteExistantRattache?: boolean;
    motDePasseRegenere?: boolean;
}

// DTO pour créer un personnel (Admin Clinique)
/** TUNISIE_SMS | PDF_CODE | PDF_ONLY | EMAIL */
export type ModeEnvoiCredentialsPersonnel = 'TUNISIE_SMS' | 'PDF_CODE' | 'PDF_ONLY' | 'EMAIL';

export interface CreerPersonnelDTO {
    telephone: string;
    nom?: string;
    prenom?: string;
    motDePasse?: string;
    role: string;
    specialite?: string;
    cliniqueId?: string;
    serviceId?: string;
    modeEnvoiCredentials?: ModeEnvoiCredentialsPersonnel;
    email?: string;
    numeroPieceIdentite?: string;
    /** Rattacher un médecin déjà présent (recherche) au lieu de créer un doublon */
    medecinExistantId?: string;
    /** E-mail en copie cachée (BCC), ex. autre boîte / autre clinique. */
    emailCopieInvitation?: string;
    /** Invitation avec données réduites (selon politique clinique / backend). */
    profilInvitationMinimal?: boolean;
}

// OTP (SMS)
export interface VerificationCodeRequest {
    telephone: string;
    code: string;
}
