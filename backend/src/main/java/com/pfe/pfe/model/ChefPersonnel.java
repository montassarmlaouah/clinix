package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chefs_personnel")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class ChefPersonnel extends User {
    
    // Généré automatiquement (CHF-2025-001, CHF-2025-002, etc.)
    @Column(nullable = true, unique = true)
    private String numeroOrdre;
}
