package com.pfe.pfe.service;

import java.time.LocalDateTime;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.dto.OtpIssueResult;
import com.pfe.pfe.dto.RegisterRequestDTO;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service pour gérer l'authentification et l'enregistrement des utilisateurs
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpSmsService otpSmsService;
    
    /**
     * Envoyer un code OTP au téléphone
     */
    public OtpIssueResult envoyerCodeOtp(String telephone) {
        log.info("Envoi du code OTP au téléphone: {}", telephone);
        return otpSmsService.envoyerCodeOtp(telephone);
    }
    
    /**
     * Vérifier un code OTP
     */
    public boolean verifierCodeOtp(String telephone, String codeOtp) {
        log.info("Vérification du code OTP pour le téléphone: {}", telephone);
        return otpSmsService.verifierCodeOtp(telephone, codeOtp);
    }
    
    /**
     * Vérifier si un téléphone existe déjà
     */
    public boolean telephoneExiste(String telephone) {
        return userRepository.existsByTelephone(telephone);
    }

    /**
     * Vérifier si un compte est en attente (mot de passe non défini)
     */
    public boolean compteEnAttente(String telephone) {
        return userRepository.findByTelephone(telephone)
                .map(user -> user.getMotDePasse() == null || user.getMotDePasse().trim().isEmpty())
                .orElse(false);
    }
    
    /**
     * Enregistrer un nouveau patient (utilisateur)
     */
    public Patient enregistrerPatient(RegisterRequestDTO dto) {
        // Vérifier que les mots de passe correspondent
        if (!dto.getMotDePasse().equals(dto.getConfirmationMotDePasse())) {
            throw new RuntimeException("Les mots de passe ne correspondent pas");
        }
        
        // Vérifier si le téléphone existe déjà
        if (telephoneExiste(dto.getTelephone())) {
            throw new RuntimeException("Un utilisateur avec ce numéro de téléphone existe déjà");
        }
        
        // Créer un nouveau patient
        Patient patient = new Patient();
        
        // Utiliser les valeurs fournies ou des valeurs par défaut
        patient.setNom(dto.getNom() != null && !dto.getNom().isEmpty() ? dto.getNom() : "Patient");
        patient.setPrenom(dto.getPrenom() != null && !dto.getPrenom().isEmpty() ? dto.getPrenom() : dto.getTelephone());
        patient.setTelephone(dto.getTelephone());
        patient.setMotDePasse(passwordEncoder.encode(dto.getMotDePasse()));
        patient.setDateCreation(LocalDateTime.now());
        patient.setActif(true);
        
        // Générer un numéro patient unique
        patient.setNumeroPatient("PAT-" + System.currentTimeMillis());
        
        log.info("Enregistrement du nouveau patient: {} {}", patient.getPrenom(), patient.getNom());
        return userRepository.save(patient);
    }
    
    /**
     * Authentifier un utilisateur par téléphone
     */
    public boolean authentifier(String telephone, String motDePasse) {
        var userOpt = userRepository.findByTelephone(telephone);
        
        if (userOpt.isEmpty()) {
            return false;
        }
        
        var user = userOpt.get();
        
        // Vérifier si le compte est actif
        if (!user.getActif()) {
            throw new RuntimeException("Ce compte est désactivé");
        }
        
        // Vérifier le mot de passe
        return passwordEncoder.matches(motDePasse, user.getMotDePasse());
    }
    
    /**
     * Obtenir un utilisateur par téléphone
     */
    public com.pfe.pfe.model.User obtenirUtilisateurParTelephone(String telephone) {
        return userRepository.findByTelephone(telephone)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }
}
