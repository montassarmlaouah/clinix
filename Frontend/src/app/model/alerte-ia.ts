import { NiveauAlerte } from './enums';
import { ModeleIA } from './modele-ia';
import { User } from './user';

export interface AlerteIA {
    id?: string;
    date?: string;
    type: string;
    niveau: NiveauAlerte;
    message: string;
    traitee?: boolean;
    modeleIA?: ModeleIA;
    utilisateursNotifies?: User[];
}

export interface AlerteIADTO {
    type: string;
    niveau: NiveauAlerte;
    message: string;
    modeleIAId?: string;
}
