package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "absences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Absence {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDate dateDebut;
    
    @Column(nullable = false)
    private LocalDate dateFin;
    
    @Column(nullable = false)
    private String motif;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutAbsence statut = StatutAbsence.EN_ATTENTE;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User utilisateur;
    
    @ManyToOne
    @JoinColumn(name = "validateur_id")
    private ChefPersonnel validateur;
    
    public enum StatutAbsence {
        EN_ATTENTE, APPROUVEE, REFUSEE
    }
}
