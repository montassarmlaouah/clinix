package com.pfe.pfe.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "patient_medecins",
    uniqueConstraints = @UniqueConstraint(columnNames = { "patient_id", "medecin_id" })
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientMedecin {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnore
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "medecin_id", nullable = false)
    @JsonIgnoreProperties({ "clinique", "service", "roles", "motDePasse", "patients" })
    private Medecin medecin;

    /** Médecin référent / principal pour ce patient */
    @Column(nullable = false)
    private Boolean principal = false;

    @Column(nullable = false)
    private LocalDateTime dateAttribution = LocalDateTime.now();
}
