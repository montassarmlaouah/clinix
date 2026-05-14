package com.pfe.pfe.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AbsenceDTO {
    private String id;
    private String infirmierId;
    private String infirmierNom;
    private String infirmierPrenom;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String typeAbsence; // CONGE, MALADIE, AUTRE
    private String motif;
    private String statut; // EN_ATTENTE, APPROUVE, REFUSE
}
