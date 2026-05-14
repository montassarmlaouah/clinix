package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO utilisé par le Super Admin pour créer
 * un nouvel administrateur de clinique rattaché
 * à une clinique existante.
 *
 * Le mot de passe est généré automatiquement et envoyé par SMS (TunisieSMS).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreerAdministrateurCliniqueDTO {

    private String nom;
    private String prenom;
    private String telephone;
    private String email;
    private String cliniqueId;
}

