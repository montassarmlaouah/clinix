package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ordonnances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ordonnance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDate date = LocalDate.now();
    
    @Column(nullable = false)
    private Boolean signee = false;
    
    @OneToOne
    @JoinColumn(name = "consultation_id")
    private Consultation consultation;
    
    @ManyToOne
    @JoinColumn(name = "patient_id")
    private Patient patient;
    
    @ManyToOne
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;
    
    /** Numéro d'ordonnance affiché (ex: ORD-2025-0001) */
    @Column(name = "numero_ordonnance", length = 50)
    private String numeroOrdonnance;
    
    @OneToMany(mappedBy = "ordonnance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Prescription> prescriptions = new ArrayList<>();
    
    @ManyToOne
    @JoinColumn(name = "pharmacien_validateur_id")
    private Pharmacien pharmacienValidateur;
    
    private Boolean validee = false;

    /** Retourne le patient (depuis consultation ou lien direct). */
    public Patient getPatientEffective() {
        if (patient != null) return patient;
        if (consultation != null && consultation.getPatient() != null) return consultation.getPatient();
        return null;
    }

    /** Retourne le médecin (depuis consultation ou lien direct). */
    public Medecin getMedecinEffective() {
        if (medecin != null) return medecin;
        if (consultation != null && consultation.getMedecin() != null) return consultation.getMedecin();
        return null;
    }
}
