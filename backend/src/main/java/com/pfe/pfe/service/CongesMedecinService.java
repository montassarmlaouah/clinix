package com.pfe.pfe.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.CongesMedecinRequest;
import com.pfe.pfe.model.CongesMedecin;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.repository.CongesMedecinRepository;
import com.pfe.pfe.repository.MedecinRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CongesMedecinService {

    private final CongesMedecinRepository congesRepository;
    private final MedecinRepository medecinRepository;

    /** Créer un congé (statut initial : APPROUVE, sans validation). */
    public CongesMedecin demanderConge(CongesMedecinRequest req) {
        Medecin medecin = medecinRepository.findById(req.getMedecinId())
                .orElseThrow(() -> new IllegalArgumentException("Médecin introuvable : " + req.getMedecinId()));

        if (req.getDateDebut() == null || req.getDateFin() == null) {
            throw new IllegalArgumentException("Les dates de début et fin sont obligatoires.");
        }
        if (req.getDateFin().isBefore(req.getDateDebut())) {
            throw new IllegalArgumentException("La date de fin ne peut pas être avant la date de début.");
        }

        CongesMedecin conge = new CongesMedecin();
        conge.setMedecin(medecin);
        conge.setDateDebut(req.getDateDebut());
        conge.setDateFin(req.getDateFin());
        conge.setTypeConge(req.getTypeConge() != null ? req.getTypeConge() : "ANNUEL");
        conge.setMotif(req.getMotif());
        conge.setStatut("APPROUVE");

        CongesMedecin saved = congesRepository.save(conge);
        log.info("[Conges] Congé {} créé pour médecin {} du {} au {}",
                saved.getId(), medecin.getId(), req.getDateDebut(), req.getDateFin());
        return saved;
    }

    /** Approuver ou refuser un congé. */
    public CongesMedecin changerStatut(String congeId, String nouveauStatut) {
        CongesMedecin conge = congesRepository.findById(congeId)
                .orElseThrow(() -> new IllegalArgumentException("Congé introuvable : " + congeId));
        conge.setStatut(nouveauStatut);
        return congesRepository.save(conge);
    }

    public List<CongesMedecin> listerParMedecin(String medecinId) {
        return congesRepository.findByMedecinId(medecinId);
    }

    /** Médecins disponibles dans une clinique à une date donnée (pas de congé approuvé). */
    public List<Medecin> medecinsdDisponibles(String cliniqueId, LocalDate date) {
        LocalDate d = date != null ? date : LocalDate.now();
        return congesRepository.findMedecinsDisponibles(cliniqueId, d);
    }

    public void supprimer(String congeId) {
        if (!congesRepository.existsById(congeId)) {
            throw new IllegalArgumentException("Congé introuvable : " + congeId);
        }
        congesRepository.deleteById(congeId);
    }
}
