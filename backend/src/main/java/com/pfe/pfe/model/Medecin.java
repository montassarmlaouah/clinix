package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "medecins")
@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
public class Medecin extends User {
    
    // Nullable pour création en 2 étapes
    @Column(nullable = true)
    private String specialite;

    /** Téléphone fixe du cabinet (optionnel) */
    @Column(nullable = true)
    private String telephoneFixe;

    /** Adresse / localisation du cabinet médical (super admin — médecin sans clinique) */
    @Column(nullable = true, length = 500)
    private String localisation;
    
    // Généré automatiquement (MED-2025-001, MED-2025-002, etc.)
    @Column(nullable = true, unique = true)
    private String numeroOrdre;

    @Column(name = "stripe_customer_id", length = 128)
    private String stripeCustomerId;

    /** Accès activité cabinet (médecin de clinique ou cabinet indépendant). */
    @Column(name = "acces_cabinet")
    private Boolean accesCabinet = false;
}
