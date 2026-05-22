/**
 * Items officiels de la check-list HAS (Haute Autorité de Santé)
 * Version mise à jour 2022 — 5 temps chirurgicaux
 *
 * Référence : https://www.has-sante.fr/jcms/c_985528/fr/check-list-securite-du-patient
 */

export interface CheckListHASItem {
  id: string;
  libelle: string;
  obligatoire: boolean;
  temps: 1 | 2 | 3 | 4 | 5;
}

/** Temps 1 : Avant induction anesthésique (Sign In) */
const SIGN_IN: CheckListHASItem[] = [
  { id: 'T1_01', libelle: "Identité du patient confirmée (nom, prénom, date de naissance)", obligatoire: true,  temps: 1 },
  { id: 'T1_02', libelle: "Site opératoire confirmé (côté, niveau) et marqué si applicable",  obligatoire: true,  temps: 1 },
  { id: 'T1_03', libelle: "Consentement éclairé vérifié et signé",                           obligatoire: true,  temps: 1 },
  { id: 'T1_04', libelle: "Dossier anesthésique complet et à disposition",                   obligatoire: true,  temps: 1 },
  { id: 'T1_05', libelle: "Allergies connues vérifiées et consignées",                       obligatoire: true,  temps: 1 },
  { id: 'T1_06', libelle: "Oxymètre de pouls fonctionnel",                                   obligatoire: true,  temps: 1 },
  { id: 'T1_07', libelle: "Jeûne confirmé",                                                  obligatoire: false, temps: 1 },
  { id: 'T1_08', libelle: "Risque hémorragique évalué, produits sanguins disponibles si besoin", obligatoire: false, temps: 1 },
];

/** Temps 2 : Avant l'incision cutanée (Time Out) */
const TIME_OUT: CheckListHASItem[] = [
  { id: 'T2_01', libelle: "Confirmation identité, site et intervention par toute l'équipe",  obligatoire: true,  temps: 2 },
  { id: 'T2_02', libelle: "Antibioprophylaxie administrée dans les 60 min précédentes",      obligatoire: true,  temps: 2 },
  { id: 'T2_03', libelle: "Imagerie essentielle affichée (si applicable)",                   obligatoire: false, temps: 2 },
  { id: 'T2_04', libelle: "Événements critiques anticipés — chirurgien",                     obligatoire: true,  temps: 2 },
  { id: 'T2_05', libelle: "Événements critiques anticipés — anesthésiste",                   obligatoire: true,  temps: 2 },
  { id: 'T2_06', libelle: "Événements critiques anticipés — équipe soignante",               obligatoire: true,  temps: 2 },
  { id: 'T2_07', libelle: "Stérilisation des instruments confirmée",                         obligatoire: true,  temps: 2 },
];

/** Temps 3 : Avant que le patient quitte le bloc (Sign Out) */
const SIGN_OUT: CheckListHASItem[] = [
  { id: 'T3_01', libelle: "Acte réalisé confirmé et consigné",                               obligatoire: true,  temps: 3 },
  { id: 'T3_02', libelle: "Décompte instruments, compresses et aiguilles correct",           obligatoire: true,  temps: 3 },
  { id: 'T3_03', libelle: "Étiquetage des prélèvements anatomopathologiques",                obligatoire: true,  temps: 3 },
  { id: 'T3_04', libelle: "Problèmes à signaler en post-opératoire identifiés",             obligatoire: false, temps: 3 },
];

export const CHECK_LIST_HAS_ITEMS: CheckListHASItem[] = [
  ...SIGN_IN,
  ...TIME_OUT,
  ...SIGN_OUT,
];

export const TEMPS_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Temps 1 — Sign In (avant induction)',
  2: 'Temps 2 — Time Out (avant incision)',
  3: 'Temps 3 — Sign Out (avant départ bloc)',
  4: 'Temps 4 — Post-opératoire',
  5: 'Temps 5 — Sortie SSPI',
};
