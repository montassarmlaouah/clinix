package com.pfe.pfe.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "prestations_facturation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrestationFacturation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String cliniqueId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypePrestation type;

    /** Code acte (ex. CNAM / nomenclature interne) */
    @Column(nullable = false, length = 32)
    private String code;

    @Column(nullable = false)
    private String libelle;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal tarifUnitaire;

    /** Taux de remboursement CNAM (0–100 %) */
    @Column(nullable = false)
    private Integer tauxRemboursementPct = 80;

    @Column(nullable = false)
    private Boolean actif = true;
}
