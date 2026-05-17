import { User } from './user';
import { DossierMedical } from './dossier-medical';

export interface Patient extends User {
    numeroPatient?: string;
    dateNaissance?: string;
    sexe?: string;
    groupeSanguin?: string;
    adresse?: string;
    typeAdmission?: string;
    verifieParSecretaire?: boolean;
    verificationSecretaireDate?: string;
    age?: number;
    dossierMedical?: DossierMedical;
    medecinReferentId?: string;
    medecinReferentNom?: string;
    medecinIds?: string[];
    medecins?: { id: string; nom: string; prenom: string; specialite?: string; principal?: boolean }[];
}

export interface PatientDTO {
    nom: string;
    prenom: string;
    telephone: string;
    motDePasse?: string;
    dateNaissance: string;
    sexe?: string;
    groupeSanguin?: string;
    adresse?: string;
    typeAdmission?: string;
    cliniqueId?: string;
    medecinIds?: string[];
    medecinReferentId?: string;
}
