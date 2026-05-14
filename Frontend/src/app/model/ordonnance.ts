import { Consultation } from './consultation';
// import { Prescription } from './prescription';
import { Pharmacien } from './pharmacien';

export interface Ordonnance {
    id?: string;
    date?: string;
    signee?: boolean;
    consultation?: Consultation;
    prescriptions?: PrescriptionDTO[];
    pharmacienValidateur?: Pharmacien;
    validee?: boolean;
}

export interface OrdonnanceDTO {
    id?: string;
    date?: string;
    signee?: boolean;
    consultationId?: string;
    prescriptions?: PrescriptionDTO[];
}

export interface PrescriptionDTO {
    medicament: string;
    dosage: string;
    frequence: string;
    duree: number;
    instructions?: string;
    medicamentId?: string;
}
