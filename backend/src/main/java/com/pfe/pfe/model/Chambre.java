package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "chambres")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Chambre {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, unique = true)
    private String numero;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeChambre type;
    
    @Column(nullable = false)
    private Integer capacite;
    
    @Column(nullable = false)
    private Integer nombreLits = 1;
    
    @Column(nullable = false)
    private Boolean disponible = true;
    
    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    private Service service;
    
    @ElementCollection
    @CollectionTable(name = "chambre_materiels", joinColumns = @JoinColumn(name = "chambre_id"))
    @Column(name = "materiel_id")
    private List<String> materielIds;
    
    @ElementCollection
    @CollectionTable(name = "chambre_equipements", joinColumns = @JoinColumn(name = "chambre_id"))
    @Column(name = "equipement")
    private List<String> equipements;
    
    public enum TypeChambre {
        SIMPLE, DOUBLE, SUITE, REANIMATION, URGENCE
    }
}
