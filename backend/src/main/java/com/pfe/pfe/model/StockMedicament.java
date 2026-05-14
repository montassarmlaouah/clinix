package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "stock_medicaments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMedicament {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private Integer quantite;
    
    @Column(nullable = false)
    private LocalDate dateExpiration;
    
    @Column(nullable = false)
    private String lot;
    
    @Column(nullable = false)
    private Integer seuilAlerte = 10;
    
    @ManyToOne
    @JoinColumn(name = "medicament_id", nullable = false)
    private Medicament medicament;
    
    @ManyToOne
    @JoinColumn(name = "clinique_id")
    private Clinique clinique;
}
