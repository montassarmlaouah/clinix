package com.pfe.pfe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class LigneMedicamentDTO {

    @NotBlank(message = "Le nom du médicament est requis")
    private String medicament;

    @NotBlank(message = "Le dosage est requis")
    private String dosage;

    @NotBlank(message = "La fréquence est requise")
    private String frequence;

    @NotNull(message = "La durée (jours) est requise")
    @Positive(message = "La durée doit être positive")
    private Integer duree;

    private String instructions;

    /** Référence optionnelle vers un médicament du catalogue (id). */
    private String medicamentId;
}
