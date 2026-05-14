package com.pfe.pfe.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "offres_abonnement")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OffreAbonnement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prixMensuel = BigDecimal.ZERO;

    /** Prix annuel affiché (DT) — utilisé avec Stripe Billing annuel. */
    @Column(name = "prix_annuel", nullable = false, precision = 12, scale = 2)
    private BigDecimal prixAnnuel = BigDecimal.ZERO;

    /** CLINIQUE | CABINET_MEDICAL — séparation packages clinique vs cabinet médecin. */
    @Column(nullable = false, length = 32)
    private String categorie = "CLINIQUE";

    @Column(name = "stripe_product_id", length = 128)
    private String stripeProductId;

    @Column(name = "stripe_price_mensuel_id", length = 128)
    private String stripePriceMensuelId;

    @Column(name = "stripe_price_annuel_id", length = 128)
    private String stripePriceAnnuelId;

    @Column(name = "periode_essai_jours", nullable = false)
    private Integer periodeEssaiJours = 0;

    @Column(nullable = false)
    private Integer smsGratuitsInclus = 0;

    /** Quota clinique : nombre max de chambres. */
    @Column(name = "nombre_chambres_max", nullable = false)
    private Integer nombreChambresMax = 0;

    /** Quota mutualisé : nombre max de membres du personnel. */
    @Column(name = "nombre_personnel_max", nullable = false)
    private Integer nombrePersonnelMax = 0;

    /** Quota cabinet : nombre max de patients. */
    @Column(name = "nombre_patients_max", nullable = false)
    private Integer nombrePatientsMax = 0;

    /** Quota cabinet : nombre max de rendez-vous. */
    @Column(name = "nombre_rendez_vous_max", nullable = false)
    private Integer nombreRendezVousMax = 0;

    /** Durée d’engagement en mois (choisie par le super admin pour l’offre). */
    @Column(name = "duree_mois", nullable = false)
    private Integer dureeMois = 1;

    @Column(nullable = false)
    private Boolean popular = false;

    @Column(nullable = false)
    private Integer ordreAffichage = 0;

    @Column(nullable = false)
    private Boolean actif = true;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
