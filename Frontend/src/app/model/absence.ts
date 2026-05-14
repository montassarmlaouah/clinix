import { StatutAbsence } from './enums';
import { User } from './user';
import { ChefPersonnel } from './chef-personnel';

export interface Absence {
    id?: string;
    dateDebut: string;
    dateFin: string;
    motif: string;
    statut?: StatutAbsence;
    utilisateur?: User;
    validateur?: ChefPersonnel;
}

export interface AbsenceDTO {
    dateDebut: string;
    dateFin: string;
    motif: string;
    utilisateurId: string;
}
