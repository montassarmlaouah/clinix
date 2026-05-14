package com.pfe.pfe.dto;

import java.time.LocalDate;

import lombok.Data;

/**
 * Création de compte par le Super Admin ({@code POST /api/admin/create-user}).
 */
@Data
public class AdminCreateUserRequest {

    private String nom;
    private String prenom;
    private String telephone;
    /** Ex. ADMIN_CLINIQUE, PATIENT, USER (équivalent PATIENT) */
    private String role;
    private String cliniqueId;
    /** Obligatoire si role = PATIENT / USER */
    private LocalDate dateNaissance;
    private String sexe;
}
