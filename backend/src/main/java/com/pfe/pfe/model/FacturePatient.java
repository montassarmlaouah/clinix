package com.pfe.pfe.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "factures_patient")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacturePatient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, length = 40)
    private String numeroFacture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"dossierMedical", "medecinCabinet", "roles", "motDePasse", "clinique", "service"})
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinique_id", nullable = false)
    @JsonIgnoreProperties({"services", "administrateurs"})
    private Clinique clinique;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospitalisation_id")
    @JsonIgnoreProperties({"patient", "medecin", "chambre"})
    private Hospitalisation hospitalisation;

    @Column(nullable = false)
    private LocalDate dateFacture = LocalDate.now();

    private LocalDate dateSortie;

    @Column(nullable = false)
    private Integer nombreJours = 0;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal montantTotal = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal montantRemboursable = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal ticketModerateur = BigDecimal.ZERO;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutFacturePatient statut = StatutFacturePatient.BROUILLON;

    private String referenceTeletransmission;

    private LocalDateTime dateTeletransmission;

    @Column(length = 500)
    private String notes;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<LigneFacturePatient> lignes = new ArrayList<>();
}
