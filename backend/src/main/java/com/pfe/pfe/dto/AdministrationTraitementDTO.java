package com.pfe.pfe.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour les traitements administrés par l'infirmier
 * Planning horaire 7h-18h avec traitements spécifiques
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdministrationTraitementDTO {
    
    private String patientId;
    private String infirmierId;
    /** Médecin prescripteur de la tâche (optionnel). */
    private String medecinDemandeurId;
    private LocalDateTime heureAdministration;
    private String typeTraitement;
    private String nomMedicament;
    private String dosage;
    private String voieAdministration;
    private Boolean administre;
    private String observations;
    private String statutExecution;
    private String remarquesInfirmier;
    private String pieceJointeUrl;
    private Boolean prioriteUrgente;
    public AdministrationTraitementDTO(String typeTraitement, String nomMedicament, 
                                       String dosage, String voie) {
        this.typeTraitement = typeTraitement;
        this.nomMedicament = nomMedicament;
        this.dosage = dosage;
        this.voieAdministration = voie;
        this.administre = false;
    }
}
