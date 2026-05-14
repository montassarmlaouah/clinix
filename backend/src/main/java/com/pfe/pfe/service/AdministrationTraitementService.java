package com.pfe.pfe.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.AdministrationTraitementDTO;
import com.pfe.pfe.model.AdministrationTraitement;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.AdministrationTraitementRepository;
import com.pfe.pfe.repository.PatientRepository;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AdministrationTraitementService {
    
    private final AdministrationTraitementRepository administrationRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final NotificationMetierService notificationMetierService;
    
    public AdministrationTraitement creerAdministration(AdministrationTraitementDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        User userInfirmier = userRepository.findById(dto.getInfirmierId())
                .orElseThrow(() -> new RuntimeException("Infirmier non trouvé"));
        if (!(userInfirmier instanceof Infirmier)) {
            throw new RuntimeException("L'utilisateur spécifié n'est pas un infirmier");
        }
        Infirmier infirmier = (Infirmier) userInfirmier;
        
        AdministrationTraitement administration = new AdministrationTraitement();
        administration.setPatient(patient);
        administration.setInfirmier(infirmier);
        administration.setHeureAdministration(dto.getHeureAdministration() != null ? 
                dto.getHeureAdministration() : LocalDateTime.now());
        administration.setTypeTraitement(dto.getTypeTraitement());
        administration.setNomMedicament(dto.getNomMedicament());
        administration.setDosage(dto.getDosage());
        administration.setVoieAdministration(dto.getVoieAdministration());
        
        Boolean administre = dto.getAdministre();
        administration.setAdministre(administre != null && administre);
        administration.setObservations(dto.getObservations());
        if (dto.getMedecinDemandeurId() != null && !dto.getMedecinDemandeurId().isBlank()) {
            administration.setMedecinDemandeurId(dto.getMedecinDemandeurId().trim());
        }
        administration.setStatutExecution("PLANIFIE");
        administration.setPrioriteUrgente(Boolean.FALSE);

        AdministrationTraitement saved = administrationRepository.save(administration);
        if (dto.getMedecinDemandeurId() != null && !dto.getMedecinDemandeurId().isBlank()) {
            notifierInfirmierNouvelleTache(saved, patient);
        }
        return saved;
    }
    
    public List<AdministrationTraitement> obtenirTraitementsPatient(String patientId) {
        return administrationRepository.findByPatientIdOrderByHeureAdministrationDesc(patientId);
    }
    
    public List<AdministrationTraitement> obtenirTraitementsDuJour(String patientId) {
        LocalDateTime debut = LocalDate.now().atStartOfDay();
        LocalDateTime fin = LocalDate.now().plusDays(1).atStartOfDay();
        return administrationRepository.findTodayTraitementsByPatientId(patientId, debut, fin);
    }
    
    public List<AdministrationTraitement> obtenirTraitementsAVenir(String patientId) {
        LocalDateTime debut = LocalDateTime.now();
        return administrationRepository.findUpcomingTraitementsByPatientId(patientId, debut);
    }
    
    public List<AdministrationTraitement> obtenirTraitementsNonAdministres(String patientId) {
        return administrationRepository.findByPatientIdAndAdministreFalse(patientId);
    }
    
    public List<AdministrationTraitement> obtenirTraitementsParType(String patientId, String typeTraitement) {
        return administrationRepository.findByPatientIdAndTypeTraitement(patientId, typeTraitement);
    }
    
    public List<AdministrationTraitement> obtenirTraitementsInfirmier(String infirmierId) {
        return administrationRepository.findByInfirmierIdOrderByHeureAdministrationDesc(infirmierId);
    }
    
    public List<AdministrationTraitement> creerPlanningJournalier(String patientId, String infirmierId, List<AdministrationTraitementDTO> traitements) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        User userInfirmier = userRepository.findById(infirmierId)
                .orElseThrow(() -> new RuntimeException("Infirmier non trouvé"));
        if (!(userInfirmier instanceof Infirmier)) {
            throw new RuntimeException("L'utilisateur spécifié n'est pas un infirmier");
        }
        Infirmier infirmier = (Infirmier) userInfirmier;
        
        return traitements.stream()
                .map(dto -> {
                    AdministrationTraitement admin = new AdministrationTraitement();
                    admin.setPatient(patient);
                    admin.setInfirmier(infirmier);
                    admin.setHeureAdministration(dto.getHeureAdministration() != null ? 
                            dto.getHeureAdministration() : LocalDateTime.now());
                    admin.setTypeTraitement(dto.getTypeTraitement());
                    admin.setNomMedicament(dto.getNomMedicament());
                    admin.setDosage(dto.getDosage());
                    admin.setVoieAdministration(dto.getVoieAdministration());
                    Boolean administre = dto.getAdministre();
                    admin.setAdministre(administre != null && administre);
                    admin.setObservations(dto.getObservations());
                    if (dto.getMedecinDemandeurId() != null && !dto.getMedecinDemandeurId().isBlank()) {
                        admin.setMedecinDemandeurId(dto.getMedecinDemandeurId().trim());
                    }
                    admin.setStatutExecution("PLANIFIE");
                    admin.setPrioriteUrgente(Boolean.FALSE);
                    AdministrationTraitement savedAd = administrationRepository.save(admin);
                    if (dto.getMedecinDemandeurId() != null && !dto.getMedecinDemandeurId().isBlank()) {
                        notifierInfirmierNouvelleTache(savedAd, patient);
                    }
                    return savedAd;
                })
                .toList();
    }
    
    public AdministrationTraitement obtenirTraitementParId(String id) {
        return administrationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Traitement non trouvé"));
    }
    
    public AdministrationTraitement marquerCommeAdministre(String id, String observations) {
        AdministrationTraitement administration = obtenirTraitementParId(id);
        administration.setAdministre(true);
        administration.setStatutExecution("REALISE");
        administration.setDateAdministrationReelle(LocalDateTime.now());
        if (administration.getMedecinDemandeurId() != null && !administration.getMedecinDemandeurId().isEmpty()
                && (administration.getValidationSoinsMedecin() == null
                || administration.getValidationSoinsMedecin().isEmpty())) {
            administration.setValidationSoinsMedecin("EN_ATTENTE");
        }
        if (observations != null && !observations.isEmpty()) {
            String obs = administration.getObservations();
            if (obs != null) {
                administration.setObservations(obs + " | " + observations);
            } else {
                administration.setObservations(observations);
            }
        }
        AdministrationTraitement saved = administrationRepository.save(administration);
        notifierMedecinSoinRealise(saved);
        return saved;
    }
    
    public AdministrationTraitement mettreAJourTraitement(String id, AdministrationTraitementDTO dto) {
        AdministrationTraitement administration = obtenirTraitementParId(id);
        
        if (dto.getHeureAdministration() != null) {
            administration.setHeureAdministration(dto.getHeureAdministration());
        }
        if (dto.getTypeTraitement() != null) {
            administration.setTypeTraitement(dto.getTypeTraitement());
        }
        if (dto.getNomMedicament() != null) {
            administration.setNomMedicament(dto.getNomMedicament());
        }
        if (dto.getDosage() != null) {
            administration.setDosage(dto.getDosage());
        }
        if (dto.getVoieAdministration() != null) {
            administration.setVoieAdministration(dto.getVoieAdministration());
        }
        if (dto.getAdministre() != null) {
            administration.setAdministre(dto.getAdministre());
        }
        if (dto.getObservations() != null) {
            administration.setObservations(dto.getObservations());
        }
        if (dto.getStatutExecution() != null) {
            administration.setStatutExecution(dto.getStatutExecution());
        }
        if (dto.getRemarquesInfirmier() != null) {
            administration.setRemarquesInfirmier(dto.getRemarquesInfirmier());
        }
        if (dto.getPieceJointeUrl() != null) {
            administration.setPieceJointeUrl(dto.getPieceJointeUrl());
        }
        if (dto.getPrioriteUrgente() != null) {
            administration.setPrioriteUrgente(dto.getPrioriteUrgente());
        }
        
        return administrationRepository.save(administration);
    }
    
    public void supprimerTraitement(String id) {
        administrationRepository.deleteById(id);
    }

    public List<AdministrationTraitement> listerSuiviPourMedecin(String medecinId) {
        return administrationRepository.findSuiviPourMedecin(medecinId);
    }

    public AdministrationTraitement validerSoinParMedecin(String traitementId, String medecinConnecteId,
                                                            boolean valide, String commentaire) {
        AdministrationTraitement administration = obtenirTraitementParId(traitementId);
        assertMedecinPeutValider(administration, medecinConnecteId);
        if (!Boolean.TRUE.equals(administration.getAdministre())) {
            throw new RuntimeException("Le soin doit être marqué comme réalisé par l'infirmier avant validation.");
        }
        if (!"EN_ATTENTE".equals(administration.getValidationSoinsMedecin())) {
            throw new RuntimeException("Aucune validation en attente pour ce soin.");
        }
        administration.setValidationSoinsMedecin(valide ? "VALIDE" : "REFUSE");
        administration.setCommentaireValidationMedecin(commentaire);
        administration.setDateValidationMedecin(LocalDateTime.now());
        administration.setMedecinValidateurId(medecinConnecteId);
        AdministrationTraitement saved = administrationRepository.save(administration);
        try {
            String msg = valide ? "Le médecin a validé le soin."
                    : "Le médecin a refusé le soin." + (commentaire != null && !commentaire.isBlank() ? " Motif : " + commentaire : "");
            notificationMetierService.notifyInfirmierResultatValidationMedecin(
                    saved.getInfirmier().getId(), msg, "/infirmier-taches-soins");
        } catch (Exception ignored) {
        }
        return saved;
    }

    public AdministrationTraitement mettreStatutExecutionInfirmier(String traitementId, String infirmierConnecteId,
                                                                   String statut, String remarques) {
        if (statut == null || statut.isBlank()) {
            throw new RuntimeException("Statut obligatoire (EN_COURS, REALISE, NON_REALISE).");
        }
        String s = statut.trim().toUpperCase();
        if ("REALISE".equals(s)) {
            AdministrationTraitement avant = obtenirTraitementParId(traitementId);
            assertInfirmierAssignee(avant, infirmierConnecteId);
            appendRemarquesInfirmier(avant, remarques);
            administrationRepository.save(avant);
            return marquerCommeAdministre(traitementId, null);
        }
        AdministrationTraitement a = obtenirTraitementParId(traitementId);
        assertInfirmierAssignee(a, infirmierConnecteId);
        if ("EN_COURS".equals(s)) {
            a.setStatutExecution("EN_COURS");
            appendRemarquesInfirmier(a, remarques);
            AdministrationTraitement saved = administrationRepository.save(a);
            notifierMedecinMiseAJour(saved, "Soin en cours", remarques);
            return saved;
        }
        if ("NON_REALISE".equals(s)) {
            a.setStatutExecution("NON_REALISE");
            a.setAdministre(false);
            appendRemarquesInfirmier(a, remarques);
            AdministrationTraitement saved = administrationRepository.save(a);
            notifierMedecinMiseAJour(saved, "Soin marqué non réalisé", remarques);
            return saved;
        }
        throw new RuntimeException("Statut inconnu : " + statut);
    }

    public AdministrationTraitement definirPrioriteUrgente(String traitementId, String infirmierConnecteId, boolean urgent) {
        AdministrationTraitement a = obtenirTraitementParId(traitementId);
        assertInfirmierAssignee(a, infirmierConnecteId);
        a.setPrioriteUrgente(urgent);
        AdministrationTraitement saved = administrationRepository.save(a);
        if (urgent && saved.getMedecinDemandeurId() != null && !saved.getMedecinDemandeurId().isBlank()) {
            try {
                Patient p = saved.getPatient();
                String msg = String.format("Priorité urgente — patient %s %s — %s",
                        p.getPrenom(), p.getNom(), saved.getNomMedicament());
                notificationMetierService.notifyMedecinSoinMisAJour(saved.getMedecinDemandeurId(),
                        "Soin urgent signalé par l'infirmier", msg, "/medecin-taches-soins");
            } catch (Exception ignored) {
            }
        }
        return saved;
    }

    public AdministrationTraitement definirPieceJointe(String traitementId, String infirmierConnecteId, String url) {
        AdministrationTraitement a = obtenirTraitementParId(traitementId);
        assertInfirmierAssignee(a, infirmierConnecteId);
        a.setPieceJointeUrl(url);
        return administrationRepository.save(a);
    }

    private void assertInfirmierAssignee(AdministrationTraitement a, String infirmierConnecteId) {
        if (infirmierConnecteId == null || !infirmierConnecteId.equals(a.getInfirmier().getId())) {
            throw new RuntimeException("Cette tâche n'est pas assignée à votre compte.");
        }
    }

    private void appendRemarquesInfirmier(AdministrationTraitement a, String remarques) {
        if (remarques == null || remarques.isBlank()) {
            return;
        }
        String ex = a.getRemarquesInfirmier();
        if (ex == null || ex.isBlank()) {
            a.setRemarquesInfirmier(remarques.trim());
        } else {
            a.setRemarquesInfirmier(ex + "\n---\n" + remarques.trim());
        }
    }

    private void notifierInfirmierNouvelleTache(AdministrationTraitement saved, Patient patient) {
        try {
            String msg = String.format("%s (%s) — patient %s %s",
                    saved.getNomMedicament(), saved.getTypeTraitement(),
                    patient.getPrenom(), patient.getNom());
            notificationMetierService.notifyInfirmierNouvelleTacheSoin(
                    saved.getInfirmier().getId(), "Nouvelle tâche de soins", msg, "/infirmier-taches-soins");
        } catch (Exception ignored) {
        }
    }

    private void notifierMedecinSoinRealise(AdministrationTraitement saved) {
        if (saved.getMedecinDemandeurId() == null || saved.getMedecinDemandeurId().isBlank()) {
            return;
        }
        try {
            Patient p = saved.getPatient();
            String msg = String.format("Soin réalisé — %s — patient %s %s",
                    saved.getNomMedicament(), p.getPrenom(), p.getNom());
            notificationMetierService.notifyMedecinSoinMisAJour(saved.getMedecinDemandeurId(),
                    "Soin réalisé par l'infirmier", msg, "/medecin-taches-soins");
        } catch (Exception ignored) {
        }
    }

    private void notifierMedecinMiseAJour(AdministrationTraitement saved, String titre, String detail) {
        if (saved.getMedecinDemandeurId() == null || saved.getMedecinDemandeurId().isBlank()) {
            return;
        }
        try {
            Patient p = saved.getPatient();
            String msg = String.format("%s — patient %s %s. %s",
                    saved.getNomMedicament(), p.getPrenom(), p.getNom(),
                    detail != null ? detail : "");
            notificationMetierService.notifyMedecinSoinMisAJour(saved.getMedecinDemandeurId(), titre, msg, "/medecin-taches-soins");
        } catch (Exception ignored) {
        }
    }

    private void assertMedecinPeutValider(AdministrationTraitement administration, String medecinConnecteId) {
        if (medecinConnecteId == null) {
            throw new RuntimeException("Médecin non identifié.");
        }
        if (medecinConnecteId.equals(administration.getMedecinDemandeurId())) {
            return;
        }
        Patient patient = administration.getPatient();
        if (patient.getMedecinCabinet() != null
                && medecinConnecteId.equals(patient.getMedecinCabinet().getId())) {
            return;
        }
        throw new RuntimeException("Vous n'êtes pas autorisé à valider ce soin.");
    }
}
