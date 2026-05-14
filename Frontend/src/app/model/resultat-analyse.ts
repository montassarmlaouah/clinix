import { AnalyseLaboratoire } from './analyse-laboratoire';

export interface ResultatAnalyse {
    id?: string;
    parametre: string;
    valeur: string;
    unite: string;
    interpretation?: string;
    anormal?: boolean;
    analyse?: AnalyseLaboratoire;
}

export interface ResultatAnalyseDTO {
    parametre: string;
    valeur: string;
    unite: string;
    interpretation?: string;
    anormal?: boolean;
    analyseId: string;
}
