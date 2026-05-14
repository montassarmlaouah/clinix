import type { ImagerieDICOM } from './imagerie-dicom';
import { Radiologue } from './radiologue';

export interface RapportImagerie {
    id?: string;
    date?: string;
    observations?: string;
    analyse?: string;
    conclusion?: string;
    recommandations?: string;
    diagnosticDifferentiel?: string;
    signesCliniquesNotables?: string;
    /** ISO date-time après validation (signature électronique logique) */
    dateSignatureElectronique?: string;
    valide?: boolean;
    imagerie?: ImagerieDICOM;
    radiologue?: Radiologue;
}

export interface RapportImagerieDTO {
    observations?: string;
    conclusion?: string;
    valide?: boolean;
    imagerieId: string;
    radiologueId: string;
}
