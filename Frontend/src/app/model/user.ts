import { Role } from './role';
import { Clinique } from './clinique';
import { Service } from './service';

export interface User {
    id?: string;
    nom?: string;
    prenom?: string;
    telephone: string;
    email?: string;
    motDePasse?: string;
    actif?: boolean;
    dateCreation?: string;
    roles?: Role[];
    clinique?: Clinique;
    service?: Service;
    /** CIN — création cabinet / rattachement compte existant */
    numeroPieceIdentite?: string;
}
