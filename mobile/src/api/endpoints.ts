// ─────────────────────────────────────────────────────────────────────────────
//  endpoints.ts — URLs API backend STRICTEMENT alignées avec Spring Boot
//  Base URL : http://<host>:8080 (injectée par le client fetch)
//  RÈGLE : AUCUN endpoint n'est inventé. Chaque route est vérifiée côté backend.
// ─────────────────────────────────────────────────────────────────────────────

const API  = '/api';
const AUTH = '/auth';

// ── Authentification ─────────────────────────────────────────────────────────
export const AUTH_ENDPOINTS = {
  LOGIN:        `${AUTH}/login`,
  // REFRESH TOKEN N'EXISTE PAS DANS LE BACKEND — supprimé
  PROFILE:        `${AUTH}/profile`,
  CHANGE_PASSWORD:`${AUTH}/change-password`,
  FORGOT_SEND:  `${AUTH}/forgot-password/send-code`,
  FORGOT_VERIFY:`${AUTH}/forgot-password/verify-code`,
  FORGOT_RESET: `${AUTH}/forgot-password/reset`,
  VERIFIER_TELEPHONE: (tel: string) => `${AUTH}/verifier-telephone/${encodeURIComponent(tel)}`,
} as const;

// ── Patients ──────────────────────────────────────────────────────────────────
export const PATIENTS = {
  LIST:         `${API}/patients`,
  BY_CLINIQUE:  (cliniqueId: number | string) => `${API}/patients/clinique/${cliniqueId}`,
  INACTIFS_BY_CLINIQUE: (cliniqueId: number | string) =>
    `${API}/patients/clinique/${cliniqueId}/inactifs`,
  BY_SERVICE:   (serviceId: number | string)  => `${API}/patients/service/${serviceId}`,
  BY_NUMERO:    (numero: string)              => `${API}/patients/numero/${encodeURIComponent(numero)}`,
  BY_ID:        (id: number | string)         => `${API}/patients/${id}`,
  UPDATE:       (id: number | string)         => `${API}/patients/${id}`,
  REACTIVER:    (id: number | string)         => `${API}/patients/${id}/reactiver`,
  DELETE:       (id: number | string)         => `${API}/patients/${id}`,
  CREATE:       `${API}/patients`,
  VERIFIER_SECRETAIRE: (id: number | string)  => `${API}/patients/${id}/verifier-secretaire`,
} as const;

// ── Rendez-vous ───────────────────────────────────────────────────────────────
export const RDV = {
  LIST:              `${API}/rendez-vous`,
  CREATE:            `${API}/rendez-vous`,
  BY_CLINIQUE:       (id: number | string) => `${API}/rendez-vous/clinique/${id}`,
  BY_CLINIQUE_JOUR:  (id: number | string) => `${API}/rendez-vous/clinique/${id}/jour`,
  BY_MEDECIN:        (id: number | string) => `${API}/rendez-vous/medecin/${id}`,
  BY_MEDECIN_CLINIQUE: (medecinId: number | string, cliniqueId: number | string) =>
    `${API}/rendez-vous/medecin/${medecinId}/clinique/${cliniqueId}`,
  BY_MEDECIN_CABINET:(medecinId: number | string) =>
    `${API}/rendez-vous/medecin/${medecinId}/rdv-cabinet`,
  BY_PATIENT:        (id: number | string) => `${API}/rendez-vous/patient/${id}`,
  BY_ID:             (id: number | string) => `${API}/rendez-vous/${id}`,
  UPDATE:            (id: number | string) => `${API}/rendez-vous/${id}`,
  DELETE:            (id: number | string) => `${API}/rendez-vous/${id}`,
  CONFIRMER:         (id: number | string) => `${API}/rendez-vous/${id}/confirmer`,
  CONFIRMER_MEDECIN: (id: number | string) => `${API}/rendez-vous/${id}/confirmer-medecin`,
  ANNULER:           (id: number | string) => `${API}/rendez-vous/${id}/annuler`,
  REPORTER:          (id: number | string) => `${API}/rendez-vous/${id}/reporter`,
  VALIDATION_VISITE_INF: (id: number | string) => `${API}/rendez-vous/${id}/validation-visite-infirmier`,
} as const;

// ── Médecins ──────────────────────────────────────────────────────────────────
export const MEDECINS = {
  LIST:         `${API}/medecins`,
  BY_CLINIQUE:  (cliniqueId: number | string) => `${API}/medecins/clinique/${cliniqueId}`,
  BY_SPECIALITE:(specialite: string)          => `${API}/medecins/specialite/${encodeURIComponent(specialite)}`,
  BY_ID:        (id: number | string)         => `${API}/medecins/${id}`,
  CREATE:       `${API}/medecins`,
  UPDATE:       (id: number | string)         => `${API}/medecins/${id}`,
  DELETE:       (id: number | string)         => `${API}/medecins/${id}`,
  PATIENTS_ADD: (medecinId: number | string)  => `${API}/medecins/${medecinId}/patients`,
  PATIENTS_LIST:(medecinId: number | string)  => `${API}/medecins/${medecinId}/patients`,
  CABINETS:     `${API}/medecins/cabinets`,
  CABINETS_VERIFIER_CIN: (cin: string, telephone?: string) => {
    let url = `${API}/medecins/cabinets/verifier-cin?cin=${encodeURIComponent(cin.trim())}`;
    if (telephone?.trim()) {
      url += `&telephone=${encodeURIComponent(telephone.trim())}`;
    }
    return url;
  },
  CABINET_BY_ID:(id: number | string)         => `${API}/medecins/cabinets/${id}`,
} as const;

// ── Consultations ─────────────────────────────────────────────────────────────
export const CONSULTATIONS = {
  CREATE:      `${API}/consultations`,
  BY_PATIENT:  (id: number | string) => `${API}/consultations/patient/${id}`,
  BY_MEDECIN:  (id: number | string) => `${API}/consultations/medecin/${id}`,
  DIAGNOSTIC:  (id: number | string) => `${API}/consultations/${id}/diagnostic`,
} as const;

// ── Ordonnances ───────────────────────────────────────────────────────────────
export const ORDONNANCES = {
  CREATE:           `${API}/ordonnances`,
  BY_ID:            (id: number | string) => `${API}/ordonnances/${id}`,
  LIST:             `${API}/ordonnances`,
  BY_PATIENT:       (patientId: number | string) => `${API}/ordonnances?patientId=${patientId}`,
  BY_MEDECIN:       (medecinId: number | string) => `${API}/ordonnances?medecinId=${medecinId}`,
  ADD_MEDICAMENT:   (id: number | string) => `${API}/ordonnances/${id}/medicaments`,
  PDF:              (id: number | string) => `${API}/ordonnances/${id}/pdf`,
  SIGNER:           (id: number | string) => `${API}/ordonnances/${id}/signer`,
  VALIDER:          (id: number | string) => `${API}/ordonnances/${id}/valider`,
  DELETE:           (id: number | string) => `${API}/ordonnances/${id}`,
} as const;

// ── Imageries radiologiques ───────────────────────────────────────────────────
export const IMAGERIES = {
  DEMANDER:         `${API}/imageries/demander`,
  EN_ATTENTE:       `${API}/imageries/en-attente`,
  BY_RADIOLOGUE:    (id: number | string) => `${API}/imageries/radiologue/${id}`,
  BY_MEDECIN:       (id: number | string) => `${API}/imageries/medecin/${id}`,
  BY_PATIENT:       (id: number | string) => `${API}/imageries/patient/${id}`,
  BY_ID:            (id: number | string) => `${API}/imageries/${id}`,
  PRENDRE_EN_CHARGE:(id: number | string) => `${API}/imageries/${id}/prendre-en-charge`,
  TERMINER:         (id: number | string) => `${API}/imageries/${id}/terminer`,
} as const;

// ── Rapports imagerie ─────────────────────────────────────────────────────────
export const RAPPORTS = {
  CREATE:       `${API}/rapports-imagerie`,
  BY_IMAGERIE:  (id: number | string) => `${API}/rapports-imagerie/imagerie/${id}`,
  GET:          (id: number | string) => `${API}/rapports-imagerie/${id}`,
  BROUILLON:    (id: number | string) => `${API}/rapports-imagerie/${id}/brouillon`,
  VALIDER:      (id: number | string) => `${API}/rapports-imagerie/${id}/valider`,
  COMMENTER:    (id: number | string) => `${API}/rapports-imagerie/${id}/commenter`,
} as const;

// ── Messagerie interne ────────────────────────────────────────────────────────
export const MESSAGES = {
  CONTACTS:      (userId: number | string) =>
    `${API}/messages/contacts/${userId}`,
  CONVERSATION:  (userId: number | string, contactId: number | string) =>
    `${API}/messages/conversation/${userId}/${contactId}`,
  SEND:          `${API}/messages`,
  RECUS:         (userId: number | string) => `${API}/messages/recus/${userId}`,
  ENVOYES:       (userId: number | string) => `${API}/messages/envoyes/${userId}`,
  NON_LUS:       (userId: number | string) => `${API}/messages/non-lus/${userId}`,
  NON_LUS_COUNT: (userId: number | string) => `${API}/messages/non-lus/${userId}/count`,
  MARQUER_LUE:   (messageId: number | string) => `${API}/messages/${messageId}/lire`,
  DELETE:        (messageId: number | string) => `${API}/messages/${messageId}`,
} as const;

// ── Notifications ─────────────────────────────────────────────────────────────
export const NOTIFICATIONS = {
  LIST:       `${API}/notifications`,
  NON_LUES:   `${API}/notifications/non-lues`,
  AUJOURDHUI: `${API}/notifications/aujourdhui`,
  NON_LUES_COUNT: `${API}/notifications/non-lues/count`,
  LIRE:       (id: number | string) => `${API}/notifications/${id}/marquer-lue`,
  LIRE_TOUTES:`${API}/notifications/marquer-toutes-lues`,
  DELETE:     (id: number | string) => `${API}/notifications/${id}`,
  PUSH_TOKEN: `${API}/notifications/push-token`,
} as const;

// ── Personnel ─────────────────────────────────────────────────────────────────
export const PERSONNEL = {
  CREATE:      `${API}/personnel`,
  VERIFIER_TELEPHONE: (telephone: string, medecinExistantId?: string) => {
    let url = `${API}/personnel/verifier-telephone?telephone=${encodeURIComponent(telephone)}`;
    if (medecinExistantId?.trim()) {
      url += `&medecinExistantId=${encodeURIComponent(medecinExistantId.trim())}`;
    }
    return url;
  },
  MEDECINS_RECHERCHE_RATTACHEMENT: (q: string, cin?: string) => {
    let url = `${API}/personnel/medecins/recherche-rattachement?q=${encodeURIComponent(q)}`;
    if (cin?.trim()) url += `&cin=${encodeURIComponent(cin.trim())}`;
    return url;
  },
  MEDECINS:    `${API}/personnel/medecins`,
  MEDECIN_BY_ID: (id: number | string) => `${API}/personnel/medecins/${id}`,
  MEDECIN_REACTIVER: (id: number | string) => `${API}/personnel/medecins/${id}/reactiver`,
  INFIRMIERS:  `${API}/personnel/infirmiers`,
  INFIRMIER_BY_ID: (id: number | string) => `${API}/personnel/infirmiers/${id}`,
  INFIRMIER_REACTIVER: (id: number | string) => `${API}/personnel/infirmiers/${id}/reactiver`,
  RADIOLOGUES: `${API}/personnel/radiologues`,
  RADIOLOGUE_BY_ID: (id: number | string) => `${API}/personnel/radiologues/${id}`,
  RADIOLOGUE_REACTIVER: (id: number | string) => `${API}/personnel/radiologues/${id}/reactiver`,
  PHARMACIENS: `${API}/personnel/pharmaciens`,
  PHARMACIEN_BY_ID: (id: number | string) => `${API}/personnel/pharmaciens/${id}`,
  PHARMACIEN_REACTIVER: (id: number | string) => `${API}/personnel/pharmaciens/${id}/reactiver`,
  SECRETAIRES: `${API}/personnel/secretaires`,
  SECRETAIRE_BY_ID: (id: number | string) => `${API}/personnel/secretaires/${id}`,
  SECRETAIRE_REACTIVER: (id: number | string) => `${API}/personnel/secretaires/${id}/reactiver`,
  CHEFS:       `${API}/personnel/chefs-personnel`,
  CHEF_BY_ID:  (id: number | string) => `${API}/personnel/chefs-personnel/${id}`,
  CHEF_REACTIVER: (id: number | string) => `${API}/personnel/chefs-personnel/${id}/reactiver`,
  TECHNICIENS: `${API}/personnel/techniciens-maintenance`,
  TECHNICIEN_BY_ID: (id: number | string) => `${API}/personnel/techniciens-maintenance/${id}`,
  TECHNICIEN_REACTIVER: (id: number | string) => `${API}/personnel/techniciens-maintenance/${id}/reactiver`,
} as const;

// ── Cliniques ─────────────────────────────────────────────────────────────────
export const CLINIQUES = {
  LIST:             `${API}/cliniques`,
  ACTIVES:          `${API}/cliniques/actives`,
  CREATE_AVEC_ADMIN:`${API}/cliniques/avec-administrateur`,
  BY_ID:            (id: number | string) => `${API}/cliniques/${id}`,
  UPDATE:           (id: number | string) => `${API}/cliniques/${id}`,
  DELETE:           (id: number | string) => `${API}/cliniques/${id}`,
  OCCUPATION:       (id: number | string) => `${API}/cliniques/${id}/occupation`,
  VERIFIER_ADMIN_TEL: (tel: string) => `${API}/cliniques/admin/verifier-telephone/${encodeURIComponent(tel)}`,
  ENREGISTRER_ADMIN: `${API}/cliniques/admin/enregistrer`,
  MEDECINS_RECHERCHER: (cliniqueId: number | string) => `${API}/cliniques/${cliniqueId}/medecins/rechercher`,
  MEDECINS_RATTACHER: (cliniqueId: number | string) => `${API}/cliniques/${cliniqueId}/medecins`,
} as const;

// ── Administrateurs clinique ──────────────────────────────────────────────────
export const ADMINS = {
  LIST:           `${API}/administrateurs-clinique`,
  CREATE:         `${API}/administrateurs-clinique`,
  BY_ID:          (id: number | string) => `${API}/administrateurs-clinique/${id}`,
  BY_CLINIQUE:    (cliniqueId: number | string) => `${API}/administrateurs-clinique/clinique/${cliniqueId}`,
  BY_CLINIQUE_ACTIFS: (cliniqueId: number | string) => `${API}/administrateurs-clinique/clinique/${cliniqueId}/actifs`,
  BY_TELEPHONE:   (tel: string) => `${API}/administrateurs-clinique/telephone/${encodeURIComponent(tel)}`,
  UPDATE:         (id: number | string) => `${API}/administrateurs-clinique/${id}`,
  DELETE:         (id: number | string) => `${API}/administrateurs-clinique/${id}`,
  DESACTIVER:     (id: number | string) => `${API}/administrateurs-clinique/${id}/desactiver`,
  ACTIVER:        (id: number | string) => `${API}/administrateurs-clinique/${id}/activer`,
} as const;

// ── Chambres ──────────────────────────────────────────────────────────────────
export const CHAMBRES = {
  LIST:           `${API}/chambres`,
  BY_CLINIQUE:    (cliniqueId: string | number) => `${API}/chambres/clinique/${cliniqueId}`,
  BY_ID:          (id: string | number) => `${API}/chambres/${id}`,
  DISPONIBLES:    `${API}/chambres/disponibles`,
  CREATE:         `${API}/chambres`,
  CREATE_MULTIPLE:`${API}/chambres/multiple`,
  UPDATE:         (id: string | number) => `${API}/chambres/${id}`,
  DELETE:         (id: string | number) => `${API}/chambres/${id}`,
} as const;

// ── Services médicaux ─────────────────────────────────────────────────────────
export const SERVICES = {
  LIST:         `${API}/services`,
  BY_CLINIQUE:  (cliniqueId: number | string) => `${API}/services/clinique/${cliniqueId}`,
  BY_CLINIQUE_ACTIFS: (cliniqueId: number | string) => `${API}/services/clinique/${cliniqueId}/actifs`,
  BY_ID:        (id: number | string) => `${API}/services/${id}`,
  CREATE:       `${API}/services`,
  UPDATE:       (id: number | string) => `${API}/services/${id}`,
  DELETE:       (id: number | string) => `${API}/services/${id}`,
} as const;

// ── Alertes ───────────────────────────────────────────────────────────────────
export const ALERTES = {
  URGENCE:  `${API}/alertes/urgence`,
  MATERIEL: `${API}/alertes/manque-materiel`,
} as const;

// ── Administrations traitement (infirmier) ────────────────────────────────────
export const ADMINISTRATIONS = {
  CREATE:               `${API}/administrations`,
  CREATE_PLANNING:      `${API}/administrations/planning`,
  BY_PATIENT:           (id: number | string) => `${API}/administrations/patient/${id}`,
  BY_PATIENT_AUJOURDHUI:(id: number | string) => `${API}/administrations/patient/${id}/aujourd-hui`,
  BY_PATIENT_A_VENIR:   (id: number | string) => `${API}/administrations/patient/${id}/a-venir`,
  BY_PATIENT_NON_ADM:   (id: number | string) => `${API}/administrations/patient/${id}/non-administres`,
  BY_PATIENT_TYPE:      (id: number | string, type: string) => `${API}/administrations/patient/${id}/type/${type}`,
  BY_INFIRMIER:         (id: number | string) => `${API}/administrations/infirmier/${id}`,
  BY_ID:                (id: number | string) => `${API}/administrations/${id}`,
  ADMINISTRER:          (id: number | string) => `${API}/administrations/${id}/administrer`,
  VALIDATION_MEDECIN:   (id: number | string) => `${API}/administrations/${id}/validation-medecin`,
  STATUT_EXECUTION:     (id: number | string) => `${API}/administrations/${id}/statut-execution`,
  PRIORITE_URGENTE:     (id: number | string) => `${API}/administrations/${id}/priorite-urgente`,
  PIECE_JOINTE:         (id: number | string) => `${API}/administrations/${id}/piece-jointe`,
  UPDATE:               (id: number | string) => `${API}/administrations/${id}`,
  DELETE:               (id: number | string) => `${API}/administrations/${id}`,
} as const;

// ── Constantes vitales ────────────────────────────────────────────────────────
export const CONSTANTES = {
  CREATE:     `${API}/constantes-vitales`,
  BY_PATIENT: (id: string | number) => `${API}/constantes-vitales/patient/${id}`,
  HISTORIQUE: (id: string | number) => `${API}/constantes-vitales/patient/${id}/historique`,
} as const;

// ── Upload fichier ────────────────────────────────────────────────────────────
export const UPLOAD = `${API}/upload` as const;

// ── Équipements ───────────────────────────────────────────────────────────────
export const EQUIPEMENTS = {
  LIST:         `${API}/equipements`,
  BY_ID:        (id: string | number) => `${API}/equipements/${id}`,
  BY_CODE:      (code: string) => `${API}/equipements/code/${encodeURIComponent(code)}`,
  BY_CLINIQUE:  (cliniqueId: string | number) => `${API}/equipements/clinique/${cliniqueId}`,
  BY_CHAMBRE:   (chambreId: string | number) => `${API}/equipements/chambre/${chambreId}`,
  CREATE:       `${API}/equipements`,
  UPDATE:       (id: string | number) => `${API}/equipements/${id}`,
  DELETE:       (id: string | number) => `${API}/equipements/${id}`,
  RECHERCHER:   `${API}/equipements/rechercher`,
  DISPONIBLES:  `${API}/equipements/disponibles`,
  BY_CATEGORIE: (cat: string) => `${API}/equipements/categorie/${encodeURIComponent(cat)}`,
  BY_ETAT:      (etat: string) => `${API}/equipements/etat-technique/${encodeURIComponent(etat)}`,
  BY_STATUT:    (statut: string) => `${API}/equipements/statut/${encodeURIComponent(statut)}`,
  CHANGER_ETAT: (id: string, etat: string) => `${API}/equipements/${id}/etat-technique/${encodeURIComponent(etat)}`,
  CHANGER_STATUT: (id: string, statut: string) => `${API}/equipements/${id}/statut/${encodeURIComponent(statut)}`,
  TRAITER_PANNE: (id: string) => `${API}/equipements/${id}/traiter-panne`,
} as const;

// ── Technicien maintenance ────────────────────────────────────────────────────
export const TECHNICIEN_MAINTENANCE = {
  EQUIPEMENTS:        `${API}/technicien-maintenance/equipements`,
  EQUIPEMENTS_EN_PANNE: `${API}/technicien-maintenance/equipements/en-panne`,
  EQUIPEMENT_BY_ID:   (id: string | number) => `${API}/technicien-maintenance/equipements/${id}`,
  ALERTE_EMAIL:       (equipementId: string | number) => `${API}/technicien-maintenance/equipements/${equipementId}/alerte-email`,
  TRAITER_PANNE:      (equipementId: string | number) => `${API}/technicien-maintenance/equipements/${equipementId}/traiter-panne`,
} as const;

// ── Surveillances infirmières ─────────────────────────────────────────────────
export const SURVEILLANCES = {
  CREATE:                  `${API}/surveillances`,
  BY_PATIENT:              (patientId: string | number) => `${API}/surveillances/patient/${patientId}`,
  BY_PATIENT_AUJOURD_HUI:  (patientId: string | number) => `${API}/surveillances/patient/${patientId}/aujourd-hui`,
  BY_PATIENT_DERNIERE:     (patientId: string | number) => `${API}/surveillances/patient/${patientId}/derniere`,
  BY_PATIENT_ALERTES:      (patientId: string | number) => `${API}/surveillances/patient/${patientId}/alertes`,
  BY_PATIENT_PERIODE:      (patientId: string | number) => `${API}/surveillances/patient/${patientId}/periode`,
  BY_INFIRMIER:            (infirmierId: string | number) => `${API}/surveillances/infirmier/${infirmierId}`,
  BY_ID:                   (id: string | number) => `${API}/surveillances/${id}`,
  UPDATE:                  (id: string | number) => `${API}/surveillances/${id}`,
  DELETE:                  (id: string | number) => `${API}/surveillances/${id}`,
  ALERTES_TOUTES:          `${API}/surveillances/alertes/toutes`,
  STATS_PATIENT:           (patientId: string | number) => `${API}/surveillances/stats/patient/${patientId}`,
  STATS_GLOBALES:          `${API}/surveillances/stats/globales`,
} as const;

// ── Absences ──────────────────────────────────────────────────────────────────
export const ABSENCES = {
  CREATE:       `${API}/absences`,
  DEMANDE:      `${API}/absences/demande`,
  LIST:         `${API}/absences`,
  BY_ID:        (id: string | number) => `${API}/absences/${id}`,
  BY_INFIRMIER: (infirmierId: string | number) => `${API}/absences/infirmier/${infirmierId}`,
  EN_ATTENTE:   `${API}/absences/en-attente`,
  APPROUVER:    (id: string | number) => `${API}/absences/${id}/approuver`,
  REFUSER:      (id: string | number) => `${API}/absences/${id}/refuser`,
  DELETE:       (id: string | number) => `${API}/absences/${id}`,
} as const;

// ── Gardes ────────────────────────────────────────────────────────────────────
export const GARDES = {
  SHIFT_JOUR:       `${API}/gardes/shift-jour`,
  GARDE_NUIT:       `${API}/gardes/garde-nuit`,
  HEBDO_MATIN:      `${API}/gardes/hebdomadaire-matin`,
  HEBDO_APRES_MIDI: `${API}/gardes/hebdomadaire-apres-midi`,
  LIST:             `${API}/gardes`,
  BY_ID:            (id: string | number) => `${API}/gardes/${id}`,
  BY_UTILISATEUR:   (utilisateurId: string | number) => `${API}/gardes/utilisateur/${utilisateurId}`,
  BY_TYPE:          (type: string) => `${API}/gardes/type/${encodeURIComponent(type)}`,
  BY_PLANNING:      (planningId: string | number) => `${API}/gardes/planning/${planningId}`,
  PDF_UTILISATEUR:  (utilisateurId: string | number, debut: string, fin: string) =>
    `${API}/gardes/utilisateur/${utilisateurId}/pdf?debut=${encodeURIComponent(debut)}&fin=${encodeURIComponent(fin)}`,
  UPDATE:           (id: string | number) => `${API}/gardes/${id}`,
  DELETE:           (id: string | number) => `${API}/gardes/${id}`,
} as const;

// ── Plannings ─────────────────────────────────────────────────────────────────
export const PLANNINGS = {
  CREATE_HEBDO:       `${API}/plannings/hebdomadaire`,
  CREATE_MENSUEL:     `${API}/plannings/mensuel`,
  LIST:               `${API}/plannings`,
  BY_ID:              (id: string | number) => `${API}/plannings/${id}`,
  PDF:                (id: string | number, params?: { serviceId?: string; utilisateurId?: string }) => {
    let url = `${API}/plannings/${id}/pdf`;
    const q = new URLSearchParams();
    if (params?.serviceId) q.set('serviceId', params.serviceId);
    if (params?.utilisateurId) q.set('utilisateurId', params.utilisateurId);
    const qs = q.toString();
    return qs ? `${url}?${qs}` : url;
  },
  BY_PERIODE:         (debut: string, fin: string) =>
    `${API}/plannings/periode?debut=${encodeURIComponent(debut)}&fin=${encodeURIComponent(fin)}`,
  BY_UTILISATEUR:     (utilisateurId: string | number) => `${API}/plannings/utilisateur/${utilisateurId}`,
  BY_TYPE:            (type: string) => `${API}/plannings/type/${encodeURIComponent(type)}`,
  VALIDER:            (id: string | number) => `${API}/plannings/${id}/valider`,
  INVALIDER:          (id: string | number) => `${API}/plannings/${id}/invalider`,
  ADD_UTILISATEUR:    (planningId: string | number, utilisateurId: string | number) =>
    `${API}/plannings/${planningId}/utilisateur/${utilisateurId}`,
  REMOVE_UTILISATEUR: (planningId: string | number, utilisateurId: string | number) =>
    `${API}/plannings/${planningId}/utilisateur/${utilisateurId}`,
  DELETE:             (id: string | number) => `${API}/plannings/${id}`,
} as const;

// ── Workspace Médecin ─────────────────────────────────────────────────────────
export const MEDECIN_WORKSPACE = {
  STATISTIQUES: (medecinId: string | number) => `${API}/medecins/${medecinId}/workspace/statistiques`,
  INFIRMIERS:   (medecinId: string | number) => `${API}/medecins/${medecinId}/workspace/infirmiers`,
  SOINS_SUIVI:  (medecinId: string | number) => `${API}/medecins/${medecinId}/workspace/soins-suivi`,
} as const;

// ── Workspace Infirmier ───────────────────────────────────────────────────────
export const INFIRMIER_WORKSPACE = {
  RAPPORT_FIN_JOURNEE: (infirmierId: string | number) =>
    `${API}/infirmiers/${infirmierId}/workspace/rapport-fin-journee`,
  SIGNALEMENT_MEDECIN: (infirmierId: string | number) =>
    `${API}/infirmiers/${infirmierId}/workspace/signalement-medecin`,
} as const;

// ── Workspace Radiologue ──────────────────────────────────────────────────────
export const RADIOLOGUE_WORKSPACE = {
  STATS: `${API}/radiologue/workspace/stats`,
} as const;

// ── Hospitalisations ──────────────────────────────────────────────────────────
export const HOSPITALISATIONS = {
  LIST:        `${API}/hospitalisations`,
  EN_COURS:    `${API}/hospitalisations/en-cours`,
  BY_PATIENT:  (patientId: string | number) => `${API}/hospitalisations/patient/${patientId}`,
  BY_ID:       (id: string | number)        => `${API}/hospitalisations/${id}`,
  CREATE:      `${API}/hospitalisations`,
  UPDATE:      (id: string | number)        => `${API}/hospitalisations/${id}`,
  TERMINER:    (id: string | number)        => `${API}/hospitalisations/${id}/terminer`,
  NOTES:       (id: string | number)        => `${API}/hospitalisations/${id}/notes`,
  CREATE_NOTE: (id: string | number)        => `${API}/hospitalisations/${id}/notes`,
} as const;

// ── Congés médecin ────────────────────────────────────────────────────────────
export const CONGES_MEDECIN = {
  CREATE:         `${API}/conges-medecin`,
  BY_MEDECIN:     (medecinId: string | number) => `${API}/conges-medecin/medecin/${medecinId}`,
  DISPONIBLES:    `${API}/conges-medecin/disponibles`,
  CHANGER_STATUT: (id: string | number) => `${API}/conges-medecin/${id}/statut`,
  DELETE:         (id: string | number) => `${API}/conges-medecin/${id}`,
} as const;

// ── Demandes opération ────────────────────────────────────────────────────────
export const DEMANDES_OPERATION = {
  CREATE:        `${API}/demandes-operation`,
  LIST:          `${API}/demandes-operation`,
  BY_ID:         (id: string | number) => `${API}/demandes-operation/${id}`,
  STATUT:        (id: string | number) => `${API}/demandes-operation/${id}/statut`,
  PLAN:          (id: string | number) => `${API}/demandes-operation/${id}/plan`,
  COMPTE_RENDU:  (id: string | number) => `${API}/demandes-operation/${id}/compte-rendu`,
} as const;

// ── Demandes médicament ───────────────────────────────────────────────────────
export const DEMANDES_MEDICAMENT = {
  CREATE:    `${API}/demandes-medicament`,
  EN_ATTENTE:`${API}/demandes-medicament/en-attente`,
  LIST:      `${API}/demandes-medicament`,
  BY_ID:     (id: string | number) => `${API}/demandes-medicament/${id}`,
  STATUT:    (id: string | number) => `${API}/demandes-medicament/${id}/statut`,
} as const;

// ── Urgences ──────────────────────────────────────────────────────────────────
export const URGENCES = {
  CREATE:            `${API}/urgences`,
  ACTIVES:           `${API}/urgences/actives`,
  EN_ATTENTE:        `${API}/urgences/en-attente`,
  BY_PATIENT:        (patientId: string | number) => `${API}/urgences/patient/${patientId}`,
  BY_MEDECIN:        (medecinId: string | number) => `${API}/urgences/medecin/${medecinId}`,
  BY_ID:             (id: string | number) => `${API}/urgences/${id}`,
  PRENDRE_EN_CHARGE: (id: string | number) => `${API}/urgences/${id}/prendre-en-charge`,
  TRAITER:           (id: string | number) => `${API}/urgences/${id}/traiter`,
  RESOUDRE:          (id: string | number) => `${API}/urgences/${id}/resoudre`,
} as const;

// ── Médicaments ───────────────────────────────────────────────────────────────
export const MEDICAMENTS = {
  LIST:       `${API}/medicaments`,
  BY_ID:      (id: string | number) => `${API}/medicaments/${id}`,
  CREATE:     `${API}/medicaments`,
  UPDATE:     (id: string | number) => `${API}/medicaments/${id}`,
  DELETE:     (id: string | number) => `${API}/medicaments/${id}`,
  RECHERCHE:  `${API}/medicaments/recherche`,
} as const;

// ── Pharmacie / Stocks ────────────────────────────────────────────────────────
export const STOCKS = {
  LIST:       `${API}/stocks`,
  CREATE:     `${API}/stocks`,
  BY_CLINIQUE:(cliniqueId: string | number) => `${API}/stocks/clinique/${cliniqueId}`,
  BAS:        `${API}/stocks/bas`,
  BY_ID:      (id: string | number) => `${API}/stocks/${id}`,
  UPDATE:     (id: string | number) => `${API}/stocks/${id}`,
  DELETE:     (id: string | number) => `${API}/stocks/${id}`,
  ENTREE:     (id: string | number) => `${API}/stocks/${id}/entree`,
  SORTIE:     (id: string | number) => `${API}/stocks/${id}/sortie`,
  ALERTE_EMAIL: (id: string | number) => `${API}/stocks/${id}/alerte-email`,
} as const;

// ── Maintenances ──────────────────────────────────────────────────────────────
export const MAINTENANCES = {
  LIST:       `${API}/maintenances`,
  BY_ID:      (id: string | number) => `${API}/maintenances/${id}`,
  BY_EQUIPEMENT: (eqId: string | number) => `${API}/maintenances/equipement/${eqId}`,
  BY_TECHNICIEN: (techId: string | number) => `${API}/maintenances/technicien/${techId}`,
  CREATE:     `${API}/maintenances`,
  PLANIFIER:  `${API}/maintenances/planifier`,
  UPDATE:     (id: string | number) => `${API}/maintenances/${id}`,
  EFFECTUER:  (id: string | number) => `${API}/maintenances/${id}/effectuer`,
  CHANGER_STATUT: (id: string | number) => `${API}/maintenances/${id}/statut`,
  DELETE:     (id: string | number) => `${API}/maintenances/${id}`,
} as const;

// ── Billing ───────────────────────────────────────────────────────────────────
export const BILLING = {
  OFFRES:               `${API}/billing/offres`,
  OFFRES_ACTIVES:       `${API}/billing/offres/actives`,
  OFFRES_ACTIVES_CABINET: `${API}/billing/offres/actives-cabinet`,
  CREATE_OFFRE:         `${API}/billing/offres`,
  UPDATE_OFFRE:         (id: string | number) => `${API}/billing/offres/${id}`,
  DELETE_OFFRE:         (id: string | number) => `${API}/billing/offres/${id}`,
  SYNC_STRIPE:          (id: string | number) => `${API}/billing/offres/${id}/sync-stripe`,
  CHECKOUT:             `${API}/billing/checkout`,
  CONFIRM_CHECKOUT:     `${API}/billing/confirm-checkout`,
  SOUSCRIPTION_SIMULEE: `${API}/billing/souscription-simulee`,
  ABONNEMENT_COURANT:   `${API}/billing/abonnement-courant`,
  ABONNEMENTS_ACTIFS:   `${API}/billing/abonnements/actifs`,
  ABONNEMENTS_PAYES:    `${API}/billing/abonnements/payes`,
  HISTORIQUE:           `${API}/billing/abonnements/historique`,
  SMS_QUOTA:            `${API}/billing/sms-quota`,
  SMS_QUOTA_CLINIQUE:   (cliniqueId: string | number) =>
    `${API}/billing/clinique/${cliniqueId}/sms-quota`,
  STRIPE_CONFIG:        `${API}/billing/stripe-config`,
} as const;

// ── Préférences notifications ─────────────────────────────────────────────────
export const PREFERENCES_NOTIFICATIONS = {
  GET:        (userId: string | number) => `${API}/preferences-notifications/${userId}`,
  UPDATE:     (userId: string | number) => `${API}/preferences-notifications/${userId}`,
  ACTIVER_TOUS:   (userId: string | number) => `${API}/preferences-notifications/${userId}/activer-tous`,
  DESACTIVER_TOUS:(userId: string | number) => `${API}/preferences-notifications/${userId}/desactiver-tous`,
} as const;

// ── Presences ─────────────────────────────────────────────────────────────────
export const PRESENCES = {
  MARQUER_PRESENCE:   `${API}/presences/marquer-presence`,
  MARQUER_ABSENCE:    `${API}/presences/marquer-absence`,
  MARQUER_MULTIPLES:  `${API}/presences/marquer-multiples`,
  ENREGISTRER_DEPART: (id: string | number) => `${API}/presences/${id}/depart`,
  LIST:               `${API}/presences`,
  AUJOURDHUI:         `${API}/presences/aujourdhui`,
  ABSENCES_JOUR:      `${API}/presences/absences-jour`,
  RETARDS_JOUR:       `${API}/presences/retards-jour`,
  BY_INFIRMIER:       (infirmierId: string | number) => `${API}/presences/infirmier/${infirmierId}`,
  PERIODE:            `${API}/presences/periode`,
} as const;

// ── Dossiers médicaux ─────────────────────────────────────────────────────────
export const DOSSIERS = {
  BY_PATIENT: (patientId: string | number) => `${API}/dossiers-medicaux/patient/${patientId}`,
  BY_ID:      (id: string | number) => `${API}/dossiers-medicaux/${id}`,
  UPDATE:     (id: string | number) => `${API}/dossiers-medicaux/${id}`,
  NOTES_CONF: (id: string | number) => `${API}/dossiers-medicaux/${id}/notes-confidentielles`,
} as const;

// ── Facturation patient (CNAM, sortie, PDF) ───────────────────────────────────
export const FACTURATION_PATIENT = {
  PRESTATIONS: (cliniqueId: string | number, inclureInactives = false) => {
    const base = `${API}/facturation-patient/prestations/clinique/${cliniqueId}`;
    return inclureInactives ? `${base}?inclureInactives=true` : base;
  },
  INIT_CATALOGUE: (cliniqueId: string | number) =>
    `${API}/facturation-patient/prestations/clinique/${cliniqueId}/initialiser`,
  UPDATE_PRESTATION: (id: string | number) =>
    `${API}/facturation-patient/prestations/${id}`,
  PAR_CLINIQUE: (cliniqueId: string | number, statut?: string) => {
    const base = `${API}/facturation-patient/clinique/${cliniqueId}`;
    return statut ? `${base}?statut=${encodeURIComponent(statut)}` : base;
  },
  BY_ID: (id: string | number) => `${API}/facturation-patient/${id}`,
  GENERER: `${API}/facturation-patient/generer`,
  EMETTRE: (id: string | number) => `${API}/facturation-patient/${id}/emettre`,
  VALIDER_PAIEMENT: (id: string | number) => `${API}/facturation-patient/${id}/valider-paiement`,
  TELETRANSMETTRE: (id: string | number) => `${API}/facturation-patient/${id}/teletransmettre`,
  PDF: (id: string | number) => `${API}/facturation-patient/${id}/pdf`,
} as const;

// ── SSPI (surveillance post-interventionnelle) ───────────────────────────────
export const SSPI = {
  POST_MESURE:  `${API}/sspi/mesures`,
  GET_MESURES:  (operationId: string) => `${API}/sspi/mesures/${operationId}`,
  POST_ALDRETE: `${API}/sspi/aldrete`,
  GET_ALDRETE:  (operationId: string) => `${API}/sspi/aldrete/${operationId}`,
} as const;

// ── Check-list HAS ────────────────────────────────────────────────────────────
export const CHECK_LIST = {
  CREATE:       `${API}/check-lists`,
  BY_OPERATION: (operationId: string) => `${API}/check-lists/${operationId}`,
  UPDATE_ITEM:  (checkListId: string, itemId: string) =>
    `${API}/check-lists/${checkListId}/items/${itemId}`,
  VALIDER:      (checkListId: string) => `${API}/check-lists/${checkListId}/valider`,
} as const;

// ── Transmissions infirmières ─────────────────────────────────────────────────
export const TRANSMISSIONS = {
  CREATE:       `${API}/transmissions`,
  BY_PATIENT:   (patientId: string) => `${API}/transmissions/patient/${patientId}`,
  BY_INFIRMIER: (infirmierId: string) => `${API}/transmissions/infirmier/${infirmierId}`,
} as const;

// ── Re-exports groupés ────────────────────────────────────────────────────────
export { AUTH_ENDPOINTS as AUTH };
