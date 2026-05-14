package com.pfe.pfe.controller;

import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Contrôleur de diagnostic pour déboguer les problèmes d'utilisateurs
 */
@RestController
@RequestMapping("/api/diagnostic")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class DiagnosticController {
    
    private final UserRepository userRepository;
    private final AdministrateurCliniqueRepository adminRepository;
    
    /**
     * Vérifier si un utilisateur existe par téléphone
     * GET /api/diagnostic/user/{telephone}
     */
    @GetMapping("/user/{telephone}")
    public ResponseEntity<Map<String, Object>> diagnosticUser(@PathVariable String telephone) {
        Map<String, Object> result = new HashMap<>();
        result.put("telephone", telephone);
        
        // Vérifier dans users
        var userOpt = userRepository.findByTelephone(telephone);
        result.put("existeDansUsers", userOpt.isPresent());
        
        if (userOpt.isPresent()) {
            var user = userOpt.get();
            result.put("userId", user.getId());
            result.put("nom", user.getNom());
            result.put("prenom", user.getPrenom());
            result.put("actif", user.getActif());
            result.put("hasPassword", user.getMotDePasse() != null && !user.getMotDePasse().isEmpty());
            result.put("cliniqueId", user.getClinique() != null ? user.getClinique().getId() : null);
        }
        
        // Vérifier dans administrateurs_clinique
        var adminOpt = adminRepository.findByTelephone(telephone);
        result.put("existeDansAdmins", adminOpt.isPresent());
        
        if (adminOpt.isPresent()) {
            var admin = adminOpt.get();
            result.put("adminId", admin.getId());
            result.put("adminNom", admin.getNom());
            result.put("adminPrenom", admin.getPrenom());
            result.put("adminActif", admin.getActif());
            result.put("adminClinique", admin.getClinique() != null ? admin.getClinique().getNom() : null);
        }
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * Lister tous les admins
     * GET /api/diagnostic/admins
     */
    @GetMapping("/admins")
    public ResponseEntity<Map<String, Object>> listAllAdmins() {
        var admins = adminRepository.findAll();
        Map<String, Object> result = new HashMap<>();
        result.put("total", admins.size());
        result.put("admins", admins.stream().map(admin -> Map.of(
            "id", admin.getId(),
            "nom", admin.getNom() != null ? admin.getNom() : "NULL",
            "prenom", admin.getPrenom() != null ? admin.getPrenom() : "NULL",
            "telephone", admin.getTelephone(),
            "actif", admin.getActif() != null ? admin.getActif() : false,
            "clinique", admin.getClinique() != null ? admin.getClinique().getNom() : "NULL"
        )).toList());
        
        return ResponseEntity.ok(result);
    }
}
