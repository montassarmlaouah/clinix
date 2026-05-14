import { User } from './user';

export interface Infirmier extends User {
    numeroOrdre?: string;
}
