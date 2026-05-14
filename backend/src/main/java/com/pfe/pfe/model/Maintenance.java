package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "maintenances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Maintenance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeMaintenance type;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutMaintenance statut = StatutMaintenance.PLANIFIEE;
    
    @ManyToOne
    @JoinColumn(name = "equipement_id", nullable = false)
    private Equipement equipement;
    
    @ManyToOne
    @JoinColumn(name = "technicien_id")
    private TechnicienMaintenance technicien;
    
    public enum TypeMaintenance {
        PREVENTIVE, CORRECTIVE, URGENTE
    }
    
    public enum StatutMaintenance {
        PLANIFIEE, EN_COURS, TERMINEE, ANNULEE
    }
}
