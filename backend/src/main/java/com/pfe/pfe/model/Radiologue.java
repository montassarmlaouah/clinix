package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "radiologues")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Radiologue extends User {
    
    // Généré automatiquement (RAD-2025-001, RAD-2025-002, etc.)
    @Column(nullable = true, unique = true)
    private String numeroOrdre;
}
