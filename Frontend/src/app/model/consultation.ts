import { Patient } from './patient';
import { Medecin } from './medecin';
import { DossierMedical } from './dossier-medical';
import { Ordonnance } from './ordonnance';

export interface Consultation {
    id?: string;
    date?: string;
    motif: string;
    diagnostic?: string;
    observations?: string;
    patient?: Patient;
    medecin?: Medecin;
    dossierMedical?: DossierMedical;
    ordonnance?: Ordonnance;
}

export interface ConsultationDTO {
    id?: string;
    date?: string;
    motif: string;
    diagnostic?: string;
    observations?: string;
    patientId: string;
    medecinId: string;
}
