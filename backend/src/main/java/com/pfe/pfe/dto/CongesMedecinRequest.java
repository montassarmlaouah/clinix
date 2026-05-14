package com.pfe.pfe.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class CongesMedecinRequest {
    private String medecinId;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String typeConge; // ANNUEL, MALADIE, MATERNITE, PATERNITE, AUTRE
    private String motif;
}
