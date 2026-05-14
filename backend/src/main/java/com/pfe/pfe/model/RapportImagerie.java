package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rapports_imagerie")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RapportImagerie {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDate date = LocalDate.now();
    
    @Column(columnDefinition = "TEXT")
    private String observations;
    
    @Column(columnDefinition = "TEXT")
    private String conclusion;

    /** Analyse / interprétation structurée (colonne DB : {@code analyse_radiologique} — « analyse » est réservé en PostgreSQL). */
    @Column(name = "analyse_radiologique", columnDefinition = "TEXT")
    private String analyse;

    /** Recommandations cliniques ou examens complémentaires. */
    @Column(columnDefinition = "TEXT")
    private String recommandations;

    @Column(columnDefinition = "TEXT")
    private String diagnosticDifferentiel;

    @Column(columnDefinition = "TEXT")
    private String signesCliniquesNotables;

    /** Horodatage de la validation (signature électronique logique). */
    private LocalDateTime dateSignatureElectronique;
    
    @Column(nullable = false)
    private Boolean valide = false;
    
    @OneToOne
    @JoinColumn(name = "imagerie_id", nullable = false)
    private ImagerieDICOM imagerie;
    
    @ManyToOne
    @JoinColumn(name = "radiologue_id", nullable = false)
    private Radiologue radiologue;
}
