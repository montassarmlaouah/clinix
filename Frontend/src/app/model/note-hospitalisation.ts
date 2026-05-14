export interface NoteHospitalisation {
  id?: string;
  contenu: string;
  dateCreation?: string;
  auteurId: string;
  auteurNom: string;
  auteurRole: string;
}

export interface NoteHospitalisationPayload {
  contenu: string;
  auteurId: string;
  auteurNom: string;
  auteurRole: string;
}
