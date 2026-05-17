package com.pfe.pfe.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.PatientDTO;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.DossierMedical;
import com.pfe.pfe.model.Hospitalisation;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.DossierMedicalRepository;
import com.pfe.pfe.repository.HospitalisationRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PatientService {
    
    private final PatientRepository patientRepository;
    private final CliniqueRepository cliniqueRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final MedecinRepository medecinRepository;
    private final HospitalisationRepository hospitalisationRepository;
    private final PatientMedecinService patientMedecinService;
    
    public Patient creerPatient(PatientDTO dto) {
        // Vérifier si le téléphone existe déjà
        if (patientRepository.findByTelephone(dto.getTelephone()).isPresent()) {
            throw new RuntimeException("Un utilisateur avec ce numéro de téléphone existe déjà");
        }
        
        Patient patient = new Patient();
        patient.setNom(dto.getNom());
        patient.setPrenom(dto.getPrenom());
        patient.setTelephone(dto.getTelephone());
        // Patient créé sans compte applicatif pour le moment.
        patient.setMotDePasse(null);
        if (dto.getDateNaissance() == null) {
            throw new RuntimeException("La date de naissance est obligatoire");
        }
        patient.setDateNaissance(dto.getDateNaissance());
        patient.setSexe(dto.getSexe());
        patient.setGroupeSanguin(dto.getGroupeSanguin());
        patient.setAdresse(dto.getAdresse());
        patient.setTypeAdmission(dto.getTypeAdmission());
        patient.setVerifieParSecretaire(Boolean.FALSE);
        patient.setVerificationSecretaireDate(null);
        patient.setDateCreation(LocalDateTime.now());
        patient.setActif(true);
        
        // Générer un numéro patient unique
        patient.setNumeroPatient("PAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        
        // Assigner à une clinique (obligatoire)
        String cliniqueId = dto.getCliniqueId();
        if (cliniqueId == null || cliniqueId.trim().isEmpty()) {
            throw new RuntimeException("La clinique est obligatoire pour un patient");
        }
        Clinique clinique = cliniqueRepository.findById(cliniqueId)
            .orElseThrow(() -> new RuntimeException("Clinique non trouvée"));
        patient.setClinique(clinique);
        
        Patient savedPatient = patientRepository.save(patient);
        
        // Créer automatiquement un dossier médical
        DossierMedical dossierMedical = new DossierMedical();
        dossierMedical.setPatient(savedPatient);
        dossierMedical.setDateCreation(LocalDateTime.now());
        dossierMedicalRepository.save(dossierMedical);

        if (dto.getMedecinIds() != null || StringUtils.hasText(dto.getMedecinReferentId())) {
            patientMedecinService.synchroniserMedecins(savedPatient, dto.getMedecinIds(), dto.getMedecinReferentId());
        }
        patientMedecinService.enrichirMedecins(savedPatient);
        return savedPatient;
    }
    
    public List<Patient> obtenirTousLesPatients() {
        List<Patient> patients = patientRepository.findAll();
        patientMedecinService.enrichirMedecins(patients);
        return patients;
    }

    public List<Patient> obtenirPatientsParClinique(String cliniqueId) {
        List<Patient> patients = patientRepository.findByCliniqueId(cliniqueId);
        patientMedecinService.enrichirMedecins(patients);
        return patients;
    }

    public List<Patient> obtenirPatientsParService(String serviceId) {
        List<Patient> patients = hospitalisationRepository
                .findByChambreServiceIdAndStatut(serviceId, Hospitalisation.StatutHospitalisation.EN_COURS)
                .stream()
                .map(Hospitalisation::getPatient)
                .filter(patient -> patient != null && Boolean.TRUE.equals(patient.getActif()))
                .distinct()
                .toList();
        patientMedecinService.enrichirMedecins(patients);
        return patients;
    }
    
    public Patient obtenirPatientParId(String id) {
        Patient patient = patientRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        patientMedecinService.enrichirMedecins(patient);
        return patient;
    }
    
    public Patient obtenirPatientParNumero(String numeroPatient) {
        Patient patient = patientRepository.findByNumeroPatient(numeroPatient)
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        patientMedecinService.enrichirMedecins(patient);
        return patient;
    }
    
    public Patient mettreAJourPatient(String id, PatientDTO dto) {
        Patient patient = patientRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        patient.setNom(dto.getNom());
        patient.setPrenom(dto.getPrenom());
        patient.setTelephone(dto.getTelephone());
        patient.setSexe(dto.getSexe());
        patient.setGroupeSanguin(dto.getGroupeSanguin());
        patient.setAdresse(dto.getAdresse());
        patient.setTypeAdmission(dto.getTypeAdmission());
        
        Patient saved = patientRepository.save(patient);

        if (dto.getMedecinIds() != null || StringUtils.hasText(dto.getMedecinReferentId())) {
            patientMedecinService.synchroniserMedecins(saved, dto.getMedecinIds(), dto.getMedecinReferentId());
        }
        patientMedecinService.enrichirMedecins(saved);
        return saved;
    }
    
    public void supprimerPatient(String id) {
        Patient patient = obtenirPatientParId(id);
        patient.setActif(false);
        patientRepository.save(patient);
    }

    /**
     * Médecin cabinet : ajouter un patient à son cabinet (sans clinique associée).
     */
    public Patient creerPatientCabinet(String medecinId, PatientDTO dto) {
        Medecin medecin = medecinRepository.findById(medecinId)
                .orElseThrow(() -> new RuntimeException("Médecin introuvable : " + medecinId));

        Optional<Patient> existing = patientRepository.findByTelephone(dto.getTelephone());
        if (existing.isPresent()) {
            Patient p = existing.get();
            p.setMedecinCabinet(medecin);
            Patient saved = patientRepository.save(p);
            patientMedecinService.ajouterMedecin(saved, medecin, true);
            patientMedecinService.enrichirMedecins(saved);
            return saved;
        }

        Patient patient = new Patient();
        patient.setNom(dto.getNom());
        patient.setPrenom(dto.getPrenom());
        patient.setTelephone(dto.getTelephone());
        // Patient créé sans compte applicatif pour le moment.
        patient.setMotDePasse(null);
        if (dto.getDateNaissance() == null) {
            throw new RuntimeException("La date de naissance est obligatoire");
        }
        patient.setDateNaissance(dto.getDateNaissance());
        patient.setSexe(dto.getSexe());
        patient.setGroupeSanguin(dto.getGroupeSanguin());
        patient.setAdresse(dto.getAdresse());
        patient.setTypeAdmission(dto.getTypeAdmission());
        patient.setVerifieParSecretaire(Boolean.FALSE);
        patient.setVerificationSecretaireDate(null);
        patient.setDateCreation(LocalDateTime.now());
        patient.setActif(true);
        patient.setNumeroPatient("PAT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        patient.setMedecinCabinet(medecin);

        // Clinique du médecin si disponible
        if (medecin.getClinique() != null) {
            patient.setClinique(medecin.getClinique());
        }

        Patient saved = patientRepository.save(patient);

        DossierMedical dossier = new DossierMedical();
        dossier.setPatient(saved);
        dossier.setDateCreation(LocalDateTime.now());
        dossierMedicalRepository.save(dossier);

        patientMedecinService.ajouterMedecin(saved, medecin, true);
        patientMedecinService.enrichirMedecins(saved);
        return saved;
    }

    public List<Patient> listerPatientsCabinet(String medecinId) {
        List<Patient> patients = patientRepository.findByMedecinCabinetId(medecinId);
        patientMedecinService.enrichirMedecins(patients);
        return patients;
    }

    public Patient verifierParSecretaire(String id) {
        Patient patient = obtenirPatientParId(id);
        patient.setVerifieParSecretaire(Boolean.TRUE);
        patient.setVerificationSecretaireDate(java.time.LocalDate.now());
        return patientRepository.save(patient);
    }
}
