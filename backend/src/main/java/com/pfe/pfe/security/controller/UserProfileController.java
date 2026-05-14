package com.pfe.pfe.security.controller;

import com.pfe.pfe.model.*;
import com.pfe.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Contrôleur pour récupérer les informations du profil utilisateur
 * GET /auth/profile - Récupère le profil de l'utilisateur connecté
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class UserProfileController {

    private final PatientRepository patientRepository;
    private final AdministrateurCliniqueRepository adminRepository;
    private final MedecinRepository medecinRepository;
    private final InfirmierRepository infirmierRepository;
    private final PharmacienRepository pharmacienRepository;
    private final RadiologueRepository radiologueRepository;
    private final SecretaireRepository secretaireRepository;
    private final ChefPersonnelRepository chefPersonnelRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;

    /**
     * Récupérer le profil de l'utilisateur connecté
     * GET /auth/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            log.info("Récupération du profil pour: {}", username);
            
            // Chercher l'utilisateur dans toutes les tables
            Map<String, Object> profile = findUserProfile(username);
            
            if (profile == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            log.error("Erreur lors de la récupération du profil", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Erreur lors de la récupération du profil: " + e.getMessage()
            ));
        }
    }

    private Map<String, Object> findUserProfile(String username) {
        Map<String, Object> profile = new HashMap<>();
        
        // Super Admin (username = "super.admin")
        if (username.equals("super.admin") || username.equals("super.admin2")) {
            profile.put("id", null);
            profile.put("nom", "Super");
            profile.put("prenom", "Admin");
            profile.put("telephone", null);
            profile.put("role", "SUPER_ADMIN");
            profile.put("cliniqueId", null);
            return profile;
        }
        
        // Chercher dans AdministrateurClinique
        Optional<AdministrateurClinique> adminOpt = adminRepository.findByTelephone(username);
        if (adminOpt.isPresent()) {
            AdministrateurClinique admin = adminOpt.get();
            profile.put("id", admin.getId());
            profile.put("nom", admin.getNom());
            profile.put("prenom", admin.getPrenom());
            profile.put("telephone", admin.getTelephone());
            profile.put("role", "ADMIN_CLINIQUE");
            profile.put("cliniqueId", admin.getClinique() != null ? admin.getClinique().getId() : null);
            profile.put("cliniqueNom", admin.getClinique() != null ? admin.getClinique().getNom() : null);
            return profile;
        }
        
        // Chercher dans Medecin
        Optional<Medecin> medecinOpt = medecinRepository.findByTelephone(username);
        if (medecinOpt.isPresent()) {
            Medecin medecin = medecinOpt.get();
            profile.put("id", medecin.getId());
            profile.put("nom", medecin.getNom());
            profile.put("prenom", medecin.getPrenom());
            profile.put("telephone", medecin.getTelephone());
            profile.put("role", "MEDECIN");
            profile.put("specialite", medecin.getSpecialite());
            profile.put("cliniqueId", medecin.getClinique() != null ? medecin.getClinique().getId() : null);
            return profile;
        }
        
        // Chercher dans Infirmier
        Optional<Infirmier> infirmierOpt = infirmierRepository.findByTelephone(username);
        if (infirmierOpt.isPresent()) {
            Infirmier infirmier = infirmierOpt.get();
            profile.put("id", infirmier.getId());
            profile.put("nom", infirmier.getNom());
            profile.put("prenom", infirmier.getPrenom());
            profile.put("telephone", infirmier.getTelephone());
            profile.put("role", "INFIRMIER");
            profile.put("cliniqueId", infirmier.getClinique() != null ? infirmier.getClinique().getId() : null);
            return profile;
        }
        
        // Chercher dans Pharmacien
        Optional<Pharmacien> pharmacienOpt = pharmacienRepository.findByTelephone(username);
        if (pharmacienOpt.isPresent()) {
            Pharmacien pharmacien = pharmacienOpt.get();
            profile.put("id", pharmacien.getId());
            profile.put("nom", pharmacien.getNom());
            profile.put("prenom", pharmacien.getPrenom());
            profile.put("telephone", pharmacien.getTelephone());
            profile.put("role", "PHARMACIEN");
            profile.put("cliniqueId", pharmacien.getClinique() != null ? pharmacien.getClinique().getId() : null);
            return profile;
        }
        
        // Chercher dans Radiologue
        Optional<Radiologue> radiologueOpt = radiologueRepository.findByTelephone(username);
        if (radiologueOpt.isPresent()) {
            Radiologue radiologue = radiologueOpt.get();
            profile.put("id", radiologue.getId());
            profile.put("nom", radiologue.getNom());
            profile.put("prenom", radiologue.getPrenom());
            profile.put("telephone", radiologue.getTelephone());
            profile.put("role", "RADIOLOGUE");
            profile.put("cliniqueId", radiologue.getClinique() != null ? radiologue.getClinique().getId() : null);
            return profile;
        }
        
        // Chercher dans Secretaire
        Optional<Secretaire> secretaireOpt = secretaireRepository.findByTelephone(username);
        if (secretaireOpt.isPresent()) {
            Secretaire secretaire = secretaireOpt.get();
            profile.put("id", secretaire.getId());
            profile.put("nom", secretaire.getNom());
            profile.put("prenom", secretaire.getPrenom());
            profile.put("telephone", secretaire.getTelephone());
            profile.put("role", "SECRETAIRE");
            profile.put("cliniqueId", secretaire.getClinique() != null ? secretaire.getClinique().getId() : null);
            return profile;
        }
        
        // Chercher dans ChefPersonnel
        Optional<ChefPersonnel> chefOpt = chefPersonnelRepository.findByTelephone(username);
        if (chefOpt.isPresent()) {
            ChefPersonnel chef = chefOpt.get();
            profile.put("id", chef.getId());
            profile.put("nom", chef.getNom());
            profile.put("prenom", chef.getPrenom());
            profile.put("telephone", chef.getTelephone());
            profile.put("role", "CHEF_PERSONNEL");
            profile.put("cliniqueId", chef.getClinique() != null ? chef.getClinique().getId() : null);
            return profile;
        }
        
        // Chercher dans TechnicienMaintenance
        Optional<TechnicienMaintenance> technicienOpt = technicienMaintenanceRepository.findByTelephone(username);
        if (technicienOpt.isPresent()) {
            TechnicienMaintenance technicien = technicienOpt.get();
            profile.put("id", technicien.getId());
            profile.put("nom", technicien.getNom());
            profile.put("prenom", technicien.getPrenom());
            profile.put("telephone", technicien.getTelephone());
            profile.put("role", "TECHNICIEN_MAINTENANCE");
            profile.put("cliniqueId", technicien.getClinique() != null ? technicien.getClinique().getId() : null);
            return profile;
        }
        
        // Chercher dans Patient
        Optional<Patient> patientOpt = patientRepository.findByTelephone(username);
        if (patientOpt.isPresent()) {
            Patient patient = patientOpt.get();
            profile.put("id", patient.getId());
            profile.put("nom", patient.getNom());
            profile.put("prenom", patient.getPrenom());
            profile.put("telephone", patient.getTelephone());
            profile.put("role", "PATIENT");
            profile.put("numeroPatient", patient.getNumeroPatient());
            profile.put("cliniqueId", null);
            return profile;
        }
        
        return null;
    }
    
    /**
     * Mettre à jour le profil de l'utilisateur connecté
     * PUT /auth/profile
     */
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, String> updates) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            
            log.info("Mise à jour du profil pour: {}", username);
            
            // Chercher et mettre à jour l'administrateur de clinique
            Optional<AdministrateurClinique> adminOpt = adminRepository.findByTelephone(username);
            if (adminOpt.isPresent()) {
                AdministrateurClinique admin = adminOpt.get();
                
                if (updates.containsKey("nom") && updates.get("nom") != null && !updates.get("nom").trim().isEmpty()) {
                    admin.setNom(updates.get("nom").trim());
                }
                if (updates.containsKey("prenom") && updates.get("prenom") != null && !updates.get("prenom").trim().isEmpty()) {
                    admin.setPrenom(updates.get("prenom").trim());
                }
                
                admin = adminRepository.save(admin);
                
                Map<String, Object> response = new HashMap<>();
                response.put("message", "Profil mis à jour avec succès");
                response.put("nom", admin.getNom());
                response.put("prenom", admin.getPrenom());
                
                return ResponseEntity.ok(response);
            }
            
            // TODO: Ajouter la mise à jour pour les autres types d'utilisateurs si nécessaire
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Type d'utilisateur non supporté pour la mise à jour"
            ));
            
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du profil", e);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Erreur lors de la mise à jour du profil: " + e.getMessage()
            ));
        }
    }
}
