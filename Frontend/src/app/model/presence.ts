import { Infirmier } from './infirmier';
import { ChefPersonnel } from './chef-personnel';

export interface Presence {
    id?: string;
    infirmier?: Infirmier;
    datePresence: string;
    heureArrivee?: string;
    heureDepart?: string;
    present?: boolean;
    statut?: string;
    observation?: string;
    marquePar?: ChefPersonnel;
}

export interface PresenceDTO {
    infirmierId: string;
    datePresence: string;
    heureArrivee?: string;
    heureDepart?: string;
    present: boolean;
    observation?: string;
}
