import { Patient } from './patient';
import { Infirmier } from './infirmier';

export interface ConstanteVitale {
    id?: string;
    dateHeure?: string;
    tension?: number;
    temperature?: number;
    frequenceCardiaque?: number;
    saturationOxygene?: number;
    patient?: Patient;
    infirmier?: Infirmier;
}

export interface ConstanteVitaleDTO {
    tension?: number;
    temperature?: number;
    frequenceCardiaque?: number;
    saturationOxygene?: number;
    patientId: string;
    infirmierId?: string;
}
