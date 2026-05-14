package com.pfe.pfe.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.DemandeOperationRequest;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.DemandeOperation;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.DemandeOperationRepository;
import com.pfe.pfe.repository.PatientRepository;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DemandeOperationService {

    private final DemandeOperationRepository repository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final CliniqueRepository cliniqueRepository;

    /** Créer une demande d'opération (par médecin ou secrétaire). */
    public DemandeOperation creer(String demandeurId, DemandeOperationRequest req) {
        User demandeur = userRepository.findById(demandeurId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + demandeurId));
        Patient patient = patientRepository.findById(req.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient introuvable : " + req.getPatientId()));

        if (req.getTypeOperation() == null || req.getTypeOperation().isBlank()) {
            throw new IllegalArgumentException("Le type d'opération est obligatoire.");
        }

        DemandeOperation demande = new DemandeOperation();
        demande.setPatient(patient);
        demande.setDemandeur(demandeur);
        demande.setTypeOperation(req.getTypeOperation().trim());
        demande.setPriorite(req.getPriorite() != null ? req.getPriorite() : "NORMALE");
        demande.setDescription(req.getDescription());
        demande.setDatePrevue(req.getDatePrevue());
        demande.setStatut("EN_ATTENTE");

        // Récupérer la clinique du demandeur
        Clinique clinique = demandeur.getClinique();
        if (clinique == null) {
            clinique = patient.getClinique();
        }
        demande.setClinique(clinique);

        DemandeOperation saved = repository.save(demande);
        log.info("[DemandeOp] Demande {} créée par {} pour patient {}", saved.getId(), demandeurId, patient.getId());
        return saved;
    }

    public DemandeOperation changerStatut(String id, String statut) {
        DemandeOperation d = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Demande introuvable : " + id));
        d.setStatut(statut);
        return repository.save(d);
    }

    /**
     * Résout l'établissement cible : explicite (cliniqueCibleId) pour un cabinet, sinon clinique
     * du demandeur, sinon celle du patient.
     */
    private Clinique resoudreClinique(User demandeur, Patient patient, DemandeOperationRequest req) {
        if (req.getCliniqueCibleId() != null && !req.getCliniqueCibleId().isBlank()) {
            return cliniqueRepository.findById(req.getCliniqueCibleId().trim())
                    .orElseThrow(() -> new IllegalArgumentException("Clinique cible introuvable : " + req.getCliniqueCibleId()));
        }
        Clinique clinique = demandeur.getClinique();
        if (clinique == null) {
            clinique = patient.getClinique();
        }
        if (clinique == null) {
            throw new IllegalArgumentException("Indiquez la clinique cible pour enregistrer la demande (ex. prise en charge hôpital / cabinet).");
        }
        return clinique;
    }

    public List<DemandeOperation> listerParClinique(String cliniqueId) {
        return repository.findByCliniqueIdOrderByDateCreationDesc(cliniqueId);
    }

    public List<DemandeOperation> listerParPatient(String patientId) {
        return repository.findByPatientIdOrderByDateCreationDesc(patientId);
    }

    public List<DemandeOperation> listerParDemandeur(String demandeurId) {
        return repository.findByDemandeurIdOrderByDateCreationDesc(demandeurId);
    }

    public DemandeOperation obtenir(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Demande introuvable : " + id));
    }
}
