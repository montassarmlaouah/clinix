package com.pfe.pfe.service;

import com.pfe.pfe.dto.CreerOrdonnanceDTO;
import com.pfe.pfe.dto.LigneMedicamentDTO;
import com.pfe.pfe.model.*;
import com.pfe.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class OrdonnanceService {

    private static final String PREFIX_NUMERO = "ORD-";

    private final OrdonnanceRepository ordonnanceRepository;
    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final PharmacienRepository pharmacienRepository;
    private final MedicamentRepository medicamentRepository;

    /**
     * Crée une ordonnance : soit à partir d'une consultation, soit par médecin + patient.
     */
    public Ordonnance creerOrdonnance(CreerOrdonnanceDTO dto) {
        Ordonnance ordonnance = new Ordonnance();
        ordonnance.setDate(LocalDate.now());
        ordonnance.setSignee(false);
        ordonnance.setValidee(false);

        if (dto.getConsultationId() != null && !dto.getConsultationId().isBlank()) {
            Consultation consultation = consultationRepository.findById(dto.getConsultationId())
                .orElseThrow(() -> new RuntimeException("Consultation non trouvée"));
            ordonnance.setConsultation(consultation);
        } else {
            if (dto.getMedecinId() == null || dto.getMedecinId().isBlank() || dto.getPatientId() == null || dto.getPatientId().isBlank()) {
                throw new RuntimeException("En l'absence de consultation, medecinId et patientId sont obligatoires.");
            }
            Medecin medecin = medecinRepository.findById(dto.getMedecinId())
                .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));
            Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
            ordonnance.setMedecin(medecin);
            ordonnance.setPatient(patient);
        }

        ordonnance.setNumeroOrdonnance(genererNumeroOrdonnance());
        Ordonnance saved = ordonnanceRepository.save(ordonnance);

        if (dto.getMedicaments() != null && !dto.getMedicaments().isEmpty()) {
            for (LigneMedicamentDTO ligne : dto.getMedicaments()) {
                ajouterPrescription(saved, ligne);
            }
            saved = ordonnanceRepository.save(saved);
        }
        return saved;
    }

    /** Ajoute un médicament (ligne de prescription) à une ordonnance existante. */
    public Prescription ajouterMedicament(String ordonnanceId, LigneMedicamentDTO dto) {
        Ordonnance ordonnance = ordonnanceRepository.findById(ordonnanceId)
            .orElseThrow(() -> new RuntimeException("Ordonnance non trouvée"));
        return ajouterPrescription(ordonnance, dto);
    }

    private Prescription ajouterPrescription(Ordonnance ordonnance, LigneMedicamentDTO dto) {
        Prescription p = new Prescription();
        p.setOrdonnance(ordonnance);
        p.setMedicament(dto.getMedicament());
        p.setDosage(dto.getDosage());
        p.setFrequence(dto.getFrequence());
        p.setDuree(dto.getDuree());
        p.setInstructions(dto.getInstructions());
        if (dto.getMedicamentId() != null && !dto.getMedicamentId().isBlank()) {
            medicamentRepository.findById(dto.getMedicamentId()).ifPresent(p::setMedicamentDetail);
        }
        ordonnance.getPrescriptions().add(p);
        ordonnanceRepository.save(ordonnance);
        return p;
    }

    private String genererNumeroOrdonnance() {
        int year = LocalDate.now().getYear();
        LocalDate start = LocalDate.of(year, 1, 1);
        LocalDate end = LocalDate.of(year, 12, 31);
        long count = ordonnanceRepository.countByDateBetween(start, end);
        return PREFIX_NUMERO + year + "-" + String.format("%04d", count + 1);
    }

    public Optional<Ordonnance> getById(String id) {
        return ordonnanceRepository.findById(id);
    }

    /** Charge l'ordonnance avec prescriptions pour PDF. */
    public Optional<Ordonnance> getByIdWithPrescriptions(String id) {
        return ordonnanceRepository.findByIdWithPrescriptions(id);
    }

    public Ordonnance signerOrdonnance(String ordonnanceId) {
        Ordonnance ordonnance = ordonnanceRepository.findById(ordonnanceId)
            .orElseThrow(() -> new RuntimeException("Ordonnance non trouvée"));
        ordonnance.setSignee(true);
        return ordonnanceRepository.save(ordonnance);
    }

    public Ordonnance validerOrdonnance(String ordonnanceId, String pharmacienId) {
        Ordonnance ordonnance = ordonnanceRepository.findById(ordonnanceId)
            .orElseThrow(() -> new RuntimeException("Ordonnance non trouvée"));
        Pharmacien pharmacien = pharmacienRepository.findById(pharmacienId)
            .orElseThrow(() -> new RuntimeException("Pharmacien non trouvé"));
        ordonnance.setValidee(true);
        ordonnance.setPharmacienValidateur(pharmacien);
        return ordonnanceRepository.save(ordonnance);
    }

    public List<Ordonnance> obtenirOrdonnancesNonValidees() {
        return ordonnanceRepository.findByValidee(false);
    }

    public List<Ordonnance> obtenirOrdonnancesParMedecin(String medecinId) {
        return ordonnanceRepository.findByMedecinId(medecinId);
    }

    public List<Ordonnance> obtenirOrdonnancesParPatient(String patientId) {
        return ordonnanceRepository.findByPatientId(patientId);
    }

    public List<Ordonnance> obtenirToutesLesOrdonnances() {
        return ordonnanceRepository.findAll();
    }

    public void supprimerOrdonnance(String id) {
        Ordonnance ordonnance = ordonnanceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Ordonnance non trouvée"));
        ordonnanceRepository.delete(ordonnance);
    }
}
