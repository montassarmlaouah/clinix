// ============================================
// BARREL FILE - Export all models
// ============================================

// Enums
// Export all except StatutEquipement to avoid ambiguity
export { /* other exports except StatutEquipement */ } from './enums';

// Base entities
export * from './permission';
export * from './role';
export * from './clinique';
export * from './service';
export * from './user';

// User types
export * from './patient';
export * from './medecin';
export * from './infirmier';
export * from './radiologue';
export * from './pharmacien';
export * from './secretaire';
export * from './administrateur-clinique';
export * from './super-administrateur';
export * from './chef-personnel';

// Medical entities
export * from './dossier-medical';
export * from './rendez-vous';
export * from './consultation';
export * from './ordonnance';
export * from './prescription';
export * from './chambre';
export * from './hospitalisation';
export * from './note-hospitalisation';
export * from './constante-vitale';
export * from './surveillance-infirmiere';
export * from './administration-traitement';

// Lab & Imaging
export * from './imagerie-dicom';
export * from './rapport-imagerie';
export * from './analyse-laboratoire';
export * from './resultat-analyse';

// Pharmacy
export * from './medicament';
export * from './stock-medicament';

// Export materiel-medical types (équipements)
// Explicitly export StatutEquipement from materiel-medical
export { StatutEquipement } from './materiel-medical';
export * from './materiel-medical';
export * from './fournisseur';
export * from './commande-fournisseur';

// Planning & HR
export * from './planning';
export * from './garde';
export * from './presence';
export * from './absence';

// AI
export * from './modele-ia';
export * from './alerte-ia';
export * from './workflow-n8n';

// Auth DTOs
export * from './auth.dto';

// Utils
export * from './utils';
