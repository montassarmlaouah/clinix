package com.pfe.pfe.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * DTO de réponse après vérification du téléphone
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class VerificationTelephoneResponse {
    private boolean existe;
    private String message;
    private String id;
    private String nom;
    private String prenom;
    private String telephone;
    private String cliniqueId;
    private String nomClinique;
    private boolean motDePasseDefini;
}
