package com.pfe.pfe.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entité pour tracer l'administration des traitements par l'infirmier
 */
@Entity
@Table(name = "administration_traitement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdministrationTraitement {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "infirmier_id", nullable = false)
    private Infirmier infirmier;

    /** Médecin ayant prescrit la tâche de soin / administration (coordination). */
    @Column(name = "medecin_demandeur_id", length = 36)
    private String medecinDemandeurId;

    /**
     * Après réalisation par l'infirmier : EN_ATTENTE si une validation médecin est attendue,
     * puis VALIDE ou REFUSE. Null si pas de circuit de validation.
     */
    @Column(name = "validation_soins_medecin", length = 20)
    private String validationSoinsMedecin;

    @Column(name = "commentaire_validation_medecin", length = 500)
    private String commentaireValidationMedecin;

    private LocalDateTime dateValidationMedecin;

    @Column(name = "medecin_validateur_id", length = 36)
    private String medecinValidateurId;

    /** PLANIFIE | EN_COURS | REALISE | NON_REALISE */
    @Column(name = "statut_execution", length = 24)
    private String statutExecution = "PLANIFIE";

    @Column(name = "remarques_infirmier", columnDefinition = "TEXT")
    private String remarquesInfirmier;

    @Column(name = "piece_jointe_url", length = 500)
    private String pieceJointeUrl;

    private Boolean prioriteUrgente = false;
    
    @Column(nullable = false)
    private LocalDateTime heureAdministration;
    
    @Column(nullable = false, length = 100)
    private String typeTraitement;          // "Antibiothérapie", "Antalgique", etc.
    
    @Column(nullable = false, length = 200)
    private String nomMedicament;
    
    @Column(nullable = false, length = 100)
    private String dosage;
    
    @Column(nullable = false, length = 50)
    private String voieAdministration;      // "IV", "PO", "SC", "IM", etc.
    
    @Column(nullable = false)
    private Boolean administre = false;
    
    @Column(length = 1000)
    private String observations;
    
    private LocalDateTime dateAdministrationReelle;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime dateCreation;
    
    @PrePersist
    protected void onCreate() {
        dateCreation = LocalDateTime.now();
        if (heureAdministration == null) {
            heureAdministration = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        if (administre && dateAdministrationReelle == null) {
            dateAdministrationReelle = LocalDateTime.now();
        }
    }
}
