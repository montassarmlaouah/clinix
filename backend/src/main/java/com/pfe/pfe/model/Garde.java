package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "gardes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Garde {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDateTime debut;
    
    @Column(nullable = false)
    private LocalDateTime fin;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeGarde type;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User utilisateur;
    
    @ManyToOne
    @JoinColumn(name = "planning_id")
    private Planning planning;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private Service service;
    
    public enum TypeGarde {
        JOUR, NUIT, WEEKEND
    }
}
