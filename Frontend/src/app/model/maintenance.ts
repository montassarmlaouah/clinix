export interface Maintenance {
    id?: string;
    date: string;
    type?: string;
    description?: string;
    statut?: string;
}

export interface MaintenanceDTO {
    date: string;
    type?: string;
    description?: string;
}
