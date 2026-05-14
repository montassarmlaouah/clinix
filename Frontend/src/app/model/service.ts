import { Clinique } from './clinique';
import { Chambre } from './chambre';
import { User } from './user';

export interface Service {
    id?: string;
    nom: string;
    description: string;
    actif?: boolean;
    dateCreation?: string;
    nombreChambres?: number;
    nombreLits?: number;
    clinique?: Clinique;
    cliniqueId?: string;
    chambres?: Chambre[];
    personnel?: User[];
}

export interface ServiceDTO {
    nom: string;
    description: string;
    cliniqueId: string;
    actif?: boolean;
}
