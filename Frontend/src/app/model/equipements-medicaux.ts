// Modèle pour les équipements
export interface Equipement {
  id?: string;
  code?: string;
  nom: string;
  description?: string;
  categorie: CategorieEquipement;
  type?: string;
  quantite: number;
  etatTechnique: EtatTechnique;
  statut: StatutEquipement;
  criticite: CriticiteEquipement;
  typeLocalisation?: TypeLocalisation;
  localisation?: string;
  notes?: string;
  dateAchat?: Date;
  dateMaintenance?: Date;
  dateMaintenanceProchaine?: Date;
  chambreId?: string;
  cliniqueId?: string;
}

export interface EquipementDTO {
  id?: string;
  code?: string;
  nom?: string;
  description?: string;
  categorie?: CategorieEquipement;
  quantite?: number;
  etatTechnique?: EtatTechnique;
  statut?: StatutEquipement;
  criticite?: CriticiteEquipement;
  typeLocalisation?: TypeLocalisation;
  localisation?: string;
  notes?: string;
  dateMaintenance?: Date | string;
  dateMaintenanceProchaine?: Date | string;
  chambreId?: string;
  cliniqueId?: string;
}

// Enums
export enum CategorieEquipement {
  LITS_MOBILIER = 'LITS_MOBILIER',
  DIAGNOSTIC = 'DIAGNOSTIC',
  INSTRUMENTATION = 'INSTRUMENTATION',
  CONSOMMABLE = 'CONSOMMABLE',
  AUTRE = 'AUTRE'
}

export enum EtatTechnique {
  FONCTIONNEL = 'FONCTIONNEL',
  EN_PANNE = 'EN_PANNE',
  EN_MAINTENANCE = 'EN_MAINTENANCE',
  HORS_SERVICE = 'HORS_SERVICE'
}

export enum StatutEquipement {
  DISPONIBLE = 'DISPONIBLE',
  UTILISE = 'UTILISE',
  RESERVE = 'RESERVE'
}

export enum CriticiteEquipement {
  FAIBLE = 'FAIBLE',
  MOYENNE = 'MOYENNE',
  HAUTE = 'HAUTE'
}

export enum TypeLocalisation {
  CHAMBRE = 'CHAMBRE',
  MAGASIN = 'MAGASIN',
  BUREAU = 'BUREAU',
  LABORATOIRE = 'LABORATOIRE',
  AUTRE = 'AUTRE'
}

// Fonctions utilitaires
export function obtenirNomCategorie(categorie: CategorieEquipement): string {
  switch (categorie) {
    case CategorieEquipement.LITS_MOBILIER:
      return 'Lits & Mobilier';
    case CategorieEquipement.DIAGNOSTIC:
      return 'Diagnostic & Monitoring';
    case CategorieEquipement.INSTRUMENTATION:
      return 'Instrumentation';
    case CategorieEquipement.CONSOMMABLE:
      return 'Consommable';
    case CategorieEquipement.AUTRE:
      return 'Autre';
    default:
      return String(categorie);
  }
}

export function obtenirNomEtatTechnique(etatTechnique: EtatTechnique): string {
  switch (etatTechnique) {
    case EtatTechnique.FONCTIONNEL:
      return 'Fonctionnel';
    case EtatTechnique.EN_PANNE:
      return 'En panne';
    case EtatTechnique.EN_MAINTENANCE:
      return 'En maintenance';
    case EtatTechnique.HORS_SERVICE:
      return 'Hors service';
    default:
      return String(etatTechnique);
  }
}

export function obtenirNomStatut(statut: StatutEquipement): string {
  switch (statut) {
    case StatutEquipement.DISPONIBLE:
      return 'Disponible';
    case StatutEquipement.UTILISE:
      return 'Utilisé';
    case StatutEquipement.RESERVE:
      return 'Réservé';
    default:
      return String(statut);
  }
}
