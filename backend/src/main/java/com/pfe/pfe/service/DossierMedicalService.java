package com.pfe.pfe.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.model.DossierMedical;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.repository.DossierMedicalRepository;
import com.pfe.pfe.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class DossierMedicalService {
    
    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    
    public DossierMedical obtenirDossierParPatient(String patientId) {
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        return dossierMedicalRepository.findByPatientId(patientId)
            .orElseGet(() -> creerDossierMedical(patient));
    }
    
    public DossierMedical creerDossierMedical(Patient patient) {
        DossierMedical dossier = new DossierMedical();
        // L'ID est auto-généré (nouvel objet, id = null par défaut)
        dossier.setPatient(patient);
        dossier.setDateCreation(LocalDateTime.now());
        
        return dossierMedicalRepository.save(dossier);
    }
    
    public DossierMedical mettreAJourDossier(String id, DossierMedical dossierDetails) {
        DossierMedical dossier = dossierMedicalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé"));
        
        dossier.setAntecedents(dossierDetails.getAntecedents());
        dossier.setAllergies(dossierDetails.getAllergies());

        return dossierMedicalRepository.save(dossier);
    }
    
    public DossierMedical obtenirDossierParId(String id) {
        return dossierMedicalRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé"));
    }

    public DossierMedical mettreNotesConfidentielles(String dossierId, String notes) {
        DossierMedical dossier = dossierMedicalRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé"));
        dossier.setNotesConfidentielles(notes);
        return dossierMedicalRepository.save(dossier);
    }

    public String obtenirNotesConfidentielles(String dossierId) {
        DossierMedical dossier = dossierMedicalRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé"));
        return dossier.getNotesConfidentielles();
    }
}
