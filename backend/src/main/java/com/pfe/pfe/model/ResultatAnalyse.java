package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "resultats_analyse")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResultatAnalyse {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String parametre;
    
    @Column(nullable = false)
    private String valeur;
    
    @Column(nullable = false)
    private String unite;
    
    private String interpretation;
    
    @Column(nullable = false)
    private Boolean anormal = false;
    
    @ManyToOne
    @JoinColumn(name = "analyse_id", nullable = false)
    private AnalyseLaboratoire analyse;
}
