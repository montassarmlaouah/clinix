package com.pfe.pfe.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "equipements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Equipement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;


    @Column(name = "nom")
    private String nom;

    @Column(name = "code", unique = true)
    private String code;

    @Column(name = "description")
    private String description;


    @Enumerated(EnumType.STRING)
    private CategorieEquipement categorie;

    @Column(name = "type", nullable = false)
    @Builder.Default
    @JsonIgnore
    private String type = "EQUIPEMENT";

    private Integer quantite;

    @Enumerated(EnumType.STRING)
    @Column(name = "etat_technique")
    private EtatTechnique etatTechnique;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut")
    private StatutEquipement statut;

    @Enumerated(EnumType.STRING)
    @Column(name = "criticite")
    private CriticiteEquipement criticite;




    @Enumerated(EnumType.STRING)
    private TypeLocalisation typeLocalisation;

    private String localisation;

    private String notes;

    private LocalDate dateAchat;

    @Column(name = "date_maintenance")
    private LocalDateTime dateMaintenance;

    @Column(name = "date_maintenance_prochaine")
    private LocalDate dateMaintenanceProchaine;


    @Column(name = "chambre_id")
    private String chambreId;

    private String cliniqueId;

    @PrePersist
    protected void onCreate() {
        if (this.statut == null) {
            this.statut = StatutEquipement.DISPONIBLE;
        }
        if (this.criticite == null) {
            this.criticite = CriticiteEquipement.MOYENNE;
        }
        if (this.type == null || this.type.trim().isEmpty()) {
            this.type = "EQUIPEMENT";
        }
        if (this.dateAchat == null) {
            this.dateAchat = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        // Pas de synchro: 'statut' est la source principale
    }

    public enum CategorieEquipement {
        LITS_MOBILIER,
        DIAGNOSTIC
    }

    public enum EtatTechnique {
        FONCTIONNEL,
        EN_PANNE,
        EN_MAINTENANCE,
        HORS_SERVICE
    }

    public enum StatutEquipement {
        DISPONIBLE,
        UTILISE,
        RESERVE
    }

    public enum CriticiteEquipement {
        FAIBLE,
        MOYENNE,
        HAUTE
    }


    public enum TypeLocalisation {
        CHAMBRE,
        MAGASIN,
        BUREAU,
        LABORATOIRE,
        AUTRE,
    }
}