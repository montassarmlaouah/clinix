package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Consultation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDateTime date = LocalDateTime.now();
    
    @Column(nullable = false)
    private String motif;
    
    @Column(columnDefinition = "TEXT")
    private String diagnostic;
    
    @Column(columnDefinition = "TEXT")
    private String observations;
    
    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "medecin_id", nullable = false)
    private Medecin medecin;
    
    @ManyToOne
    @JoinColumn(name = "dossier_medical_id")
    private DossierMedical dossierMedical;
    
    @OneToOne(mappedBy = "consultation", cascade = CascadeType.ALL)
    private Ordonnance ordonnance;
}
