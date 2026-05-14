import { TypeModeleIA } from './enums';

export interface ModeleIA {
    id?: string;
    nom: string;
    type: TypeModeleIA;
    version: string;
    precision?: number;
    actif?: boolean;
    description?: string;
}
