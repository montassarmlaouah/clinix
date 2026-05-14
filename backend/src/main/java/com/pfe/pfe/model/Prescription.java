package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "prescriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Prescription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String medicament;
    
    @Column(nullable = false)
    private String dosage;
    
    @Column(nullable = false)
    private String frequence;
    
    @Column(nullable = false)
    private Integer duree;
    
    @Column(columnDefinition = "TEXT")
    private String instructions;
    
    @ManyToOne
    @JoinColumn(name = "ordonnance_id")
    private Ordonnance ordonnance;
    
    @ManyToOne
    @JoinColumn(name = "medicament_id")
    private Medicament medicamentDetail;
}
