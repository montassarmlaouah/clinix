package com.pfe.pfe.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Service {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String nom;
    
    @Column(nullable = false)
    private String description;
    
    @Column(nullable = false)
    private Boolean actif = true;
    
    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
    
    @Column(name = "nombre_chambres", nullable = false)
    private Integer nombreChambres = 0;
    
    @Column(name = "nombre_lits", nullable = false)
    private Integer nombreLits = 0;
    
    @ManyToOne
    @JoinColumn(name = "clinique_id", nullable = false)
    private Clinique clinique;
    
    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Chambre> chambres = new ArrayList<>();
    
    @OneToMany(mappedBy = "service")
    @JsonIgnore
    private List<User> personnel = new ArrayList<>();
}
