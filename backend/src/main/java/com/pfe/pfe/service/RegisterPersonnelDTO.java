package com.pfe.pfe.service;

import lombok.Data;

/**
 * DTO pour l'inscription du personnel (2ème étape)
 */
@Data
public class RegisterPersonnelDTO {

    private String telephone;
    private String nom;
    private String prenom;
    private String motDePasse;
    private String confirmationMotDePasse;
    private String role; // MEDECIN, INFIRMIER, RADIOLOGUE, PHARMACIEN, SECRETAIRE, etc.
    private String specialite;

    /** Ancien flux : code d'invitation ; encore requis si un hash d'invitation est présent sur le compte. */
    private String codeInvitationPdf;
}
