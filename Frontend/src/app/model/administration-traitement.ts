import { Patient } from './patient';
import { Infirmier } from './infirmier';

export interface AdministrationTraitement {
    id?: string;
    patient?: Patient;
    infirmier?: Infirmier;
    heureAdministration: string;
    typeTraitement: string;
    nomMedicament: string;
    dosage: string;
    voieAdministration: string;
    administre?: boolean;
    observations?: string;
    dateAdministrationReelle?: string;
    dateCreation?: string;
    /** PLANIFIE | EN_COURS | REALISE | NON_REALISE */
    statutExecution?: string;
    remarquesInfirmier?: string;
    pieceJointeUrl?: string;
    prioriteUrgente?: boolean;
    validationSoinsMedecin?: string;
}

export interface AdministrationTraitementDTO {
    patientId: string;
    infirmierId?: string;
    heureAdministration: string;
    typeTraitement: string;
    nomMedicament: string;
    dosage: string;
    voieAdministration: string;
    observations?: string;
}
