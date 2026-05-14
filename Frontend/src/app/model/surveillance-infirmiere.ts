import { Patient } from './patient';
import { Infirmier } from './infirmier';

export interface SurveillanceInfirmiere {
    id?: string;
    patient?: Patient;
    infirmier?: Infirmier;
    heureObservation: string;
    // Paramètres vitaux
    tensionArterielleSystemique?: number;
    tensionArterielleDiastolique?: number;
    frequenceCardiaque?: number;
    frequenceRespiratoire?: number;
    saturationOxygene?: number;
    temperature?: number;
    // Paramètres métaboliques
    glycemieCapillaire?: number;
    acetonuriePositive?: boolean;
    glucosuriePositive?: boolean;
    // Bilan hydrique
    entreesHydriques?: number;
    sortiesUrines?: number;
    typeHydratation?: string;
    // État clinique
    scoreGlasgow?: number;
    scoreEVA?: number;
    etatConscience?: string;
    etatRespiratoire?: string;
    // Oxygénothérapie
    sousOxygene?: boolean;
    debitOxygene?: number;
    modeAdministration?: string;
    // Observations
    observations?: string;
    alerteDeclenche?: boolean;
}

export interface SurveillanceInfirmiereDTO {
    patientId: string;
    infirmierId?: string;
    heureObservation: string;
    tensionArterielleSystemique?: number;
    tensionArterielleDiastolique?: number;
    frequenceCardiaque?: number;
    frequenceRespiratoire?: number;
    saturationOxygene?: number;
    temperature?: number;
    glycemieCapillaire?: number;
    scoreGlasgow?: number;
    scoreEVA?: number;
    etatConscience?: string;
    observations?: string;
}
