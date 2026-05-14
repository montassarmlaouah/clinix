import { StatutImagerie } from './enums';
import { Patient } from './patient';
import { Medecin } from './medecin';
import { Radiologue } from './radiologue';
import type { DossierMedical } from './dossier-medical';
import type { RapportImagerie } from './rapport-imagerie';

export interface ImagerieDICOM {
    id?: string;
    date?: string;
    type: string;
    fichier: string;
    statut?: StatutImagerie;
    motif?: string;
    indicationsCliniques?: string;
    questionsMedecin?: string;
    piecesJointes?: string;
    niveauUrgence?: string;
    datePrevue?: string;
    /** Créneau horaire (ISO, ex. 09:30:00) */
    heurePrevue?: string;
    /** Modalité réellement réalisée (CT, IRM, etc.) */
    typeExamenRealise?: string;
    fichiersSupplementaires?: string;
    commentairesImages?: string;
    notesCooperationPatient?: string;
    commentaireStatut?: string;
    dateMiseAJour?: string;
    protocoleExamen?: string;
    patient?: Patient;
    medecinDemandeur?: Medecin;
    radiologue?: Radiologue;
    dossierMedical?: DossierMedical;
    rapport?: RapportImagerie;
}

export interface ImagerieDICOMDTO {
    type: string;
    fichier: string;
    patientId: string;
    radiologueId?: string;
}
