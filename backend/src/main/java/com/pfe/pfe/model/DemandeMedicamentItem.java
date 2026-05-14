package com.pfe.pfe.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "demandes_medicament_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandeMedicamentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "demande_id", nullable = false)
    @JsonIgnoreProperties("items")
    private DemandeMedicament demande;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medicament_id", nullable = false)
    private Medicament medicament;

    @Column(nullable = false)
    private Integer quantite = 1;

    @Column(columnDefinition = "TEXT")
    private String instructions;
}
