export type PersonnelRole =
  | 'MEDECIN'
  | 'INFIRMIER'
  | 'PHARMACIEN'
  | 'SECRETAIRE'
  | 'RADIOLOGUE'
  | 'CHEF_PERSONNEL'
  | 'TECHNICIEN_MAINTENANCE';

export type ModeEnvoiCredentials = 'TUNISIE_SMS' | 'PDF_CODE' | 'PDF_ONLY' | 'EMAIL';

export interface PersonnelMember {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  role?: PersonnelRole | string;
  actif?: boolean;
  specialite?: string;
  email?: string;
  numeroPieceIdentite?: string;
  dateCreation?: string;
  clinique?: { id: string; nom: string; adresse?: string };
  service?: { id: string; nom: string };
}

export interface CreerPersonnelPayload {
  telephone: string;
  nom?: string;
  prenom?: string;
  role: PersonnelRole;
  specialite?: string;
  cliniqueId?: string;
  serviceId?: string;
  modeEnvoiCredentials?: ModeEnvoiCredentials;
  email?: string;
  numeroPieceIdentite?: string;
  medecinExistantId?: string;
  emailCopieInvitation?: string;
  profilInvitationMinimal?: boolean;
}

export interface CreerPersonnelResponse {
  message?: string;
  pdfBase64?: string;
  pdfFileName?: string;
  id?: string;
  sms?: { envoye: boolean; detail: string };
}

export interface MedecinRattachementResult {
  id: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  specialite?: string;
  numeroPieceIdentite?: string;
}

export const PERSONNEL_ROLES: { value: PersonnelRole; label: string }[] = [
  { value: 'MEDECIN', label: 'Médecin' },
  { value: 'INFIRMIER', label: 'Infirmier' },
  { value: 'PHARMACIEN', label: 'Pharmacien' },
  { value: 'SECRETAIRE', label: 'Secrétaire' },
  { value: 'RADIOLOGUE', label: 'Radiologue' },
  { value: 'CHEF_PERSONNEL', label: 'Chef du personnel' },
  { value: 'TECHNICIEN_MAINTENANCE', label: 'Technicien maintenance' },
];

export const SPECIALITES_MEDICALES = [
  'Cardiologie',
  'Dermatologie',
  'Pédiatrie',
  'Chirurgie générale',
  'Ophtalmologie',
  'Orthopédie',
  'Neurologie',
  'Radiologie',
  'Anesthésie',
  'Gynécologie',
  'Médecine générale',
  'Autre',
];

export const MODES_ENVOI: { value: ModeEnvoiCredentials; label: string; hint: string }[] = [
  { value: 'TUNISIE_SMS', label: 'TunisieSMS', hint: 'Mot de passe provisoire envoyé par SMS' },
  { value: 'EMAIL', label: 'E-mail', hint: 'Identifiants dans le message de bienvenue' },
  { value: 'PDF_CODE', label: 'PDF (e-mail)', hint: 'PDF joint — identifiants dans le fichier ; e-mail obligatoire' },
  { value: 'PDF_ONLY', label: 'PDF seul', hint: 'Télécharger le PDF après création (sans envoi)' },
];
