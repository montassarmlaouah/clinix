package com.pfe.pfe.service;

import com.pfe.pfe.model.*;
import com.pfe.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UrgenceService {

    private final UrgenceRepository urgenceRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final UserRepository userRepository;
    private final NotificationUtilisateurService notificationService;

    public Urgence signalerUrgence(String patientId, String signaleParId,
                                    String motif, String description,
                                    Urgence.NiveauUrgence niveau) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        User signalePar = null;
        if (signaleParId != null) {
            signalePar = userRepository.findById(signaleParId).orElse(null);
        }

        Urgence urgence = new Urgence();
        urgence.setPatient(patient);
        urgence.setSignalePar(signalePar);
        urgence.setMotif(motif);
        urgence.setDescription(description);
        urgence.setNiveau(niveau != null ? niveau : Urgence.NiveauUrgence.MOYENNE);
        urgence.setStatut(Urgence.StatutUrgence.EN_ATTENTE);
        urgence.setDateSignalement(LocalDateTime.now());

        Urgence saved = urgenceRepository.save(urgence);

        notifierMedecinsUrgence(patient, saved);

        return saved;
    }

    public Urgence prendreEnCharge(String urgenceId, String medecinId) {
        Urgence urgence = urgenceRepository.findById(urgenceId)
                .orElseThrow(() -> new RuntimeException("Urgence non trouvée"));
        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));

        urgence.setMedecinAssigne(medecin);
        urgence.setStatut(Urgence.StatutUrgence.PRISE_EN_CHARGE);
        urgence.setDatePriseEnCharge(LocalDateTime.now());

        return urgenceRepository.save(urgence);
    }

    public Urgence mettreEnTraitement(String urgenceId, String notes) {
        Urgence urgence = urgenceRepository.findById(urgenceId)
                .orElseThrow(() -> new RuntimeException("Urgence non trouvée"));

        urgence.setStatut(Urgence.StatutUrgence.EN_TRAITEMENT);
        if (notes != null) {
            urgence.setNotesTraitement(notes);
        }

        return urgenceRepository.save(urgence);
    }

    public Urgence resoudreUrgence(String urgenceId, String notes) {
        Urgence urgence = urgenceRepository.findById(urgenceId)
                .orElseThrow(() -> new RuntimeException("Urgence non trouvée"));

        urgence.setStatut(Urgence.StatutUrgence.RESOLUE);
        urgence.setDateCloture(LocalDateTime.now());
        if (notes != null) {
            String existing = urgence.getNotesTraitement();
            urgence.setNotesTraitement(
                    (existing != null ? existing + "\n---\n" : "") + notes);
        }

        return urgenceRepository.save(urgence);
    }

    public List<Urgence> obtenirUrgencesActives() {
        return urgenceRepository.findUrgencesActives();
    }

    public List<Urgence> obtenirUrgencesEnAttente() {
        return urgenceRepository.findByStatutOrderByDateSignalementDesc(Urgence.StatutUrgence.EN_ATTENTE);
    }

    public List<Urgence> obtenirUrgencesParPatient(String patientId) {
        return urgenceRepository.findByPatientIdOrderByDateSignalementDesc(patientId);
    }

    public List<Urgence> obtenirUrgencesParMedecin(String medecinId) {
        return urgenceRepository.findByMedecinAssigneIdOrderByDateSignalementDesc(medecinId);
    }

    public Urgence obtenirParId(String id) {
        return urgenceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Urgence non trouvée"));
    }

    private void notifierMedecinsUrgence(Patient patient, Urgence urgence) {
        try {
            List<Medecin> medecins = medecinRepository.findByCliniqueId(
                    patient.getClinique() != null ? patient.getClinique().getId() : null);

            String titre = "URGENCE - " + urgence.getNiveau().name();
            String message = String.format("Patient %s %s - Motif: %s - Niveau: %s",
                    patient.getPrenom(), patient.getNom(),
                    urgence.getMotif(), urgence.getNiveau().name());

            for (Medecin medecin : medecins) {
                try {
                    notificationService.creerNotificationRendezVousStr(
                            medecin.getId(), "MEDECIN", titre, message, urgence.getId());
                } catch (Exception e) {
                    log.error("Erreur notification urgence pour médecin {}: {}",
                            medecin.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Erreur lors de la notification des médecins pour urgence: {}", e.getMessage());
        }
    }
}
