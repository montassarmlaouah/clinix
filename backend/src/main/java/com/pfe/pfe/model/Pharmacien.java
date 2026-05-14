package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pharmaciens")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Pharmacien extends User {
    
    // Généré automatiquement (PHA-2025-001, PHA-2025-002, etc.)
    @Column(nullable = true, unique = true)
    private String numeroOrdre;
}
