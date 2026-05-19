package com.pfe.pfe.dto;

import java.math.BigDecimal;

import com.pfe.pfe.model.TypePrestation;

import lombok.Data;

@Data
public class PrestationFacturationRequest {
    private String cliniqueId;
    private TypePrestation type;
    private String code;
    private String libelle;
    private BigDecimal tarifUnitaire;
    private Integer tauxRemboursementPct;
    private Boolean actif;
}
