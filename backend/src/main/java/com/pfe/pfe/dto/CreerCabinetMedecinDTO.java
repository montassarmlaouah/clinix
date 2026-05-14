package com.pfe.pfe.dto;

import lombok.Data;

/**
 * Création / mise à jour d'un cabinet médecin par le super admin (médecin sans clinique).
 */
@Data
public class CreerCabinetMedecinDTO {

    private String nom;
    private String prenom;
    private String telephone;
    private String specialite;
    /** Téléphone fixe du cabinet */
    private String telephoneFixe;
    /** Adresse du cabinet */
    private String localisation;

    /** CIN — obligatoire à la création ; sert à rattacher un compte médecin cabinet existant (même mobile, sans clinique). */
    private String numeroPieceIdentite;
}
