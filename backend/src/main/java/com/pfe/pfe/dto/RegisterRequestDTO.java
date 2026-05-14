package com.pfe.pfe.dto;

import lombok.Data;

/**
 * DTO pour l'enregistrement avec téléphone
 */
@Data
public class RegisterRequestDTO {
    private String telephone;
    private String nom; // Optionnel - généré automatiquement si non fourni
    private String prenom; // Optionnel - généré automatiquement si non fourni
    private String motDePasse;
    private String confirmationMotDePasse;
    private String role; // Optionnel - par défaut "PATIENT" si non fourni

    // Optionnel - spécialité pour les médecins
    private String specialite;
}
