import { Permission } from './permission';

export interface Role {
    id?: string;
    nom: string;
    description?: string;
    permissions?: Permission[];
}
