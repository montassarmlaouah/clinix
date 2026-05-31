package com.pfe.pfe.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "abonnements_clinique")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AbonnementClinique {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /**
     * Abonnement "clinique" : clinique_id renseigné.
     * Abonnement "cabinet" : clinique_id NULL et medecin_cabinet_id renseigné.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "clinique_id", nullable = true)
    private Clinique clinique;

    /** Cabinet médical (médecin sans clinique) — exclusif avec clinique. */
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "medecin_cabinet_id", nullable = true)
    private Medecin medecinCabinet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offre_id", nullable = false)
    private OffreAbonnement offre;

    @Column(nullable = false)
    private LocalDate dateDebut;

    /** Date du premier paiement effectif (Stripe / simulation), distincte de la création du dossier. */
    @Column(name = "date_premier_paiement")
    private LocalDate datePremierPaiement;

    @Column(nullable = false)
    private LocalDate dateFin;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montantPaye = BigDecimal.ZERO;

    @Column(nullable = false, length = 32)
    private String statut = "ACTIF";

    @Column(name = "stripe_customer_id", length = 128)
    private String stripeCustomerId;

    @Column(name = "stripe_subscription_id", length = 128)
    private String stripeSubscriptionId;

    @Column(name = "stripe_session_id", length = 128)
    private String stripeSessionId;

    /** MONTHLY | YEARLY */
    @Column(name = "periode_facturation", length = 16)
    private String periodeFacturation;

    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
}
