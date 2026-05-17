package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedecinAttributionDto {
    private String id;
    private String nom;
    private String prenom;
    private String specialite;
    private Boolean principal;
}
