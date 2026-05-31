package com.pfe.pfe.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.NotificationUtilisateurDTO;
import com.pfe.pfe.model.NotificationUtilisateur;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service métier des notifications : crée les notifications selon les scénarios
 * par rôle (Super Admin, Admin Clinique, Médecin, Technicien, Patient, Logistique).
 * À appeler depuis les autres services (PersonnelService, etc.) lorsque les événements se produisent.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationMetierService {

    public static final String CODE_MODIFICATION_CLINIQUE = "MODIFICATION_CLINIQUE";
    public static final String CODE_LICENCE_EXPIRATION = "LICENCE_EXPIRATION";
    public static final String CODE_LICENCE_ACTIVATION = "LICENCE_ACTIVATION";
    public static final String CODE_LICENCE_MODIFIEE = "LICENCE_MODIFIEE";
    public static final String CODE_CREATION_ADMIN_MEDECIN = "CREATION_ADMIN_MEDECIN";
    public static final String CODE_ACTIVATION_COMPTE = "ACTIVATION_COMPTE";
    public static final String CODE_CREATION_COMPTE_MEDECIN = "CREATION_COMPTE_MEDECIN";
    public static final String CODE_APPAREIL_PANNE = "APPAREIL_PANNE";
    public static final String CODE_STOCK_FAIBLE = "STOCK_FAIBLE";
    public static final String CODE_INCIDENTS_SECURITE = "INCIDENTS_SECURITE";
    public static final String CODE_SERVICE_AJOUT_MODIF = "SERVICE_AJOUT_MODIF";
    public static final String CODE_COMPTE_ACTIVE = "COMPTE_ACTIVE";
    public static final String CODE_CHAMBRES_MAJ = "CHAMBRES_MAJ";
    public static final String CODE_NOUVEAU_RDV = "NOUVEAU_RDV";
    public static final String CODE_DOSSIER_PATIENT_ASSIGNE = "DOSSIER_PATIENT_ASSIGNE";
    public static final String CODE_RESULTAT_RADIO = "RESULTAT_RADIO";
    /** Demande d'imagerie marquée urgente / haute priorité (médecin → radiologues de la clinique). */
    public static final String CODE_DEMANDE_IMAGERIE_PRIORITAIRE = "DEMANDE_IMAGERIE_PRIORITAIRE";
    public static final String CODE_URGENCE_INFIRMIER = "URGENCE_INFIRMIER";
    public static final String CODE_HOSPITALISATION_MAJ = "HOSPITALISATION_MAJ";
    public static final String CODE_CONSULTATION_REMPLIE = "CONSULTATION_REMPLIE";
    public static final String CODE_DIAGNOSTIC_AJOUTE = "DIAGNOSTIC_AJOUTE";
    public static final String CODE_HOSPITALISATION_PROGRAMMEE = "HOSPITALISATION_PROGRAMMEE";
    public static final String CODE_ORDONNANCE_PDF = "ORDONNANCE_PDF";
    public static final String CODE_DEMANDE_MAINTENANCE = "DEMANDE_MAINTENANCE";
    public static final String CODE_APPAREIL_CRITIQUE = "APPAREIL_CRITIQUE";
    public static final String CODE_MAINTENANCE_PLANIFIEE = "MAINTENANCE_PLANIFIEE";
    public static final String CODE_EQUIPEMENT_REPARE = "EQUIPEMENT_REPARE";
    public static final String CODE_PANNE_CRITIQUE = "PANNE_CRITIQUE";
    public static final String CODE_INSCRIPTION_CONFIRMEE = "INSCRIPTION_CONFIRMEE";
    public static final String CODE_RDV_VALIDE = "RDV_VALIDE";
    public static final String CODE_RESULTATS_DISPONIBLES = "RESULTATS_DISPONIBLES";
    public static final String CODE_NOUVELLE_ORDONNANCE = "NOUVELLE_ORDONNANCE";
    public static final String CODE_RAPPEL_MEDICAMENT = "RAPPEL_MEDICAMENT";
    public static final String CODE_COMMANDE_MEDICAMENTS_PRETE = "COMMANDE_MEDICAMENTS_PRETE";
    public static final String CODE_ALERTE_TRAITEMENT = "ALERTE_TRAITEMENT";
    public static final String CODE_MANQUE_MATERIEL = "MANQUE_MATERIEL";
    public static final String CODE_DEMANDE_APPROVISIONNEMENT = "DEMANDE_APPROVISIONNEMENT";
    public static final String CODE_STOCK_MAJ = "STOCK_MAJ";
    public static final String CODE_COMMANDE_VALIDEE = "COMMANDE_VALIDEE";
    public static final String CODE_TACHE_SOIN_ASSIGNEE = "TACHE_SOIN_ASSIGNEE";
    public static final String CODE_VALIDATION_SOIN_MEDECIN = "VALIDATION_SOIN_MEDECIN";
    public static final String CODE_SOIN_MIS_A_JOUR = "SOIN_MIS_A_JOUR";
    public static final String CODE_RAPPORT_INFIRMIER_JOUR = "RAPPORT_INFIRMIER_JOUR";
    public static final String CODE_SIGNALEMENT_INFIRMIER = "SIGNALEMENT_INFIRMIER";

    private final NotificationUtilisateurService notificationUtilisateurService;

    private NotificationUtilisateurDTO creer(Long destinataireId, String destinataireIdStr, String destinataireType,
                                             String code, String titre, String message,
                                             NotificationUtilisateur.TypeNotification type,
                                             Long referenceId, String referenceType, String actionUrl) {
        return notificationUtilisateurService.creerNotificationMetier(
                destinataireId, destinataireIdStr, destinataireType, code, titre, message,
                type, referenceId, referenceType, actionUrl);
    }

    // ---- Super Administrateur (génère) ----

    /** Lorsque le Super Admin crée un administrateur → l'administrateur reçoit une notification d'activation. */
    @Transactional
    public void notifyAdministrateurActivation(Long adminId, String adminIdStr, String nomClinique) {
        String titre = "Compte activé";
        String message = "Votre compte administrateur de clinique a été créé" + (nomClinique != null ? " pour " + nomClinique : "") + ". Vous pouvez vous connecter.";
        creer(adminId, adminIdStr, "ADMIN_CLINIQUE", CODE_ACTIVATION_COMPTE, titre, message,
                NotificationUtilisateur.TypeNotification.SUCCESS, null, "ADMIN_CLINIQUE", "/login");
        log.info("Notification d'activation envoyée à l'administrateur {}", adminId != null ? adminId : adminIdStr);
    }

    /** Lorsque le Super Admin crée un médecin → le médecin reçoit une notification de création de compte. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyMedecinCreationCompte(Long medecinId, String medecinIdStr, String nomClinique) {
        String titre = "Création de votre compte médecin";
        String message = "Un compte médecin a été créé pour vous" + (nomClinique != null ? " au sein de " + nomClinique : "") + ". Complétez votre inscription pour activer votre accès.";
        creer(medecinId, medecinIdStr, "MEDECIN", CODE_CREATION_COMPTE_MEDECIN, titre, message,
                NotificationUtilisateur.TypeNotification.INFO, null, "MEDECIN", "/login");
        log.info("Notification de création de compte envoyée au médecin {}", medecinId != null ? medecinId : medecinIdStr);
    }

    // ---- Super Admin (reçoit) : à appeler depuis CliniqueService ----

    /** Notifier le Super Admin d'une modification critique de clinique (destinataire = id Super Admin, si connu). */
    @Transactional
    public void notifySuperAdminModificationClinique(Long superAdminId, String titre, String message, String cliniqueId) {
        creer(superAdminId, null, "SUPER_ADMIN", CODE_MODIFICATION_CLINIQUE, titre, message,
                NotificationUtilisateur.TypeNotification.WARNING, null, "CLINIQUE", "/clinique");
    }

    /** Notifier le Super Admin de la création d'un nouvel admin ou médecin. */
    @Transactional
    public void notifySuperAdminCreationAdminOuMedecin(Long superAdminId, String titre, String message) {
        creer(superAdminId, null, "SUPER_ADMIN", CODE_CREATION_ADMIN_MEDECIN, titre, message,
                NotificationUtilisateur.TypeNotification.INFO, null, null, "/administrateurs");
    }

    // ---- Administrateur de Clinique (reçoit) ----

    @Transactional
    public void notifyAdminCliniqueAppareilEnPanne(Long adminId, String adminIdStr, String equipementNom, Long equipementId) {
        String titre = "Appareil en panne";
        String message = "Un appareil a été signalé en panne : " + (equipementNom != null ? equipementNom : "Équipement");
        creer(adminId, adminIdStr, "ADMIN_CLINIQUE", CODE_APPAREIL_PANNE, titre, message,
                NotificationUtilisateur.TypeNotification.WARNING, equipementId, "EQUIPEMENT", "/equipements");
    }

    @Transactional
    public void notifyAdminCliniqueStockFaible(Long adminId, String adminIdStr, String message, Long referenceId) {
        creer(adminId, adminIdStr, "ADMIN_CLINIQUE", CODE_STOCK_FAIBLE, "Alerte stock faible", message,
                NotificationUtilisateur.TypeNotification.WARNING, referenceId, "STOCK", "/pharmacie");
    }

    @Transactional
    public void notifyAdminCliniqueIncidentsSecurite(Long adminId, String adminIdStr, String message) {
        creer(adminId, adminIdStr, "ADMIN_CLINIQUE", CODE_INCIDENTS_SECURITE, "Augmentation d'incidents (sécurité)", message,
                NotificationUtilisateur.TypeNotification.ERROR, null, null, "/dashboard");
    }

    // ---- Administrateur de Clinique (génère) : appelé après ajout/modif service, personnel, chambres ----

    @Transactional
    public void notifyPersonnelServiceAjoutOuModif(Long destinataireId, String destinataireIdStr, String destinataireType, String message, Long serviceId) {
        creer(destinataireId, destinataireIdStr, destinataireType, CODE_SERVICE_AJOUT_MODIF, "Service médical mis à jour", message,
                NotificationUtilisateur.TypeNotification.INFO, serviceId, "SERVICE", "/services-medicaux");
    }

    @Transactional
    public void notifyEmployeCompteActive(Long destinataireId, String destinataireIdStr, String destinataireType, String message) {
        creer(destinataireId, destinataireIdStr, destinataireType, CODE_COMPTE_ACTIVE, "Compte activé", message,
                NotificationUtilisateur.TypeNotification.SUCCESS, null, null, "/profil");
    }

    @Transactional
    public void notifyChambresMaj(Long destinataireId, String destinataireIdStr, String destinataireType, String message) {
        creer(destinataireId, destinataireIdStr, destinataireType, CODE_CHAMBRES_MAJ, "Mise à jour des chambres", message,
                NotificationUtilisateur.TypeNotification.INFO, null, "CHAMBRE", "/chambres");
    }

    // ---- Médecin (reçoit) : déjà partiellement dans RendezVousServiceWithNotifications ----

    @Transactional
    public void notifyMedecinNouveauRendezVous(Long medecinId, String medecinIdStr, String message, Long rdvId) {
        creer(medecinId, medecinIdStr, "MEDECIN", CODE_NOUVEAU_RDV, "Nouveau rendez-vous", message,
                NotificationUtilisateur.TypeNotification.INFO, rdvId, "RENDEZ_VOUS", "/rendez-vous");
    }

    @Transactional
    public void notifyMedecinDossierPatientAssigne(Long medecinId, String medecinIdStr, String message, Long dossierId) {
        creer(medecinId, medecinIdStr, "MEDECIN", CODE_DOSSIER_PATIENT_ASSIGNE, "Nouveau dossier patient assigné", message,
                NotificationUtilisateur.TypeNotification.INFO, dossierId, "DOSSIER", "/patients");
    }

    @Transactional
    public void notifyMedecinResultatRadiologique(Long medecinId, String medecinIdStr, String message, Long examenId) {
        creer(medecinId, medecinIdStr, "MEDECIN", CODE_RESULTAT_RADIO, "Résultat d'examen radiologique disponible", message,
                NotificationUtilisateur.TypeNotification.INFO, examenId, "EXAMEN", "/patients");
    }

    /** Rapport d'imagerie validé : lien vers l'espace examens du médecin. */
    @Transactional
    public void notifyMedecinRapportImagerieDisponible(String medecinIdStr, String message) {
        if (medecinIdStr == null || medecinIdStr.isBlank()) {
            return;
        }
        creer(null, medecinIdStr, "MEDECIN", CODE_RESULTAT_RADIO, "Rapport d'imagerie disponible", message,
                NotificationUtilisateur.TypeNotification.INFO, null, "IMAGERIE", "/medecin-examens");
    }

    @Transactional
    public void notifyMedecinDemandeImagerieRefusee(String medecinIdStr, String message) {
        if (medecinIdStr == null || medecinIdStr.isBlank()) {
            return;
        }
        creer(null, medecinIdStr, "MEDECIN", CODE_RESULTAT_RADIO, "Demande d'imagerie refusée", message,
                NotificationUtilisateur.TypeNotification.WARNING, null, "IMAGERIE", "/medecin-examens");
    }

    /** Notifie un radiologue d'une demande classée haute / urgente (file d'attente clinique). */
    @Transactional
    public void notifyRadiologueDemandeImageriePrioritaire(String radiologueIdStr, String message) {
        if (radiologueIdStr == null || radiologueIdStr.isBlank()) {
            return;
        }
        creer(null, radiologueIdStr, "RADIOLOGUE", CODE_DEMANDE_IMAGERIE_PRIORITAIRE,
                "Demande d'imagerie prioritaire", message,
                NotificationUtilisateur.TypeNotification.ERROR, null, "IMAGERIE", "/radiologue-imagerie");
    }

    @Transactional
    public void notifyMedecinUrgenceInfirmier(Long medecinId, String medecinIdStr, String message) {
        creer(medecinId, medecinIdStr, "MEDECIN", CODE_URGENCE_INFIRMIER, "Urgence signalée par un infirmier", message,
                NotificationUtilisateur.TypeNotification.ERROR, null, null, "/rendez-vous");
    }

    @Transactional
    public void notifyMedecinHospitalisationMaj(Long medecinId, String medecinIdStr, String message, Long hospId) {
        creer(medecinId, medecinIdStr, "MEDECIN", CODE_HOSPITALISATION_MAJ, "Hospitalisation mise à jour", message,
                NotificationUtilisateur.TypeNotification.INFO, hospId, "HOSPITALISATION", "/patients");
    }

    // ---- Médecin (génère) ----

    @Transactional
    public void notifyPatientDiagnosticOuOrdonnance(Long patientId, String patientIdStr, String titre, String message, String code, Long referenceId, String referenceType) {
        creer(patientId, patientIdStr, "PATIENT", code, titre, message,
                NotificationUtilisateur.TypeNotification.INFO, referenceId, referenceType, "/mon-dossier");
    }

    @Transactional
    public void notifyInfirmierOuSecurite(Long destinataireId, String destinataireIdStr, String destinataireType, String code, String titre, String message, String actionUrl) {
        creer(destinataireId, destinataireIdStr, destinataireType, code, titre, message,
                NotificationUtilisateur.TypeNotification.INFO, null, null, actionUrl);
    }

    // ---- Technicien de Maintenance (reçoit) ----

    @Transactional
    public void notifyTechnicienDemandeMaintenance(Long technicienId, String technicienIdStr, String message, Long demandeId) {
        creer(technicienId, technicienIdStr, "TECHNICIEN_MAINTENANCE", CODE_DEMANDE_MAINTENANCE, "Demande de maintenance", message,
                NotificationUtilisateur.TypeNotification.WARNING, demandeId, "MAINTENANCE", "/equipements");
    }

    @Transactional
    public void notifyTechnicienAppareilCritique(Long technicienId, String technicienIdStr, String message, Long equipementId) {
        creer(technicienId, technicienIdStr, "TECHNICIEN_MAINTENANCE", CODE_APPAREIL_CRITIQUE, "Appareil critique signalé", message,
                NotificationUtilisateur.TypeNotification.ERROR, equipementId, "EQUIPEMENT", "/equipements");
    }

    // ---- Technicien (génère) ----

    @Transactional
    public void notifyAdminEtLogistiqueEquipementRepare(Long adminId, String adminIdStr, Long logistiqueId, String logistiqueIdStr, String equipementNom, Long equipementId) {
        String titre = "Équipement réparé";
        String message = "L'équipement a été réparé : " + (equipementNom != null ? equipementNom : "Équipement");
        if (adminId != null || adminIdStr != null) {
            creer(adminId, adminIdStr, "ADMIN_CLINIQUE", CODE_EQUIPEMENT_REPARE, titre, message, NotificationUtilisateur.TypeNotification.SUCCESS, equipementId, "EQUIPEMENT", "/equipements");
        }
    }

    @Transactional
    public void notifyAdminEtSecuritePanneCritique(Long adminId, String adminIdStr, String message, Long equipementId) {
        if (adminId != null || adminIdStr != null) {
            creer(adminId, adminIdStr, "ADMIN_CLINIQUE", CODE_PANNE_CRITIQUE, "Panne critique", message, NotificationUtilisateur.TypeNotification.ERROR, equipementId, "EQUIPEMENT", "/equipements");
        }
    }

    // ---- Patient (reçoit) ----

    @Transactional
    public void notifyPatientInscriptionConfirmee(Long patientId, String patientIdStr) {
        creer(patientId, patientIdStr, "PATIENT", CODE_INSCRIPTION_CONFIRMEE, "Inscription confirmée", "Votre inscription a bien été enregistrée.",
                NotificationUtilisateur.TypeNotification.SUCCESS, null, null, "/mon-dossier");
    }

    @Transactional
    public void notifyPatientRdvValide(Long patientId, String patientIdStr, String message, Long rdvId) {
        creer(patientId, patientIdStr, "PATIENT", CODE_RDV_VALIDE, "Rendez-vous validé", message,
                NotificationUtilisateur.TypeNotification.SUCCESS, rdvId, "RENDEZ_VOUS", "/mon-dossier");
    }

    @Transactional
    public void notifyPatientResultatsDisponibles(Long patientId, String patientIdStr, String message) {
        creer(patientId, patientIdStr, "PATIENT", CODE_RESULTATS_DISPONIBLES, "Résultats disponibles", message,
                NotificationUtilisateur.TypeNotification.INFO, null, null, "/mon-dossier");
    }

    @Transactional
    public void notifyPatientNouvelleOrdonnance(Long patientId, String patientIdStr, String message, Long ordonnanceId) {
        creer(patientId, patientIdStr, "PATIENT", CODE_NOUVELLE_ORDONNANCE, "Nouvelle ordonnance PDF", message,
                NotificationUtilisateur.TypeNotification.INFO, ordonnanceId, "ORDONNANCE", "/mon-dossier");
    }

    @Transactional
    public void notifyPatientRappelMedicament(Long patientId, String patientIdStr, String message) {
        creer(patientId, patientIdStr, "PATIENT", CODE_RAPPEL_MEDICAMENT, "Rappel de prise de médicaments", message,
                NotificationUtilisateur.TypeNotification.WARNING, null, null, "/mon-dossier");
    }

    @Transactional
    public void notifyPatientCommandeMedicamentsPrete(Long patientId, String patientIdStr, String message) {
        creer(patientId, patientIdStr, "PATIENT", CODE_COMMANDE_MEDICAMENTS_PRETE, "Commande de médicaments prête", message,
                NotificationUtilisateur.TypeNotification.SUCCESS, null, null, "/mon-dossier");
    }

    @Transactional
    public void notifyPharmacienEtAdminStockMaj(Long pharmacienId, String pharmacienIdStr, Long adminId, String adminIdStr, String message) {
        if (pharmacienId != null || pharmacienIdStr != null) {
            creer(pharmacienId, pharmacienIdStr, "PHARMACIEN", CODE_STOCK_MAJ, "Stock mis à jour", message, NotificationUtilisateur.TypeNotification.INFO, null, null, "/equipements");
        }
        if (adminId != null || adminIdStr != null) {
            creer(adminId, adminIdStr, "ADMIN_CLINIQUE", CODE_STOCK_MAJ, "Stock mis à jour", message, NotificationUtilisateur.TypeNotification.INFO, null, null, "/equipements");
        }
    }

    @Transactional
    public void notifyPharmacienCommandeValidee(Long pharmacienId, String pharmacienIdStr, String message) {
        creer(pharmacienId, pharmacienIdStr, "PHARMACIEN", CODE_COMMANDE_VALIDEE, "Commande validée", message,
                NotificationUtilisateur.TypeNotification.SUCCESS, null, null, "/equipements");
    }

    // ---- Infirmier / coordination soins ----

    @Transactional
    public void notifyInfirmierNouvelleTacheSoin(String infirmierUserIdStr, String titre, String message, String actionUrl) {
        if (infirmierUserIdStr == null || infirmierUserIdStr.isBlank()) {
            return;
        }
        creer(null, infirmierUserIdStr, "INFIRMIER", CODE_TACHE_SOIN_ASSIGNEE, titre, message,
                NotificationUtilisateur.TypeNotification.INFO, null, "SOIN", actionUrl != null ? actionUrl : "/infirmier-taches-soins");
    }

    @Transactional
    public void notifyInfirmierResultatValidationMedecin(String infirmierUserIdStr, String message, String actionUrl) {
        if (infirmierUserIdStr == null || infirmierUserIdStr.isBlank()) {
            return;
        }
        creer(null, infirmierUserIdStr, "INFIRMIER", CODE_VALIDATION_SOIN_MEDECIN, "Décision médecin sur un soin", message,
                NotificationUtilisateur.TypeNotification.WARNING, null, "SOIN", actionUrl != null ? actionUrl : "/infirmier-taches-soins");
    }

    @Transactional
    public void notifyMedecinSoinMisAJour(String medecinUserIdStr, String titre, String message, String actionUrl) {
        if (medecinUserIdStr == null || medecinUserIdStr.isBlank()) {
            return;
        }
        creer(null, medecinUserIdStr, "MEDECIN", CODE_SOIN_MIS_A_JOUR, titre, message,
                NotificationUtilisateur.TypeNotification.INFO, null, "SOIN", actionUrl != null ? actionUrl : "/medecin-taches-soins");
    }

    @Transactional
    public void notifyMedecinRapportInfirmierFinJournee(String medecinUserIdStr, String message) {
        if (medecinUserIdStr == null || medecinUserIdStr.isBlank()) {
            return;
        }
        creer(null, medecinUserIdStr, "MEDECIN", CODE_RAPPORT_INFIRMIER_JOUR, "Compte rendu infirmier (fin de journée)", message,
                NotificationUtilisateur.TypeNotification.INFO, null, "INFIRMIER", "/medecin");
    }

    @Transactional
    public void notifyMedecinSignalementInfirmier(String medecinUserIdStr, String titre, String message) {
        if (medecinUserIdStr == null || medecinUserIdStr.isBlank()) {
            return;
        }
        creer(null, medecinUserIdStr, "MEDECIN", CODE_SIGNALEMENT_INFIRMIER, titre, message,
                NotificationUtilisateur.TypeNotification.WARNING, null, "PATIENT", "/medecin-taches-soins");
    }

    /** Pharmacien : stock sous le seuil (alerte + e-mail possible côté appelant). */
    @Transactional
    public void notifyPharmacienStockFaible(String pharmacienIdStr, String message) {
        if (pharmacienIdStr == null || pharmacienIdStr.isBlank()) {
            return;
        }
        creer(null, pharmacienIdStr, "PHARMACIEN", CODE_STOCK_FAIBLE, "Stock médicament faible", message,
                NotificationUtilisateur.TypeNotification.WARNING, null, "STOCK", "/pharmacie");
    }

    /** Technicien maintenance : équipement passé en panne. */
    @Transactional
    public void notifyTechnicienEquipementEnPanne(String technicienIdStr, String message) {
        if (technicienIdStr == null || technicienIdStr.isBlank()) {
            return;
        }
        creer(null, technicienIdStr, "TECHNICIEN_MAINTENANCE", CODE_APPAREIL_PANNE, "Équipement en panne", message,
                NotificationUtilisateur.TypeNotification.ERROR, null, "EQUIPEMENT", "/equipements");
    }
}
