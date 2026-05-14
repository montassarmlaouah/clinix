package com.pfe.pfe.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Demande de médicaments envoyée à la pharmacie.
 * Créée par un médecin ou une secrétaire, traitée par le pharmacien.
 */
@Entity
@Table(name = "demandes_medicament")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandeMedicament {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    /** Médecin ou secrétaire qui fait la demande */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "demandeur_id", nullable = false)
    private User demandeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinique_id")
    private Clinique clinique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chambre_id")
    @JsonIgnoreProperties({"service", "equipements", "materielIds"})
    private Chambre chambre;

    /** EN_ATTENTE, DELIVREE, REFUSEE, PARTIELLE */
    @Column(nullable = false, length = 32)
    private String statut = "EN_ATTENTE";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "demande", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("demande")
    private List<DemandeMedicamentItem> items = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
