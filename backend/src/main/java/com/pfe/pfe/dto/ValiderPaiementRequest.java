package com.pfe.pfe.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class ValiderPaiementRequest {
    private BigDecimal montantPaye;
    private String modePaiement;
}
