package com.pfe.pfe.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TeletransmissionResult {
    private String statut;
    private String reference;
    private String message;
    private BigDecimal montantPrisEnCharge;
    private LocalDateTime dateTransmission;
}
