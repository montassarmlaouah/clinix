package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "constantes_vitales")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConstanteVitale {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDateTime dateHeure = LocalDateTime.now();
    
    private Double tension;
    
    private Double temperature;
    
    private Integer frequenceCardiaque;
    
    private Integer saturationOxygene;
    
    private Double poids;
    
    private Double glycemie;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "infirmier_id", nullable = false)
    private Infirmier infirmier;
}
