package com.pfe.pfe.dto;

import java.time.LocalDateTime;

import lombok.Data;

/**
 * DTO pour la surveillance infirmière continue
 * Cas clinique : Patient MOHAMED LAMIN ALMACHAT (80 ans)
 * Pathologie : Déséquilibre glycémique avec déshydratation et atteinte respiratoire
 */
@Data
public class SurveillanceInfirmiereDTO {
    
    // Identification
    private String patientId;
    private String numeroPatient;
    private String infirmierId;
    private LocalDateTime heureObservation;
    
    // Paramètres vitaux
    private Double tensionArterielleSystemique;  // ex: 12 (120 mmHg)
    private Double tensionArterielleDiastolique; // ex: 6 (60 mmHg)
    private Integer frequenceCardiaque;          // bpm
    private Integer frequenceRespiratoire;       // cycles/min
    private Double saturationOxygene;            // % (ex: 92%)
    private Double temperature;                  // °C
    
    // Paramètres métaboliques
    private Double glycemieCapillaire;           // g/L (ex: 1.82)
    private Boolean acetonuriePositive;
    private Boolean glucosuriePositive;
    
    // Bilan hydrique
    private Integer entreesHydriques;            // ml
    private Integer sortiesUrines;               // ml
    private String typeHydratation;              // "S. Phys 500ml", "Orale", etc.
    
    // État clinique
    private Integer scoreGlasgow;                // 3-15
    private Integer scoreEVA;                    // 0-10 (douleur)
    private String etatConscience;               // "Alert", "Confus", "Somnolent"
    private String etatRespiratoire;             // "Normal", "Dyspnée", "Polypnée"
    
    // Oxygénothérapie
    private Boolean sousOxygene;
    private Double debitOxygene;                 // L/min
    private String modeAdministration;           // "Lunettes", "Masque"
    
    // Observations et alertes
    private String observations;
    private Boolean alerteDeclenche;
    private String typeAlerte;                   // "SpO2 < 94%", "Glycémie > 2.5", etc.
    
    // Soins prodigués
    private String soinsRealises;
    private Boolean aerosoltherapieAdministree;
    private String medicamentsAdministres;
}
