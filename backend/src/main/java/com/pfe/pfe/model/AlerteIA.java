package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertes_ia")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlerteIA {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDateTime date = LocalDateTime.now();
    
    @Column(nullable = false)
    private String type;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private NiveauAlerte niveau;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;
    
    @Column(nullable = false)
    private Boolean traitee = false;
    
    @ManyToOne
    @JoinColumn(name = "modele_ia_id")
    private ModeleIA modeleIA;
    
    @ManyToMany
    @JoinTable(
        name = "alerte_users",
        joinColumns = @JoinColumn(name = "alerte_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private java.util.List<User> utilisateursNotifies = new java.util.ArrayList<>();
    
    public enum NiveauAlerte {
        INFO, WARNING, CRITIQUE, URGENCE
    }
}
