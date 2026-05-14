import { Service } from './service';
import { User } from './user';

export interface Clinique {
    id?: string;
    nom: string;
    adresse: string;
    latitude?: number;
    longitude?: number;
    telephone?: string;
    capacite?: number;
    actif?: boolean;
    dateCreation?: string;
    services?: Service[];
    personnel?: User[];
}
