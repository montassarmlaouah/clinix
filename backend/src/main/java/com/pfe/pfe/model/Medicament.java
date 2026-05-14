package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Entity
@Table(name = "medicaments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medicament {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String nom;

    @Column
    private String description;
    
    @Column(nullable = false)
    private String forme;
    
    @Column(nullable = false)
    private String dosage;
    
    @Column(nullable = false)
    private BigDecimal prix;
    
    @Column(nullable = false, unique = true)
    private String code;
}
