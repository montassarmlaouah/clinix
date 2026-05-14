package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entité pour la surveillance infirmière continue
 * Permet le suivi détaillé des paramètres vitaux et cliniques d'un patient
 */
@Entity
@Table(name = "surveillance_infirmiere")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SurveillanceInfirmiere {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infirmier_id", nullable = false)
    private Infirmier infirmier;
    
    @Column(nullable = false)
    private LocalDateTime heureObservation;
    
    // Paramètres vitaux
    private Double tensionArterielleSystemique;  // mmHg (ex: 120)
    private Double tensionArterielleDiastolique; // mmHg (ex: 60)
    private Integer frequenceCardiaque;          // bpm
    private Integer frequenceRespiratoire;       // cycles/min
    private Double saturationOxygene;            // % (ex: 92.0)
    private Double temperature;                  // °C
    
    // Paramètres métaboliques
    private Double glycemieCapillaire;           // g/L (ex: 1.82)
    private Boolean acetonuriePositive;
    private Boolean glucosuriePositive;
    
    // Bilan hydrique
    private Integer entreesHydriques;            // ml
    private Integer sortiesUrines;               // ml
    
    @Column(length = 500)
    private String typeHydratation;              // "S. Phys 500ml", "Orale", etc.
    
    // État clinique
    private Integer scoreGlasgow;                // 3-15
    private Integer scoreEVA;                    // 0-10 (douleur)
    
    @Column(length = 100)
    private String etatConscience;               // "Alert", "Confus", "Somnolent"
    
    @Column(length = 100)
    private String etatRespiratoire;             // "Normal", "Dyspnée", "Polypnée"
    
    // Oxygénothérapie
    private Boolean sousOxygene;
    private Double debitOxygene;                 // L/min
    
    @Column(length = 100)
    private String modeAdministration;           // "Lunettes", "Masque"
    
    // Observations et alertes
    @Column(length = 2000)
    private String observations;
    
    private Boolean alerteDeclenche;
    
    @Column(length = 500)
    private String typeAlerte;                   // "SpO2 < 94%", "Glycémie > 2.5", etc.
    
    // Soins prodigués
    @Column(length = 2000)
    private String soinsRealises;
    
    private Boolean aerosoltherapieAdministree;
    
    @Column(length = 2000)
    private String medicamentsAdministres;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;
    
    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (heureObservation == null) {
            heureObservation = LocalDateTime.now();
        }
    }
}
