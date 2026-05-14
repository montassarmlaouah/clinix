package com.pfe.pfe.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class GardeDTO {
    private String id;
    private String infirmierId;
    private String infirmierNom;
    private String infirmierPrenom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private Integer dureeJours; // Toujours 2 jours
    private String statut; // EN_COURS, TERMINE
}
