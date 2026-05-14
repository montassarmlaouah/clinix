package com.pfe.pfe.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Détails périopératoires : équipe, besoins pharmacie, salle / chambre.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PerioperatoireDetailsDto {

    private List<EquipeMedicaleLigneDto> equipe = new ArrayList<>();
    private List<ProduitPharmacieLigneDto> produits = new ArrayList<>();
    private String sallePrevue;
    private String chambrePrevue;
    private String remarquesMoyens;
}
