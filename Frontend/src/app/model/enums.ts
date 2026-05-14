// ============================================
// ENUMS ET TYPES
// ============================================

// AppRole enum matching backend
export type AppRole =
    | 'SUPER_ADMIN'
    | 'ADMIN_CLINIQUE'
    | 'MEDECIN'
    | 'INFIRMIER'
    | 'RADIOLOGUE'
    | 'PHARMACIEN'
    | 'SECRETAIRE'
    | 'PATIENT'
    | 'CHEF_PERSONNEL';

// Rôles du personnel de la clinique
export const ROLES_PERSONNEL: AppRole[] = [
    'MEDECIN', 'INFIRMIER', 'RADIOLOGUE', 'PHARMACIEN', 'SECRETAIRE', 'CHEF_PERSONNEL'
];

// Statuts RendezVous
export type StatutRendezVous = 'PLANIFIE' | 'CONFIRME' | 'ANNULE' | 'TERMINE';

// Statuts Hospitalisation
export type StatutHospitalisation = 'EN_COURS' | 'TERMINEE' | 'ANNULEE';

// Types Chambre - Aligné avec le backend (SIMPLE, DOUBLE, SUITE, REANIMATION, URGENCE)
export type TypeChambre = 'SIMPLE' | 'DOUBLE' | 'SUITE' | 'REANIMATION' | 'URGENCE';

export enum TypeChambreEnum {
    SIMPLE = 'SIMPLE',
    DOUBLE = 'DOUBLE',
    SUITE = 'SUITE',
    REANIMATION = 'REANIMATION',
    URGENCE = 'URGENCE'
}

// Ancien format pour compatibilité
export const TypeChambre = TypeChambreEnum;

// Statuts Analyse
export type StatutAnalyse = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'VALIDE';

// Statuts Imagerie
export type StatutImagerie = 'EN_ATTENTE' | 'EN_COURS' | 'TERMINE' | 'VALIDE' | 'REFUSE';

// Types Planning
export type TypePlanning = 'HEBDOMADAIRE' | 'MENSUEL' | 'GARDE';

// Types Garde
export type TypeGarde = 'JOUR' | 'NUIT' | 'WEEKEND';

// Statuts Absence
export type StatutAbsence = 'EN_ATTENTE' | 'APPROUVEE' | 'REFUSEE';

// Statuts Commande
export type StatutCommande = 'EN_ATTENTE' | 'VALIDEE' | 'ENVOYEE' | 'RECUE' | 'ANNULEE';

// Niveaux Alerte IA
export type NiveauAlerte = 'INFO' | 'WARNING' | 'CRITIQUE' | 'URGENCE';

// Types Modèle IA
export type TypeModeleIA = 'CLASSIFICATION_IMAGERIE' | 'ANALYSE_LABORATOIRE' | 'PREDICTION_STOCK' | 'DETECTION_ANOMALIE' | 'AUTRE';
