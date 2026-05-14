package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Vue super admin : état SMS par clinique (sans exposer la clé API). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CliniqueSmsOverviewDTO {
    private String cliniqueId;
    private String nomClinique;
    private Boolean actif;
    private Boolean abonnementSmsGratuits;
    private Boolean cleApiConfiguree;
    private String tunisiesmsSender;
    private String cleMasquee;
}
