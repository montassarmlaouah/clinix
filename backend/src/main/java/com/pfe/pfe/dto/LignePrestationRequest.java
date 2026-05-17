package com.pfe.pfe.dto;

import com.pfe.pfe.model.TypePrestation;

import lombok.Data;

@Data
public class LignePrestationRequest {
    private TypePrestation type;
    private Integer quantite = 1;
}
