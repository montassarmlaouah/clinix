package com.pfe.pfe.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PatientDTO {
    private String nom;
    private String prenom;
    private String telephone;
    private String motDePasse;
    private LocalDate dateNaissance;
    private String sexe;
    private String groupeSanguin;
    private String adresse;
    private String typeAdmission;
    private String cliniqueId;
}
