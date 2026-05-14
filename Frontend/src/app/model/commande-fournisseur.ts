import { StatutCommande } from './enums';
import { Fournisseur } from './fournisseur';
import { User } from './user';
import { Pharmacien } from './pharmacien';

export interface CommandeFournisseur {
    id?: string;
    dateCommande?: string;
    statut?: StatutCommande;
    montant: number;
    fournisseur?: Fournisseur;
    createur?: User;
    validateur?: Pharmacien;
}

export interface CommandeFournisseurDTO {
    montant: number;
    fournisseurId: string;
}
