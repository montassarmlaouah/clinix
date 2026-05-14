package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "infirmiers")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Infirmier extends User {
    
    // Généré automatiquement (INF-2025-001, INF-2025-002, etc.)
    @Column(nullable = true, unique = true)
    private String numeroOrdre;
}
