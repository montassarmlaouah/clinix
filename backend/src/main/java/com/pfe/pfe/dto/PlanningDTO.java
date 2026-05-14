package com.pfe.pfe.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class PlanningDTO {
    private String id;
    private String infirmierId;
    private String infirmierNom;
    private String infirmierPrenom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private LocalTime heureDebut;
    private LocalTime heureFin;
    private String typeShift; // MATIN (7h-13h), APRES_MIDI (13h-19h), GARDE (19h-7h)
    private String statut; // PLANIFIE, VALIDE, ANNULE
}
