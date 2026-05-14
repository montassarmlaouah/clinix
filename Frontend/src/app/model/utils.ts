// ============================================
// TYPES UTILITAIRES
// ============================================

// Pagination
export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

// API Response générique
export interface ApiResponse<T> {
    data?: T;
    message?: string;
    success: boolean;
    errors?: string[];
}

// Filtre de recherche
export interface SearchFilter {
    keyword?: string;
    dateDebut?: string;
    dateFin?: string;
    statut?: string;
    page?: number;
    size?: number;
    sort?: string;
}
