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
}
