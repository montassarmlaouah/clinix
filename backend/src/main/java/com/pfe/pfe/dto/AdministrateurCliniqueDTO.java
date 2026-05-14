package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour la création d'un Administrateur Clinique par le Super Admin
 * Seuls telephone et cliniqueId sont nécessaires
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdministrateurCliniqueDTO {
    
    // Utilisé par Super Admin pour créer l'admin
    private String telephone;
    
    private String cliniqueId;
}
