import { Medicament } from './medicament';
import { Clinique } from './clinique';

export interface StockMedicament {
    id?: string;
    quantite: number;
    dateExpiration: string;
    lot: string;
    seuilAlerte?: number;
    medicament?: Medicament;
    clinique?: Clinique;
}
