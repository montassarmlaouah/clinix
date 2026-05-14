import { StatutRendezVous } from './enums';
import { Patient } from './patient';
import { Medecin } from './medecin';

export interface RendezVous {
    id?: string;
    dateHeure: string;
    motif: string;
    statut?: StatutRendezVous;
    patient?: Patient;
    medecin?: Medecin;
    visiteValideeParInfirmier?: boolean;
    dateValidationVisiteInfirmier?: string;
    observationsVisiteInfirmier?: string;
    empreinteSignatureVisite?: string;
}

export interface RendezVousDTO {
    id?: string;
    dateHeure: string;
    motif?: string;
    statut?: string;
    patientId: string;
    patientNom?: string;
    medecinId: string;
    medecinNom?: string;
}
