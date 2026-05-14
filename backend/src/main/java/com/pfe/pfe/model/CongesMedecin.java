package com.pfe.pfe.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

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

/**
 * Congé / absence planifiée d'un médecin.
 * Utilisé par la secrétaire pour filtrer les médecins disponibles.
 */
@Entity
@Table(name = "conges_medecin")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CongesMedecin {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "medecin_id", nullable = false)
    private Medecin medecin;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = false)
    private LocalDate dateFin;

    /** ANNUEL, MALADIE, MATERNITE, PATERNITE, AUTRE */
    @Column(nullable = false, length = 32)
    private String typeConge = "ANNUEL";

    /** EN_ATTENTE, APPROUVE, REFUSE */
    @Column(nullable = false, length = 32)
    private String statut = "EN_ATTENTE";

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
