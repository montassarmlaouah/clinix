package com.pfe.pfe.model;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnore;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lignes_facture_patient")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LigneFacturePatient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    @JsonIgnore
    private FacturePatient facture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypePrestation typePrestation;

    @Column(nullable = false, length = 32)
    private String codeActe;

    @Column(nullable = false)
    private String libelle;

    @Column(nullable = false)
    private Integer quantite = 1;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal prixUnitaire;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal montantLigne;

    @Column(nullable = false)
    private Integer tauxRemboursementPct = 80;
}
