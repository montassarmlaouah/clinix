package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lecture de la configuration SMS TunisieSMS d'une clinique (clé jamais en clair).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CliniqueTunisieSmsConfigDTO {

    private boolean abonnementSmsGratuits;
    private String tunisiesmsSender;
    private boolean cleConfiguree;
    /** Ex. "************a1b2" ou null */
    private String cleMasquee;
}
