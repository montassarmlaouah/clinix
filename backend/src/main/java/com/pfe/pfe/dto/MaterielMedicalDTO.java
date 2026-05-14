package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterielMedicalDTO {
    private String id;
    private String nom;
    private String categorie;
    private Integer quantite;
    private String emplacement;
    private String cliniqueId;
}
