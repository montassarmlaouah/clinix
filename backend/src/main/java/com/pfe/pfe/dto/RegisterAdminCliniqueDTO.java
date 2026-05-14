package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour l'enregistrement (register) d'un Administrateur Clinique
 * L'admin vérifie son téléphone et choisit son mot de passe
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterAdminCliniqueDTO {
    
    // Téléphone pour vérifier l'identité (doit exister dans la base)
    private String telephone;
    
    // Infos personnelles
    private String nom;
    
    private String prenom;
    
    // Mot de passe choisi par l'admin
    private String motDePasse;
}
