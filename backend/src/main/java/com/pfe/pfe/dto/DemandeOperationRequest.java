package com.pfe.pfe.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class DemandeOperationRequest {
    private String patientId;
    private String typeOperation;
    private String priorite; // URGENTE, NORMALE, ELECTIF
    private String description;
    private LocalDate datePrevue;
    /** CLINIQUE | CABINET */
    private String origine;
    /** Clinique hôpital cible (obligatoire si le demandeur n'est pas rattaché à une clinique) */
    private String cliniqueCibleId;
    private PerioperatoireDetailsDto periopsDetails;
}
