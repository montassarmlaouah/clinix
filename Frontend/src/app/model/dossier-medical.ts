import { Patient } from './patient';
import { Consultation } from './consultation';
import type { ImagerieDICOM } from './imagerie-dicom';
import { AnalyseLaboratoire } from './analyse-laboratoire';

export interface DossierMedical {
    id?: string;
    dateCreation?: string;
    antecedents?: string;
    /** Notes visibles uniquement par le personnel médical autorisé */
    notesConfidentielles?: string;
    allergies?: string[];
    patient?: Patient;
    consultations?: Consultation[];
    imageries?: ImagerieDICOM[];
    analyses?: AnalyseLaboratoire[];
}
