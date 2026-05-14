package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dossiers_medicaux")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DossierMedical {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
    
    @Column(columnDefinition = "TEXT")
    private String antecedents;

    /** Notes réservées au personnel médical (non sérialisées vers le patient / API publique). */
    @JsonIgnore
    @Column(name = "notes_confidentielles", columnDefinition = "TEXT")
    private String notesConfidentielles;
    
    @ElementCollection
    @CollectionTable(name = "allergies", joinColumns = @JoinColumn(name = "dossier_id"))
    @Column(name = "allergie")
    private List<String> allergies = new ArrayList<>();
    
    @OneToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;
    
    @OneToMany(mappedBy = "dossierMedical")
    private List<Consultation> consultations = new ArrayList<>();
    
    @OneToMany(mappedBy = "dossierMedical")
    private List<ImagerieDICOM> imageries = new ArrayList<>();
    
    @OneToMany(mappedBy = "dossierMedical")
    private List<AnalyseLaboratoire> analyses = new ArrayList<>();
}
