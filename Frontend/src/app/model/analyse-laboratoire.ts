import { StatutAnalyse } from './enums';
import { Patient } from './patient';
import { DossierMedical } from './dossier-medical';
import { ResultatAnalyse } from './resultat-analyse';

export interface AnalyseLaboratoire {
    id?: string;
    date?: string;
    type: string;
    fichierPDF?: string;
    statut?: StatutAnalyse;
    patient?: Patient;
    dossierMedical?: DossierMedical;
    resultats?: ResultatAnalyse[];
}

export interface AnalyseLaboratoireDTO {
    type: string;
    patientId: string;
}
