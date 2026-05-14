package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Ligne d'équipe périopératoire (ex. 2 médecins d'une spécialité). */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipeMedicaleLigneDto {
    /** ID médecin de l'établissement (optionnel) */
    private String medecinId;
    /** Si pas d'ID : nom libre */
    private String nomComplet;
    private String specialite;
    /** Ex. OPERATEUR, ASSISTANT, ANESTHESISTE */
    private String role;
}
