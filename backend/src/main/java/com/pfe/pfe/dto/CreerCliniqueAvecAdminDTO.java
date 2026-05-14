package com.pfe.pfe.dto;

import lombok.Data;

/**
 * DTO pour créer une clinique avec son administrateur (par le super admin)
 */
@Data
public class CreerCliniqueAvecAdminDTO {

    // Informations de la clinique
    private String nomClinique;
    private String adresseClinique;
    private String villeClinique;
    private Integer capacite;
    private String telephoneClinique;

    // Informations de l'administrateur de clinique
    private String nomAdmin;
    private String prenomAdmin;
    private String telephoneAdmin;
    private String emailAdmin;

    /** MONTHLY ou YEARLY — préférence à l’onboarding clinique (facturation Stripe). */
    private String preferenceFacturation;
}
