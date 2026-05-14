package com.pfe.pfe.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.RendezVousDTO;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.RendezVous;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PatientRepository;
import com.pfe.pfe.repository.RendezVousRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RendezVousService {
    
    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final NotificationUtilisateurService notificationService;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm");
    
    public RendezVous creerRendezVous(RendezVousDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        Medecin medecin = medecinRepository.findById(dto.getMedecinId())
            .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));
        
        LocalDateTime debut = dto.getDateHeure();
        LocalDateTime fin = debut.plusHours(1);
        List<RendezVous> rdvExistants = rendezVousRepository
            .findByMedecinIdAndDateHeureBetween(dto.getMedecinId(), debut, fin);
        
        if (!rdvExistants.isEmpty()) {
            throw new RuntimeException("Le médecin n'est pas disponible à cette heure");
        }
        
        RendezVous rendezVous = new RendezVous();
        rendezVous.setDateHeure(dto.getDateHeure());
        rendezVous.setMotif(dto.getMotif());
        rendezVous.setPatient(patient);
        rendezVous.setMedecin(medecin);
        rendezVous.setStatut(RendezVous.StatutRendezVous.PLANIFIE);
        
        RendezVous saved = rendezVousRepository.save(rendezVous);
        
        String dateFormatee = dto.getDateHeure().format(DATE_FORMATTER);
        notifierStr(patient.getId(), "PATIENT", "Nouveau rendez-vous",
                String.format("Votre rendez-vous avec Dr. %s %s a été créé pour le %s. Motif: %s",
                        medecin.getPrenom(), medecin.getNom(), dateFormatee, dto.getMotif()),
                saved.getId());
        notifierStr(medecin.getId(), "MEDECIN", "Nouveau rendez-vous",
                String.format("Nouveau rendez-vous avec %s %s le %s. Motif: %s",
                        patient.getPrenom(), patient.getNom(), dateFormatee, dto.getMotif()),
                saved.getId());

        return saved;
    }
    
    public List<RendezVous> obtenirRendezVousParPatient(String patientId) {
        return rendezVousRepository.findByPatientId(patientId);
    }
    
    public List<RendezVous> obtenirRendezVousParMedecin(String medecinId) {
        return rendezVousRepository.findByMedecinId(medecinId);
    }

    public List<RendezVous> obtenirTousLesRendezVous() {
        return rendezVousRepository.findAll();
    }

    public List<RendezVous> obtenirRendezVousParClinique(String cliniqueId) {
        return rendezVousRepository.findByMedecinCliniqueId(cliniqueId);
    }

    public List<RendezVous> listerRendezVousCliniquePourJour(String cliniqueId, LocalDate jour) {
        LocalDateTime debut = jour.atStartOfDay();
        LocalDateTime fin = debut.plusDays(1);
        return rendezVousRepository.findByCliniqueIdAndDateHeureBetween(cliniqueId, debut, fin);
    }

    public List<RendezVous> listerRendezVousCliniquePourMedecin(String medecinId, String cliniqueId) {
        return rendezVousRepository.findRdvCliniquePourMedecin(medecinId, cliniqueId);
    }

    public List<RendezVous> listerRendezVousCabinetPourMedecin(String medecinId) {
        return rendezVousRepository.findRdvCabinetPourMedecin(medecinId);
    }

    public RendezVous validerVisiteParInfirmier(String rdvId, String infirmierId, String observations, boolean signer) {
        RendezVous rendezVous = rendezVousRepository.findById(rdvId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        rendezVous.setVisiteValideeParInfirmier(Boolean.TRUE);
        rendezVous.setDateValidationVisiteInfirmier(LocalDateTime.now());
        rendezVous.setInfirmierValidationVisiteId(infirmierId);
        rendezVous.setObservationsVisiteInfirmier(observations);
        if (signer) {
            rendezVous.setEmpreinteSignatureVisite(empreinteVisite(infirmierId, rdvId));
        }
        RendezVous saved = rendezVousRepository.save(rendezVous);
        try {
            notifierStr(rendezVous.getMedecin().getId(), "MEDECIN", "Visite / passage infirmier",
                    String.format("Patient %s %s. %s",
                            rendezVous.getPatient().getPrenom(), rendezVous.getPatient().getNom(),
                            observations != null ? observations : ""),
                    saved.getId());
        } catch (Exception e) {
            log.warn("Notification visite infirmier: {}", e.getMessage());
        }
        return saved;
    }

    private static String empreinteVisite(String infirmierId, String rdvId) {
        try {
            String raw = infirmierId + "|" + rdvId + "|" + System.currentTimeMillis();
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : d) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return "SIG-" + System.currentTimeMillis();
        }
    }
    
    public RendezVous confirmerRendezVous(String id) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        
        rendezVous.setStatut(RendezVous.StatutRendezVous.CONFIRME);
        RendezVous saved = rendezVousRepository.save(rendezVous);

        String dateFormatee = rendezVous.getDateHeure().format(DATE_FORMATTER);
        notifierStr(rendezVous.getPatient().getId(), "PATIENT", "Rendez-vous confirmé",
                String.format("Votre rendez-vous avec Dr. %s %s le %s a été confirmé.",
                        rendezVous.getMedecin().getPrenom(), rendezVous.getMedecin().getNom(), dateFormatee),
                saved.getId());

        return saved;
    }

    /** Confirmation par le médecin titulaire du rendez-vous uniquement. */
    public RendezVous confirmerRendezVousParMedecin(String rdvId, String medecinConnecteId) {
        RendezVous rendezVous = rendezVousRepository.findById(rdvId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        if (medecinConnecteId == null || !medecinConnecteId.equals(rendezVous.getMedecin().getId())) {
            throw new RuntimeException("Seul le médecin concerné peut confirmer ce rendez-vous.");
        }
        return confirmerRendezVous(rdvId);
    }
    
    public RendezVous annulerRendezVous(String id) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        
        Patient patient = rendezVous.getPatient();
        Medecin medecin = rendezVous.getMedecin();
        String dateFormatee = rendezVous.getDateHeure().format(DATE_FORMATTER);
        
        rendezVous.setStatut(RendezVous.StatutRendezVous.ANNULE);
        RendezVous saved = rendezVousRepository.save(rendezVous);

        notifierStr(patient.getId(), "PATIENT", "Rendez-vous annulé",
                String.format("Votre rendez-vous avec Dr. %s %s prévu le %s a été annulé.",
                        medecin.getPrenom(), medecin.getNom(), dateFormatee),
                saved.getId());
        notifierStr(medecin.getId(), "MEDECIN", "Rendez-vous annulé",
                String.format("Le rendez-vous avec %s %s prévu le %s a été annulé.",
                        patient.getPrenom(), patient.getNom(), dateFormatee),
                saved.getId());

        return saved;
    }
    
    public RendezVous reporterRendezVous(String id, LocalDateTime nouvelleDate) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        
        LocalDateTime fin = nouvelleDate.plusHours(1);
        List<RendezVous> rdvExistants = rendezVousRepository
            .findByMedecinIdAndDateHeureBetweenAndIdNot(
                    rendezVous.getMedecin().getId(), nouvelleDate, fin, id);
        
        if (!rdvExistants.isEmpty()) {
            throw new RuntimeException("Le médecin n'est pas disponible à cette nouvelle heure");
        }

        String ancienneDateFormatee = rendezVous.getDateHeure().format(DATE_FORMATTER);
        rendezVous.setDateHeure(nouvelleDate);
        RendezVous saved = rendezVousRepository.save(rendezVous);

        String nouvelleDateFormatee = nouvelleDate.format(DATE_FORMATTER);
        notifierStr(rendezVous.getPatient().getId(), "PATIENT", "Rendez-vous reporté",
                String.format("Votre rendez-vous avec Dr. %s %s a été reporté du %s au %s.",
                        rendezVous.getMedecin().getPrenom(), rendezVous.getMedecin().getNom(),
                        ancienneDateFormatee, nouvelleDateFormatee),
                saved.getId());

        return saved;
    }

    public RendezVous mettreAJourRendezVous(String id, RendezVousDTO dto) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));

        Patient patient = patientRepository.findById(dto.getPatientId())
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        Medecin medecin = medecinRepository.findById(dto.getMedecinId())
            .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));

        LocalDateTime debut = dto.getDateHeure();
        LocalDateTime fin = debut.plusHours(1);
        List<RendezVous> rdvExistants = rendezVousRepository
            .findByMedecinIdAndDateHeureBetweenAndIdNot(dto.getMedecinId(), debut, fin, id);

        if (!rdvExistants.isEmpty()) {
            throw new RuntimeException("Le médecin n'est pas disponible à cette heure");
        }

        rendezVous.setDateHeure(dto.getDateHeure());
        rendezVous.setMotif(dto.getMotif());
        rendezVous.setPatient(patient);
        rendezVous.setMedecin(medecin);
        return rendezVousRepository.save(rendezVous);
    }

    public void supprimerRendezVous(String id) {
        RendezVous rendezVous = rendezVousRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));
        rendezVousRepository.delete(rendezVous);
    }

    private void notifierStr(String userIdStr, String userType, String titre, String message, String rdvId) {
        try {
            notificationService.creerNotificationRendezVousStr(userIdStr, userType, titre, message, rdvId);
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de la notification: {}", e.getMessage());
        }
    }
}
