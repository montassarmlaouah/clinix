package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "analyses_laboratoire")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyseLaboratoire {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDate date = LocalDate.now();
    
    @Column(nullable = false)
    private String type;
    
    private String fichierPDF;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutAnalyse statut = StatutAnalyse.EN_ATTENTE;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "dossier_medical_id")
    private DossierMedical dossierMedical;
    
    @OneToMany(mappedBy = "analyse", cascade = CascadeType.ALL)
    private List<ResultatAnalyse> resultats = new ArrayList<>();
    
    public enum StatutAnalyse {
        EN_ATTENTE, EN_COURS, TERMINE, VALIDE
    }
}
