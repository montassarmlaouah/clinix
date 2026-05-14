import { User } from './user';

export interface Medecin extends User {
    specialite?: string;
    numeroOrdre?: string;
    telephoneFixe?: string;
    localisation?: string;
}
