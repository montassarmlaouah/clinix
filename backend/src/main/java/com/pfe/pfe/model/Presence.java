package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "presences")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Presence {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "infirmier_id", nullable = false)
    private Infirmier infirmier;
    
    @Column(name = "date_presence", nullable = false)
    private LocalDate datePresence;
    
    @Column(name = "heure_arrivee")
    private LocalTime heureArrivee;
    
    @Column(name = "heure_depart")
    private LocalTime heureDepart;
    
    @Column(name = "present")
    private Boolean present;
    
    @Column(name = "statut")
    private String statut; // PRESENT, ABSENT, RETARD, CONGE
    
    @Column(name = "observation", length = 500)
    private String observation;
    
    @ManyToOne
    @JoinColumn(name = "marque_par")
    private ChefPersonnel marquePar;
    
    @PrePersist
    public void definirStatut() {
        if (statut == null) {
            if (present) {
                // Vérifier si retard (exemple: shift MATIN commence à 7h)
                if (heureArrivee != null && heureArrivee.isAfter(LocalTime.of(7, 15))) {
                    statut = "RETARD";
                } else {
                    statut = "PRESENT";
                }
            } else {
                statut = "ABSENT";
            }
        }
    }
}
