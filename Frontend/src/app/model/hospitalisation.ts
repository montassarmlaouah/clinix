import { StatutHospitalisation } from './enums';
import { Patient } from './patient';
import { Medecin } from './medecin';
import { Chambre } from './chambre';

export interface Hospitalisation {
    id?: string;
    dateEntree: string;
    dateSortie?: string;
    motif: string;
    statut?: StatutHospitalisation;
    patient?: Patient;
    medecin?: Medecin;
    chambre?: Chambre;
}

export interface HospitalisationDTO {
    id?: string;
    dateEntree: string;
    dateSortie?: string;
    motif: string;
    statut?: StatutHospitalisation;
    patientId: string;
    medecinId: string;
    chambreId?: string;
}
