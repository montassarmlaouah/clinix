package com.pfe.pfe.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rendez_vous")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RendezVous {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDateTime dateHeure;
    
    @Column(nullable = false)
    private String motif;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutRendezVous statut = StatutRendezVous.PLANIFIE;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "medecin_id", nullable = false)
    private Medecin medecin;

    /** Validation de visite / passage infirmier (coordination). */
    private Boolean visiteValideeParInfirmier = false;

    private LocalDateTime dateValidationVisiteInfirmier;

    @Column(name = "infirmier_validation_visite_id", length = 36)
    private String infirmierValidationVisiteId;

    @Column(name = "observations_visite_infirmier", length = 2000)
    private String observationsVisiteInfirmier;

    /** Trace applicative type « signature » (empreinte du jeton de validation). */
    @Column(name = "empreinte_signature_visite", length = 128)
    private String empreinteSignatureVisite;
    
    public enum StatutRendezVous {
        PLANIFIE, CONFIRME, ANNULE, TERMINE
    }
}
