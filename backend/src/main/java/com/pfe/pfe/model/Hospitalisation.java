package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "hospitalisations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hospitalisation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDate dateEntree;
    
    private LocalDate dateSortie;
    
    @Column(nullable = false)
    private String motif;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutHospitalisation statut = StatutHospitalisation.EN_COURS;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "medecin_id", nullable = false)
    private Medecin medecin;
    
    @ManyToOne
    @JoinColumn(name = "chambre_id")
    private Chambre chambre;
    
    public enum StatutHospitalisation {
        EN_COURS, TERMINEE, ANNULEE
    }
}
