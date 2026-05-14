package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la connexion d'un Administrateur Clinique
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginAdminCliniqueDTO {
    
    private String telephone;
    
    private String motDePasse;
}
