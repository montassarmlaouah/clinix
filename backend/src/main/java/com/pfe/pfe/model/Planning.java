package com.pfe.pfe.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plannings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Planning {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypePlanning type;
    
    @Column(nullable = false)
    private Boolean valide = false;
    
    @ManyToOne
    @JoinColumn(name = "createur_id")
    private ChefPersonnel createur;
    
    @ManyToMany
    @JoinTable(
        name = "planning_users",
        joinColumns = @JoinColumn(name = "planning_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<User> utilisateurs = new ArrayList<>();
    
    @OneToMany(mappedBy = "planning", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Garde> gardes = new ArrayList<>();
    
    public enum TypePlanning {
        HEBDOMADAIRE, MENSUEL, GARDE
    }
}
