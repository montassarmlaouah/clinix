package com.pfe.pfe.service;

import com.pfe.pfe.model.*;
import com.pfe.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ConsultationService {
    
    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    
    public Consultation creerConsultation(String patientId, String medecinId, String motif) {
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        Medecin medecin = medecinRepository.findById(medecinId)
            .orElseThrow(() -> new RuntimeException("Médecin non trouvé"));
        
        DossierMedical dossier = dossierMedicalRepository.findByPatientId(patientId)
            .orElseGet(() -> {
                DossierMedical d = new DossierMedical();
                d.setPatient(patient);
                d.setDateCreation(LocalDateTime.now());
                return dossierMedicalRepository.save(d);
            });
        
        Consultation consultation = new Consultation();
        consultation.setDate(LocalDateTime.now());
        consultation.setMotif(motif);
        consultation.setPatient(patient);
        consultation.setMedecin(medecin);
        consultation.setDossierMedical(dossier);
        
        return consultationRepository.save(consultation);
    }
    
    public Consultation ajouterDiagnostic(String consultationId, String diagnostic, String observations) {
        Consultation consultation = consultationRepository.findById(consultationId)
            .orElseThrow(() -> new RuntimeException("Consultation non trouvée"));
        
        consultation.setDiagnostic(diagnostic);
        consultation.setObservations(observations);
        
        return consultationRepository.save(consultation);
    }
    
    public List<Consultation> obtenirConsultationsParPatient(String patientId) {
        return consultationRepository.findByPatientId(patientId);
    }
    
    public List<Consultation> obtenirConsultationsParMedecin(String medecinId) {
        return consultationRepository.findByMedecinId(medecinId);
    }
}
