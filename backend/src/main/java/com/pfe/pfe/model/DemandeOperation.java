package com.pfe.pfe.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.pfe.pfe.dto.PerioperatoireDetailsDto;

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
 * Demande d'opération chirurgicale / intervention.
 * Créée par un médecin ou une secrétaire pour un patient.
 */
@Entity
@Table(name = "demandes_operation")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandeOperation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    /** Médecin ou secrétaire qui crée la demande */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "demandeur_id", nullable = false)
    private User demandeur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinique_id")
    private Clinique clinique;

    @Column(nullable = false, length = 256)
    private String typeOperation;

    /** URGENTE, NORMALE, ELECTIF */
    @Column(nullable = false, length = 32)
    private String priorite = "NORMALE";

    /** EN_ATTENTE, APPROUVEE, REFUSEE, PLANIFIEE, EFFECTUEE */
    @Column(nullable = false, length = 32)
    private String statut = "EN_ATTENTE";

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Date prévue de l'opération (si planifiée) */
    @Column
    private LocalDate datePrevue;

    /** CLINIQUE (défaut) ou CABINET (demande émise depuis un cabinet) */
    @Column(nullable = false, length = 32)
    private String origine = "CLINIQUE";

    /** Équipe, produits pharmacie, salle, chambre, remarques (JSONB) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "periops_details", columnDefinition = "jsonb")
    private PerioperatoireDetailsDto periopsDetails;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
