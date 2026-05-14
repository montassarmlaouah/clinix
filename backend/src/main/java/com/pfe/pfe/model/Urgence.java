package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "urgences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Urgence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "medecin_id")
    private Medecin medecinAssigne;

    @ManyToOne
    @JoinColumn(name = "signale_par_id")
    private User signalePar;

    @Column(nullable = false)
    private String motif;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NiveauUrgence niveau = NiveauUrgence.MOYENNE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutUrgence statut = StatutUrgence.EN_ATTENTE;

    @Column(nullable = false)
    private LocalDateTime dateSignalement = LocalDateTime.now();

    private LocalDateTime datePriseEnCharge;

    private LocalDateTime dateCloture;

    @Column(columnDefinition = "TEXT")
    private String notesTraitement;

    public enum NiveauUrgence {
        FAIBLE, MOYENNE, HAUTE, CRITIQUE
    }

    public enum StatutUrgence {
        EN_ATTENTE, PRISE_EN_CHARGE, EN_TRAITEMENT, RESOLUE, TRANSFEREE
    }
}
