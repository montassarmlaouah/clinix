package com.pfe.pfe.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class PresenceDTO {
    private String id;
    private String infirmierId;
    private String infirmierNom;
    private String infirmierPrenom;
    private LocalDate datePresence;
    private LocalTime heureArrivee;
    private LocalTime heureDepart;
    private Boolean present; // true = présent, false = absent
    private String statut; // PRESENT, ABSENT, RETARD, CONGE
    private String observation;
    private String marquePar; // ID du chef de personnel
}
