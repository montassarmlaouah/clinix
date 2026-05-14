package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "modeles_ia")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModeleIA {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String nom;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeModeleIA type;
    
    @Column(nullable = false)
    private String version;
    
    private BigDecimal precision;
    
    @Column(nullable = false)
    private Boolean actif = true;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    public enum TypeModeleIA {
        CLASSIFICATION_IMAGERIE,
        ANALYSE_LABORATOIRE,
        PREDICTION_STOCK,
        DETECTION_ANOMALIE,
        AUTRE
    }
}
