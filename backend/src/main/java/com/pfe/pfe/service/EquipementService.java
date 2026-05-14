package com.pfe.pfe.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Equipement;
import com.pfe.pfe.model.TechnicienMaintenance;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.EquipementRepository;
import com.pfe.pfe.repository.TechnicienMaintenanceRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class EquipementService {

    private final EquipementRepository equipementRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;
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

        // Mise à jour des champs
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
        if (equipementDetails.getCliniqueId() != null) {
            equipement.setCliniqueId(equipementDetails.getCliniqueId());
        }

        Equipement saved = equipementRepository.save(equipement);

        if (saved.getEtatTechnique() == Equipement.EtatTechnique.EN_PANNE
                && etatAvant != Equipement.EtatTechnique.EN_PANNE
                && saved.getCliniqueId() != null) {
            declencherAlertesPanne(saved);
        }

        return saved;
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
        return equipementRepository.save(equipement);
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
     * Renvoie notifications + e-mails d'alerte panne (admin + techniciens de la clinique).
     * Réservé aux équipements nécessitant une intervention.
     */
    public void renvoyerAlertesPanne(String equipementId, String cliniqueTechnicienId, String noteOptionnelle) {
        Equipement e = obtenirEquipementParId(equipementId);
        if (!StringUtils.hasText(cliniqueTechnicienId) || !cliniqueTechnicienId.equals(e.getCliniqueId())) {
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

    private void notifierPanneEquipement(Equipement equipement, String noteOptionnelle) {
        String cliniqueId = equipement.getCliniqueId();
        if (cliniqueId == null || cliniqueId.isBlank()) {
            return;
        }
        String cliniqueNom = cliniqueRepository.findById(cliniqueId).map(Clinique::getNom).orElse("Votre clinique");
        String nomEq = equipement.getNom() != null ? equipement.getNom() : "Équipement";
        String code = equipement.getCode() != null ? equipement.getCode() : "";
        String message = String.format("%s (%s) — clinique : %s.", nomEq, code, cliniqueNom);
        if (StringUtils.hasText(noteOptionnelle)) {
            message += "\nNote : " + noteOptionnelle.trim();
        }

        for (AdministrateurClinique admin : administrateurCliniqueRepository.findByCliniqueIdAndActifTrue(cliniqueId)) {
            if (admin.getId() == null) {
                continue;
            }
            notificationMetierService.notifyAdminCliniqueAppareilEnPanne(null, admin.getId(), nomEq, null);
            if (admin.getEmail() != null && !admin.getEmail().isBlank()) {
                alerteEmailService.envoyerAlerteSiPossible(admin.getEmail(), "[Clinix] Équipement en panne",
                        "Panne signalée", message + "\nConsultez le module Équipements.");
            }
        }

        for (TechnicienMaintenance tech : technicienMaintenanceRepository.findByCliniqueId(cliniqueId)) {
            if (tech.getId() == null || Boolean.FALSE.equals(tech.getActif())) {
                continue;
            }
            notificationMetierService.notifyTechnicienEquipementEnPanne(tech.getId(), message);
            if (tech.getEmail() != null && !tech.getEmail().isBlank()) {
                alerteEmailService.envoyerAlerteSiPossible(tech.getEmail(), "[Clinix] Intervention équipement",
                        "Équipement en panne", message + "\nConnectez-vous à l'espace maintenance / équipements.");
            }
        }
    }
}