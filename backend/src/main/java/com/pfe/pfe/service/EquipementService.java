package com.pfe.pfe.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.model.Chambre;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Equipement;
import com.pfe.pfe.model.TechnicienMaintenance;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.ChambreRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.EquipementRepository;
import com.pfe.pfe.repository.TechnicienMaintenanceRepository;
import com.pfe.pfe.repository.UserRepository;
import com.pfe.pfe.security.services.CustomUserDetails;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class EquipementService {

    private final EquipementRepository equipementRepository;
    private final ChambreRepository chambreRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;
    private final UserRepository userRepository;
    private final AdministrateurCliniqueRepository administrateurCliniqueRepository;
    private final CliniqueRepository cliniqueRepository;
    private final NotificationMetierService notificationMetierService;
    private final AlerteEmailService alerteEmailService;
    private static final DateTimeFormatter REPAIR_DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public Equipement creerEquipement(Equipement equipement) {
        // Validation
        if (equipement.getQuantite() == null || equipement.getQuantite() < 0) {
            throw new RuntimeException("La quantité doit être supérieure ou égale à 0");
        }
        if (equipement.getCategorie() == null) {
            throw new RuntimeException("La catégorie de l'équipement est obligatoire");
        }

        // Générer un ID si nécessaire
        if (equipement.getId() != null) {
            equipement.setId(null);
        }

        // Générer un code unique si absent
        if (equipement.getCode() == null || equipement.getCode().trim().isEmpty()) {
            String shortId = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            equipement.setCode("EQ-" + shortId);
        }

        // Valeurs par défaut
        if (equipement.getEtatTechnique() == null) {
            equipement.setEtatTechnique(Equipement.EtatTechnique.FONCTIONNEL);
        }
        if (equipement.getStatut() == null) {
            equipement.setStatut(Equipement.StatutEquipement.DISPONIBLE);
        }
        if (equipement.getCriticite() == null) {
            equipement.setCriticite(Equipement.CriticiteEquipement.MOYENNE);
        }

        if (equipement.getType() == null || equipement.getType().trim().isEmpty()) {
            equipement.setType("EQUIPEMENT");
        }
        if (equipement.getDateAchat() == null) {
            equipement.setDateAchat(LocalDate.now());
        }

        return equipementRepository.save(equipement);
    }

    public List<Equipement> obtenirTousLesEquipements() {
        return equipementRepository.findAll();
    }

    public List<Equipement> obtenirEquipementsParClinique(String cliniqueId) {
        return equipementRepository.findByCliniqueId(cliniqueId);
    }

    public List<Equipement> obtenirEquipementsParCategorie(Equipement.CategorieEquipement categorie) {
        return equipementRepository.findByCategorie(categorie);
    }

    public List<Equipement> obtenirEquipementsParEtatTechnique(Equipement.EtatTechnique etatTechnique) {
        return equipementRepository.findByEtatTechnique(etatTechnique);
    }

    public List<Equipement> obtenirEquipementsParStatut(Equipement.StatutEquipement statut) {
        return equipementRepository.findByStatut(statut);
    }


    public List<Equipement> obtenirEquipementsParTypeLocalisation(Equipement.TypeLocalisation typeLocalisation) {
        return equipementRepository.findByTypeLocalisation(typeLocalisation);
    }

    public Optional<Equipement> obtenirEquipementParCode(String code) {
        return equipementRepository.findByCode(code);
    }

    public Equipement obtenirEquipementParId(String id) {
        return equipementRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Équipement non trouvé avec l'ID: " + id));
    }

    public List<Equipement> obtenirEquipementsDisponibles() {
        return equipementRepository.findByStatut(Equipement.StatutEquipement.DISPONIBLE);
    }

    public List<Equipement> obtenirEquipementsEnMaintenance() {
        return equipementRepository.findByEtatTechnique(Equipement.EtatTechnique.EN_MAINTENANCE);
    }

    public List<Equipement> obtenirEquipementsMaintenanceRequise() {
        LocalDateTime dateProche = LocalDate.now().plusDays(30).atTime(LocalTime.MAX);
        return equipementRepository.findByDateMaintenanceRequise(dateProche);
    }

    public Equipement changerEtatTechnique(String id, Equipement.EtatTechnique nouvelEtatTechnique) {
        Equipement equipement = obtenirEquipementParId(id);
        Equipement.EtatTechnique etatAvant = equipement.getEtatTechnique();
        equipement.setEtatTechnique(nouvelEtatTechnique);
        hydraterCliniqueIdDepuisChambreSiAbsent(equipement);
        Equipement saved = equipementRepository.save(equipement);

        if (nouvelEtatTechnique == Equipement.EtatTechnique.EN_PANNE
                && etatAvant != Equipement.EtatTechnique.EN_PANNE) {
            declencherAlertesPanne(saved);
        }

        return saved;
    }

    public Equipement changerStatut(String id, Equipement.StatutEquipement nouveauStatut) {
        Equipement equipement = obtenirEquipementParId(id);
        equipement.setStatut(nouveauStatut);
        return equipementRepository.save(equipement);
    }

    public Equipement mettreAJourEquipement(String id, Equipement equipementDetails) {
        Equipement equipement = obtenirEquipementParId(id);
        Equipement.EtatTechnique etatAvant = equipement.getEtatTechnique();

        if (isCurrentUserTechnicienMaintenance()) {
            assertEquipementDansCliniqueTechnicien(equipement);
            appliquerDetailsTechnicienSurEquipement(equipement, equipementDetails);
        } else {
            appliquerDetailsCompletSurEquipement(equipement, equipementDetails);
        }

        hydraterCliniqueIdDepuisChambreSiAbsent(equipement);

        Equipement saved = equipementRepository.save(equipement);

        if (saved.getEtatTechnique() == Equipement.EtatTechnique.EN_PANNE
                && etatAvant != Equipement.EtatTechnique.EN_PANNE
                && StringUtils.hasText(saved.getCliniqueId())) {
            declencherAlertesPanne(saved);
        }

        return saved;
    }

    /** Fusion complète des champs (admin / super-admin). */
    private void appliquerDetailsCompletSurEquipement(Equipement equipement, Equipement equipementDetails) {
        if (equipementDetails.getNom() != null) {
            equipement.setNom(equipementDetails.getNom());
        }

        if (equipementDetails.getDescription() != null) {
            equipement.setDescription(equipementDetails.getDescription());
        }

        if (equipementDetails.getQuantite() != null) {
            equipement.setQuantite(equipementDetails.getQuantite());
        }
        if (equipementDetails.getCategorie() != null) {
            equipement.setCategorie(equipementDetails.getCategorie());
        }
        if (equipementDetails.getType() != null && !equipementDetails.getType().trim().isEmpty()) {
            equipement.setType(equipementDetails.getType().trim());
        }
        if (equipementDetails.getEtatTechnique() != null) {
            equipement.setEtatTechnique(equipementDetails.getEtatTechnique());
        }
        if (equipementDetails.getStatut() != null) {
            equipement.setStatut(equipementDetails.getStatut());
        }
        if (equipementDetails.getCriticite() != null) {
            equipement.setCriticite(equipementDetails.getCriticite());
        }

        if (equipementDetails.getTypeLocalisation() != null) {
            equipement.setTypeLocalisation(equipementDetails.getTypeLocalisation());
        }
        if (equipementDetails.getLocalisation() != null) {
            equipement.setLocalisation(equipementDetails.getLocalisation());
        }
        if (equipementDetails.getDateMaintenance() != null) {
            equipement.setDateMaintenance(equipementDetails.getDateMaintenance());
        }
        if (equipementDetails.getDateMaintenanceProchaine() != null) {
            equipement.setDateMaintenanceProchaine(equipementDetails.getDateMaintenanceProchaine());
        }
        if (equipementDetails.getDateAchat() != null) {
            equipement.setDateAchat(equipementDetails.getDateAchat());
        }
        if (equipementDetails.getNotes() != null) {
            equipement.setNotes(equipementDetails.getNotes());
        }
        if (equipementDetails.getChambreId() != null) {
            equipement.setChambreId(equipementDetails.getChambreId());
        }
        if (equipementDetails.getCliniqueId() != null && StringUtils.hasText(equipementDetails.getCliniqueId())) {
            equipement.setCliniqueId(equipementDetails.getCliniqueId().trim());
        }
    }

    /**
     * Champs modifiables par le technicien via PUT /api/equipements (état opérationnel, localisation panne, notes).
     * Les champs d'inventaire (nom, quantité, catégorie, etc.) restent réservés à l'admin.
     */
    private void appliquerDetailsTechnicienSurEquipement(Equipement equipement, Equipement equipementDetails) {
        if (equipementDetails.getEtatTechnique() != null) {
            equipement.setEtatTechnique(equipementDetails.getEtatTechnique());
        }
        if (equipementDetails.getTypeLocalisation() != null) {
            equipement.setTypeLocalisation(equipementDetails.getTypeLocalisation());
        }
        if (equipementDetails.getLocalisation() != null) {
            equipement.setLocalisation(equipementDetails.getLocalisation());
        }
        if (equipementDetails.getDateMaintenance() != null) {
            equipement.setDateMaintenance(equipementDetails.getDateMaintenance());
        }
        if (equipementDetails.getDateMaintenanceProchaine() != null) {
            equipement.setDateMaintenanceProchaine(equipementDetails.getDateMaintenanceProchaine());
        }
        if (equipementDetails.getNotes() != null) {
            equipement.setNotes(equipementDetails.getNotes());
        }
        if (equipementDetails.getChambreId() != null) {
            equipement.setChambreId(equipementDetails.getChambreId());
        }
    }

    private static boolean isCurrentUserTechnicienMaintenance() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if ("ROLE_TECHNICIEN_MAINTENANCE".equals(ga.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    private static String cliniqueIdTechnicienConnecte() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud)) {
            throw new RuntimeException("Session invalide.");
        }
        String cid = cud.getCliniqueId();
        if (!StringUtils.hasText(cid)) {
            throw new RuntimeException("Aucune clinique associée à votre compte technicien.");
        }
        return cid.trim();
    }

    private static void assertEquipementDansCliniqueTechnicien(Equipement equipement) {
        String cid = cliniqueIdTechnicienConnecte();
        String ecid = equipement.getCliniqueId() != null ? equipement.getCliniqueId().trim() : "";
        if (!StringUtils.hasText(ecid) || !ecid.equals(cid)) {
            throw new RuntimeException("Accès non autorisé à cet équipement");
        }
    }

    public void supprimerEquipement(String id) {
        Equipement equipement = obtenirEquipementParId(id);
        equipementRepository.delete(equipement);
    }

    public Equipement traiterPanne(String id, String repairType, String repairNotes, Integer repairHours, Integer repairMinutes) {
        Equipement equipement = obtenirEquipementParId(id);
        if (repairNotes == null || repairNotes.trim().isEmpty()) {
            throw new RuntimeException("Le rapport de réparation est obligatoire.");
        }

        String typeLabel;
        if ("quick".equalsIgnoreCase(repairType)) {
            typeLabel = "Réparation Rapide";
        } else if ("full".equalsIgnoreCase(repairType)) {
            typeLabel = "Révision Complète";
        } else if ("replacement".equalsIgnoreCase(repairType)) {
            typeLabel = "Remplacement";
        } else {
            typeLabel = "Réparation";
        }

        int hours = repairHours == null ? 0 : Math.max(0, repairHours);
        int minutes = repairMinutes == null ? 0 : Math.max(0, repairMinutes);
        String repairTimeInfo = String.format("Temps: %dh %dm", hours, minutes);
        String timestamp = LocalDateTime.now().format(REPAIR_DATE_FORMAT);

        String baseNotes = equipement.getNotes() == null ? "" : equipement.getNotes().trim();
        String newNotes = String.format("[RÉPARATION - %s] %s\n%s\n%s", typeLabel, timestamp, repairNotes.trim(), repairTimeInfo);
        equipement.setNotes(baseNotes.isEmpty() ? newNotes : baseNotes + "\n" + newNotes);

        equipement.setEtatTechnique(Equipement.EtatTechnique.FONCTIONNEL);
        Equipement saved = equipementRepository.save(equipement);
        notifierAdminsReparationEffectuee(saved, typeLabel, repairNotes.trim(), repairTimeInfo);
        return saved;
    }

    public List<Equipement> obtenirEquipementsPourChambre(String chambreId) {
        return equipementRepository.findByChambreId(chambreId);
    }

    /**
     * Équipements de la clinique en panne ou hors service (vue technicien / dashboard).
     */
    public List<Equipement> listEquipementsEnPanneOuHorsServicePourClinique(String cliniqueId) {
        if (!StringUtils.hasText(cliniqueId)) {
            return List.of();
        }
        return equipementRepository.findByCliniqueIdAndEtatTechniqueIn(
                cliniqueId.trim(),
                List.of(Equipement.EtatTechnique.EN_PANNE, Equipement.EtatTechnique.HORS_SERVICE));
    }

    /**
     * Tous les équipements d'une clinique (lecture technicien).
     */
    public List<Equipement> listEquipementsPourClinique(String cliniqueId) {
        if (!StringUtils.hasText(cliniqueId)) {
            return List.of();
        }
        return equipementRepository.findByCliniqueId(cliniqueId.trim());
    }

    /**
     * Renvoie notifications + e-mails d'alerte panne (admins + techniciens de la clinique).
     * Réservé aux équipements en panne, hors service ou en maintenance ; l'appelant doit être rattaché à la même clinique.
     */
    public void renvoyerAlertesPanne(String equipementId, String cliniqueAppelantId, String noteOptionnelle) {
        Equipement e = obtenirEquipementParId(equipementId);
        String cidApp = cliniqueAppelantId != null ? cliniqueAppelantId.trim() : "";
        String cidEq = e.getCliniqueId() != null ? e.getCliniqueId().trim() : "";
        if (!StringUtils.hasText(cidApp) || !cidApp.equals(cidEq)) {
            throw new RuntimeException("Accès non autorisé à cet équipement");
        }
        Equipement.EtatTechnique et = e.getEtatTechnique();
        if (et != Equipement.EtatTechnique.EN_PANNE
                && et != Equipement.EtatTechnique.HORS_SERVICE
                && et != Equipement.EtatTechnique.EN_MAINTENANCE) {
            throw new RuntimeException("Les alertes e-mail concernent les équipements en panne, en maintenance ou hors service");
        }
        notifierPanneEquipement(e, noteOptionnelle);
    }

    // Nouvelle méthode pour la recherche
    public List<Equipement> rechercherEquipements(String terme) {
        if (terme == null || terme.trim().isEmpty()) {
            return equipementRepository.findAll();
        }
        return equipementRepository.findByNomContainingIgnoreCase(terme.trim());
    }

    private void declencherAlertesPanne(Equipement equipement) {
        notifierPanneEquipement(equipement, null);
    }

    /**
     * Renseigne {@code cliniqueId} à partir de la chambre (service → clinique) lorsqu'il manque en base,
     * afin que les alertes panne (e-mail technicien / admin) puissent cibler la bonne clinique.
     */
    private void hydraterCliniqueIdDepuisChambreSiAbsent(Equipement equipement) {
        if (StringUtils.hasText(equipement.getCliniqueId()) || !StringUtils.hasText(equipement.getChambreId())) {
            return;
        }
        Optional<Chambre> chambreOpt = chambreRepository.findById(equipement.getChambreId().trim());
        if (chambreOpt.isEmpty() || chambreOpt.get().getService() == null
                || chambreOpt.get().getService().getClinique() == null) {
            return;
        }
        Clinique c = chambreOpt.get().getService().getClinique();
        if (StringUtils.hasText(c.getId())) {
            equipement.setCliniqueId(c.getId());
        }
    }

    private void notifierPanneEquipement(Equipement equipement, String noteOptionnelle) {
        String cliniqueId = StringUtils.hasText(equipement.getCliniqueId()) ? equipement.getCliniqueId().trim() : null;
        if (cliniqueId == null || cliniqueId.isEmpty()) {
            log.warn("Alerte panne : cliniqueId absent pour l'équipement {} — e-mails non envoyés.", equipement.getId());
            return;
        }
        String cliniqueNom = cliniqueRepository.findById(cliniqueId).map(Clinique::getNom).orElse("Votre clinique");
        String nomEq = StringUtils.hasText(equipement.getNom()) ? equipement.getNom() : "Équipement";
        String code = StringUtils.hasText(equipement.getCode()) ? equipement.getCode() : "N/A";
        String categorie = formatCategorieEquipement(equipement.getCategorie());
        String etatTechnique = formatEtatTechnique(equipement.getEtatTechnique());
        String localisation = StringUtils.hasText(equipement.getLocalisation()) ? equipement.getLocalisation() : "Non renseignée";

        String message = String.format("%s (%s) — clinique : %s.", nomEq, code, cliniqueNom);
        if (StringUtils.hasText(noteOptionnelle)) {
            message += "\nNote : " + noteOptionnelle.trim();
        }

        String detailsPanne = String.join("\n",
                "Panne signalée par l'administration clinique.",
                "",
                "Informations générales",
                "Nom",
                nomEq,
                "Référence",
                code,
                "Catégorie",
                categorie,
                "État technique",
                etatTechnique,
                "Localisation",
                localisation);

        String contenuEmail = detailsPanne;
        if (StringUtils.hasText(noteOptionnelle)) {
            contenuEmail += "\n\nNotes\n" + noteOptionnelle.trim();
        }
        contenuEmail += "\n\nConsultez le module Équipements pour traiter la panne.";

        for (AdministrateurClinique admin : administrateurCliniqueRepository.findByCliniqueIdAndActifTrue(cliniqueId)) {
            if (admin.getId() == null) {
                continue;
            }
            if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
                alerteEmailService.envoyerAlerteSiPossible(admin.getEmail().trim(), "[Clinix] Équipement en panne",
                        "Panne signalée", contenuEmail);
            }
            try {
                notificationMetierService.notifyAdminCliniqueAppareilEnPanne(null, admin.getId(), nomEq, null);
            } catch (Exception ex) {
                log.warn("Notification in-app panne non enregistrée pour admin clinique {} : {}", admin.getId(), ex.getMessage());
            }
        }

        List<TechnicienMaintenance> techniciens = technicienMaintenanceRepository.findByCliniqueId(cliniqueId);
        int techniciensEligibles = 0;
        int techniciensAvecEmail = 0;
        for (TechnicienMaintenance tech : techniciens) {
            if (tech.getId() == null || Boolean.FALSE.equals(tech.getActif())) {
                continue;
            }
            techniciensEligibles++;
            String email = StringUtils.hasText(tech.getEmail()) ? tech.getEmail().trim() : null;
            if (!StringUtils.hasText(email)) {
                email = userRepository.findById(tech.getId())
                        .map(User::getEmail)
                        .filter(StringUtils::hasText)
                        .map(String::trim)
                        .orElse(null);
            }
            if (StringUtils.hasText(email)) {
                techniciensAvecEmail++;
                alerteEmailService.envoyerAlerteSiPossible(email, "[Clinix] Intervention équipement",
                        "Équipement en panne", contenuEmail);
                log.debug("Alerte panne : tentative e-mail SMTP pour technicien id={} (équipement {})", tech.getId(), nomEq);
            }
            try {
                notificationMetierService.notifyTechnicienEquipementEnPanne(tech.getId(), message);
            } catch (Exception ex) {
                log.warn("Notification in-app panne non enregistrée pour technicien {} : {}", tech.getId(), ex.getMessage());
            }
        }
        if (techniciens.isEmpty()) {
            log.warn(
                    "Alerte panne clinique {} : aucun technicien maintenance en base — aucun e-mail technicien (équipement {}).",
                    cliniqueId, nomEq);
        } else if (techniciensEligibles == 0) {
            log.warn(
                    "Alerte panne clinique {} : {} ligne(s) technicien mais aucun compte actif — e-mails techniciens non envoyés (équipement {}).",
                    cliniqueId, techniciens.size(), nomEq);
        } else if (techniciensAvecEmail == 0) {
            log.warn(
                    "Alerte panne clinique {} : {} technicien(s) actif(s) sans adresse e-mail sur le compte — e-mails non envoyés (équipement {}). Renseignez l'e-mail dans Employés ou le profil.",
                    cliniqueId, techniciensEligibles, nomEq);
        }
    }

    /** E-mail aux admins clinique lorsque le technicien a terminé la réparation (équipement remis en service). */
    private void notifierAdminsReparationEffectuee(Equipement equipement, String typeLabel, String repairNotes,
            String repairTimeInfo) {
        String cliniqueId = StringUtils.hasText(equipement.getCliniqueId()) ? equipement.getCliniqueId().trim() : null;
        if (cliniqueId == null || cliniqueId.isEmpty()) {
            return;
        }
        String nomEq = StringUtils.hasText(equipement.getNom()) ? equipement.getNom() : "Équipement";
        String code = StringUtils.hasText(equipement.getCode()) ? equipement.getCode() : "N/A";
        String corps = String.join("\n",
                "Un technicien maintenance a terminé l'intervention.",
                "",
                "Équipement",
                nomEq,
                "Référence",
                code,
                "Type d'intervention",
                typeLabel,
                "",
                "Rapport",
                repairNotes,
                "",
                repairTimeInfo,
                "",
                "L'équipement est repassé en état fonctionnel dans le module Équipements.");
        for (AdministrateurClinique admin : administrateurCliniqueRepository.findByCliniqueIdAndActifTrue(cliniqueId)) {
            if (admin.getId() == null) {
                continue;
            }
            if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
                alerteEmailService.envoyerAlerteSiPossible(admin.getEmail().trim(), "[Clinix] Réparation terminée",
                        "Équipement remis en service", corps);
            }
        }
    }

    private String formatCategorieEquipement(Equipement.CategorieEquipement categorie) {
        if (categorie == null) {
            return "Non renseignée";
        }
        return switch (categorie) {
            case LITS_MOBILIER -> "Lits & Mobilier";
            case DIAGNOSTIC -> "Diagnostic";
        };
    }

    private String formatEtatTechnique(Equipement.EtatTechnique etatTechnique) {
        if (etatTechnique == null) {
            return "Non renseigné";
        }
        return switch (etatTechnique) {
            case FONCTIONNEL -> "Fonctionnel";
            case EN_PANNE -> "En panne";
            case EN_MAINTENANCE -> "En maintenance";
            case HORS_SERVICE -> "Hors service";
        };
    }
}