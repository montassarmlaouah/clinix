import { Ordonnance } from './ordonnance';
import { Medicament } from './medicament';

export interface Prescription {
    id?: string;
    medicament: string;
    dosage: string;
    frequence: string;
    duree: number;
    instructions?: string;
    ordonnance?: Ordonnance;
    medicamentDetail?: Medicament;
}