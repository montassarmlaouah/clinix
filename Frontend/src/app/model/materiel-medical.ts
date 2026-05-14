export interface Equipement {
  id?: string;
  code?: string;
  nom: string;  // Correction : utiliser 'nom' au lieu de 'libelle'
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
  nom?: string;  // Correction : utiliser 'nom' au lieu de 'libelle'
  description?: string;
  categorie?: CategorieEquipement;
  quantite?: number;
  etatTechnique?: EtatTechnique;
  statut?: StatutEquipement;
  criticite?: CriticiteEquipement;
  typeLocalisation?: TypeLocalisation;
  localisation?: string;
  notes?: string;
  dateMaintenance?: string | Date;
  dateMaintenanceProchaine?: string | Date;
  chambreId?: string;
  cliniqueId?: string;
}

// Les enums restent les mêmes
export enum CategorieEquipement {
  LITS_MOBILIER = 'LITS_MOBILIER',
  DIAGNOSTIC = 'DIAGNOSTIC'
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
