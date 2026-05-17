package com.pfe.pfe.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;

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
    /** Médecins suivant le patient (plusieurs autorisés). */
    private List<String> medecinIds = new ArrayList<>();
    /** Médecin référent parmi la liste (doit être dans medecinIds si renseigné). */
    private String medecinReferentId;
}
