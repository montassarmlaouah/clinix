package com.pfe.pfe.dto;

import lombok.Data;

/**
 * DTO pour l'enregistrement de l'administrateur de clinique
 * L'admin utilise son téléphone pour vérifier son compte et choisir un mot de passe
 */
@Data
public class EnregistrementAdminCliniqueDTO {
    private String telephone;
    private String motDePasse;
    private String confirmationMotDePasse;
}
