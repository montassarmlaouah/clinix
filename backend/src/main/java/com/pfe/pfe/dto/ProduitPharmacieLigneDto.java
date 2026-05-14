package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProduitPharmacieLigneDto {
    private String libelle;
    private Integer quantite;
    private String note;
}
