import { TypeChambre, TypeChambreEnum } from './enums';
import { Service } from './service';

export interface Chambre {
    id?: string;
    numero: string;
    type: TypeChambre;
    capacite: number;
    nombreLits: number;
    disponible?: boolean;
    service?: Service;
    serviceId?: string;
    materielIds?: string[];
    equipements?: string[];
}

export interface ChambreDTO {
    numero: string;
    type: TypeChambre;
    capacite: number;
    nombreLits: number;
    disponible?: boolean;
    serviceId: string;
    equipements?: string[];
    materielIds?: string[];
}
