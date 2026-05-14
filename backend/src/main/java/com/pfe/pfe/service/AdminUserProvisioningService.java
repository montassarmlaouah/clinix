package com.pfe.pfe.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.AdminCreateUserRequest;
import com.pfe.pfe.dto.CreerAdministrateurCliniqueDTO;
import com.pfe.pfe.dto.PatientDTO;
import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.model.Patient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Création d'utilisateurs par le Super Admin (SMS géré dans les services métier concernés).
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdminUserProvisioningService {

    private final AdministrateurCliniqueService administrateurCliniqueService;
    private final PatientService patientService;
    private final PasswordGeneratorService passwordGenerator;
    private final TunisieSmsService tunisieSmsService;

    public Map<String, Object> createUser(AdminCreateUserRequest req) {
        if (req.getTelephone() == null || req.getTelephone().trim().isEmpty()) {
            throw new IllegalArgumentException("Le téléphone est obligatoire");
        }
        if (!StringUtils.hasText(req.getRole())) {
            throw new IllegalArgumentException("Le rôle est obligatoire");
        }

        String telephoneNorm = tunisieSmsService.normalizeInternationalTunisia(req.getTelephone());
        if (!StringUtils.hasText(telephoneNorm) || telephoneNorm.length() < 11) {
            throw new IllegalArgumentException("Numéro de téléphone invalide (format tunisien attendu)");
        }

        String role = req.getRole().trim().toUpperCase();
        if ("USER".equals(role)) {
            role = "PATIENT";
        }

        if ("ADMIN_CLINIQUE".equals(role)) {
            if (!StringUtils.hasText(req.getCliniqueId())) {
                throw new IllegalArgumentException("cliniqueId est obligatoire pour ADMIN_CLINIQUE");
            }
            CreerAdministrateurCliniqueDTO dto = new CreerAdministrateurCliniqueDTO();
            dto.setNom(req.getNom() != null ? req.getNom() : "Admin");
            dto.setPrenom(req.getPrenom() != null ? req.getPrenom() : telephoneNorm);
            dto.setTelephone(telephoneNorm);
            dto.setCliniqueId(req.getCliniqueId());
            AdministrateurClinique admin = administrateurCliniqueService.creerAdministrateurClinique(dto);
            Map<String, Object> out = new HashMap<>();
            out.put("message", "Utilisateur créé, SMS envoyé.");
            out.put("id", admin.getId());
            out.put("nom", admin.getNom());
            out.put("role", "ADMIN_CLINIQUE");
            return out;
        }

        if ("PATIENT".equals(role)) {
            if (!StringUtils.hasText(req.getCliniqueId())) {
                throw new IllegalArgumentException("cliniqueId est obligatoire pour PATIENT");
            }
            if (req.getDateNaissance() == null) {
                throw new IllegalArgumentException("dateNaissance est obligatoire pour PATIENT");
            }
            PatientDTO dto = new PatientDTO();
            dto.setNom(req.getNom() != null ? req.getNom() : "Patient");
            dto.setPrenom(req.getPrenom() != null ? req.getPrenom() : telephoneNorm);
            dto.setTelephone(telephoneNorm);
            dto.setCliniqueId(req.getCliniqueId());
            dto.setDateNaissance(req.getDateNaissance());
            dto.setSexe(req.getSexe() != null ? req.getSexe() : "NON_PRECISE");

            String rawPassword = passwordGenerator.generate();
            dto.setMotDePasse(rawPassword);

            Patient patient = patientService.creerPatient(dto);

            String message = "Clinux - Bienvenue " + dto.getPrenom() + " " + dto.getNom()
                    + ". Compte patient pret. ID: " + patient.getTelephone()
                    + " MDP: " + rawPassword + ". App Clinux.";
            try {
                tunisieSmsService.sendSmsForClinique(req.getCliniqueId(), patient.getTelephone(), message);
            } catch (Exception e) {
                log.warn("SMS TunisieSMS non envoye pour patient {} : {}", patient.getTelephone(), e.getMessage());
            }

            Map<String, Object> out = new HashMap<>();
            out.put("message", "Patient créé, SMS envoyé.");
            out.put("id", patient.getId());
            out.put("nom", patient.getNom());
            out.put("numeroPatient", patient.getNumeroPatient());
            out.put("role", "PATIENT");
            return out;
        }

        throw new IllegalArgumentException("Rôle non pris en charge pour ce endpoint: " + req.getRole()
                + " (utilisez ADMIN_CLINIQUE ou PATIENT)");
    }
}
