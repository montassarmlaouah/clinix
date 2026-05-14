package com.pfe.pfe.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.DemandeMedicamentRequest;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Chambre;
import com.pfe.pfe.model.DemandeMedicament;
import com.pfe.pfe.model.DemandeMedicamentItem;
import com.pfe.pfe.model.Medicament;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.ChambreRepository;
import com.pfe.pfe.repository.DemandeMedicamentRepository;
import com.pfe.pfe.repository.MedicamentRepository;
import com.pfe.pfe.repository.PatientRepository;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DemandeMedicamentService {

    private final DemandeMedicamentRepository repository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final MedicamentRepository medicamentRepository;
    private final ChambreRepository chambreRepository;

    /** Créer une demande de médicaments vers la pharmacie. */
    public DemandeMedicament creer(String demandeurId, DemandeMedicamentRequest req) {
        User demandeur = userRepository.findById(demandeurId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + demandeurId));
        Patient patient = patientRepository.findById(req.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient introuvable : " + req.getPatientId()));

        if (req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("La liste de médicaments ne peut pas être vide.");
        }

        DemandeMedicament demande = new DemandeMedicament();
        demande.setPatient(patient);
        demande.setDemandeur(demandeur);
        demande.setNotes(req.getNotes());
        demande.setStatut("EN_ATTENTE");

        Clinique clinique = demandeur.getClinique() != null ? demandeur.getClinique() : patient.getClinique();
        demande.setClinique(clinique);

        if (req.getChambreId() != null && !req.getChambreId().isBlank()) {
            Chambre chambre = chambreRepository.findById(req.getChambreId())
                    .orElseThrow(() -> new IllegalArgumentException("Chambre introuvable : " + req.getChambreId()));
            if (clinique != null
                    && chambre.getService() != null
                    && chambre.getService().getClinique() != null
                    && !clinique.getId().equals(chambre.getService().getClinique().getId())) {
                throw new IllegalArgumentException("La chambre sélectionnée n'appartient pas à la clinique.");
            }
            demande.setChambre(chambre);
        }

        List<DemandeMedicamentItem> items = new ArrayList<>();
        for (DemandeMedicamentRequest.ItemRequest ir : req.getItems()) {
            Medicament med = medicamentRepository.findById(ir.getMedicamentId())
                    .orElseThrow(() -> new IllegalArgumentException("Médicament introuvable : " + ir.getMedicamentId()));
            DemandeMedicamentItem item = new DemandeMedicamentItem();
            item.setDemande(demande);
            item.setMedicament(med);
            Integer quantite = ir.getQuantite();
            item.setQuantite(quantite != null && quantite > 0 ? quantite : 1);
            item.setInstructions(ir.getInstructions());
            items.add(item);
        }
        demande.setItems(items);

        DemandeMedicament saved = repository.save(demande);
        log.info("[DemandeMed] Demande {} créée par {} pour patient {} ({} médicaments)",
                saved.getId(), demandeurId, patient.getId(), items.size());
        return saved;
    }

    /** Pharmacien délivre ou refuse la demande. */
    public DemandeMedicament changerStatut(String id, String statut) {
        DemandeMedicament d = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Demande introuvable : " + id));
        d.setStatut(statut);
        return repository.save(d);
    }

    public List<DemandeMedicament> listerParClinique(String cliniqueId) {
        return repository.findByCliniqueIdOrderByDateCreationDesc(cliniqueId);
    }

    public List<DemandeMedicament> listerParPatient(String patientId) {
        return repository.findByPatientIdOrderByDateCreationDesc(patientId);
    }

    public List<DemandeMedicament> listerParDemandeur(String demandeurId) {
        return repository.findByDemandeurIdOrderByDateCreationDesc(demandeurId);
    }

    public List<DemandeMedicament> listerEnAttente(String cliniqueId) {
        if (cliniqueId != null) {
            return repository.findByCliniqueIdOrderByDateCreationDesc(cliniqueId)
                    .stream().filter(d -> "EN_ATTENTE".equals(d.getStatut())).toList();
        }
        return repository.findByStatutOrderByDateCreationDesc("EN_ATTENTE");
    }

    public DemandeMedicament obtenir(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Demande introuvable : " + id));
    }
}
