import { TypeGarde } from './enums';
import { User } from './user';
import { Planning } from './planning';
import { Service } from './service';

export interface Garde {
    id?: string;
    debut: string;
    fin: string;
    type: TypeGarde;
    utilisateur?: User;
    planning?: Planning;
    service?: Service;
}

export interface GardeDTO {
    debut: string;
    fin: string;
    type: TypeGarde;
    utilisateurId: string;
    planningId?: string;
}
