package com.pfe.pfe.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.model.Absence;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.AbsenceRepository;
import com.pfe.pfe.repository.GardeRepository;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class AbsenceService {
    
    private final AbsenceRepository absenceRepository;
    private final UserRepository userRepository;
    private final GardeRepository gardeRepository;
    
    /**
     * Créer une demande d'absence
     */
    public Absence creerDemande(Absence absence) {
        absence.setId(null);
        if (absence.getUtilisateur() == null) {
            throw new RuntimeException("Utilisateur non fourni");
        }
        if (absence.getDateDebut() == null || absence.getDateFin() == null) {
            throw new RuntimeException("Dates d'absence obligatoires");
        }
        if (absence.getDateFin().isBefore(absence.getDateDebut())) {
            throw new RuntimeException("dateFin doit être >= dateDebut");
        }
        if (absence.getDateDebut().isBefore(LocalDate.now())) {
            throw new RuntimeException("La date d'absence ne peut pas être dans le passé");
        }
        if (absence.getMotif() == null || absence.getMotif().isBlank()) {
            throw new RuntimeException("Motif obligatoire");
        }
        if (absenceRepository.existsOverlappingAbsence(
                absence.getUtilisateur().getId(),
                absence.getDateDebut(),
                absence.getDateFin()
        )) {
            throw new RuntimeException("Vous avez déjà une demande d'absence qui chevauche cette période");
        }
        if (hasPlanningOnPeriod(absence.getUtilisateur().getId(), absence.getDateDebut(), absence.getDateFin())) {
            throw new RuntimeException("Impossible de demander un congé: vous avez déjà un planning sur cette période");
        }
        absence.setStatut(Absence.StatutAbsence.EN_ATTENTE);
        return absenceRepository.save(absence);
    }

    public Absence creerDemandePourUtilisateur(String utilisateurId, LocalDate dateDebut, LocalDate dateFin, String motif) {
        if (utilisateurId == null || utilisateurId.isBlank()) {
            throw new RuntimeException("Utilisateur non fourni");
        }
        if (dateDebut == null || dateFin == null) {
            throw new RuntimeException("Dates d'absence obligatoires");
        }
        if (dateFin.isBefore(dateDebut)) {
            throw new RuntimeException("dateFin doit être >= dateDebut");
        }
        if (dateDebut.isBefore(LocalDate.now())) {
            throw new RuntimeException("La date d'absence ne peut pas être dans le passé");
        }
        if (motif == null || motif.isBlank()) {
            throw new RuntimeException("Motif obligatoire");
        }
        if (absenceRepository.existsOverlappingAbsence(utilisateurId, dateDebut, dateFin)) {
            throw new RuntimeException("Vous avez déjà une demande d'absence qui chevauche cette période");
        }
        if (hasPlanningOnPeriod(utilisateurId, dateDebut, dateFin)) {
            throw new RuntimeException("Impossible de demander un congé: vous avez déjà un planning sur cette période");
        }

        User utilisateur = userRepository.findById(utilisateurId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        Absence absence = new Absence();
        absence.setId(null);
        absence.setUtilisateur(utilisateur);
        absence.setDateDebut(dateDebut);
        absence.setDateFin(dateFin);
        absence.setMotif(motif);
        absence.setStatut(Absence.StatutAbsence.EN_ATTENTE);
        return absenceRepository.save(absence);
    }
    
    public List<Absence> obtenirToutesLesAbsences() {
        return absenceRepository.findAll();
    }
    
    public Absence obtenirAbsenceParId(String id) {
        return absenceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Absence non trouvée"));
    }
    
    public List<Absence> obtenirAbsencesParInfirmier(String infirmierId) {
        return absenceRepository.findByUtilisateurId(infirmierId);
    }
    
    public List<Absence> obtenirDemandesEnAttente() {
        return absenceRepository.findDemandesEnAttente();
    }
    
    public List<Absence> obtenirAbsencesParPeriode(LocalDate debut, LocalDate fin) {
        return absenceRepository.findByPeriode(debut, fin);
    }
    
    /**
     * Approuver une demande d'absence
     */
    public Absence approuverDemande(String id) {
        Absence absence = obtenirAbsenceParId(id);
        if (absence.getUtilisateur() != null
                && hasPlanningOnPeriod(absence.getUtilisateur().getId(), absence.getDateDebut(), absence.getDateFin())) {
            throw new RuntimeException("Impossible d'approuver: l'infirmier a déjà un planning sur cette période");
        }
        absence.setStatut(Absence.StatutAbsence.APPROUVEE);
        return absenceRepository.save(absence);
    }
    
    /**
     * Refuser une demande d'absence
     */
    public Absence refuserDemande(String id, String motifRefus) {
        Absence absence = obtenirAbsenceParId(id);
        absence.setStatut(Absence.StatutAbsence.REFUSEE);
        return absenceRepository.save(absence);
    }
    
    public void supprimerAbsence(String id) {
        absenceRepository.deleteById(id);
    }

    private boolean hasPlanningOnPeriod(String utilisateurId, LocalDate dateDebut, LocalDate dateFin) {
        if (utilisateurId == null || dateDebut == null || dateFin == null) return false;
        LocalDateTime start = dateDebut.atStartOfDay();
        LocalDateTime end = LocalDateTime.of(dateFin, LocalTime.MAX);
        return gardeRepository.existsOverlappingGardes(utilisateurId, start, end);
    }
}
