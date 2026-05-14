import { TypePlanning } from './enums';
import { ChefPersonnel } from './chef-personnel';
import { User } from './user';
import { Garde } from './garde';

export interface Planning {
    id?: string;
    date: string;
    dateDebut?: string;
    type: TypePlanning;
    valide?: boolean;
    createur?: ChefPersonnel;
    utilisateurs?: User[];
    gardes?: Garde[];
}
