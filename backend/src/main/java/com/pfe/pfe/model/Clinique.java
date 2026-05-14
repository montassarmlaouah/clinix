package com.pfe.pfe.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.ColumnDefault;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cliniques")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Clinique {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false)
    private String nom;
    
    @Column(nullable = false)
    private String adresse;
    
    private String telephone;
    
    @Column(nullable = false)
    private Boolean actif = true;
    
    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
    
    @OneToMany(mappedBy = "clinique", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Service> services = new ArrayList<>();
    
    @OneToMany(mappedBy = "clinique")
    @JsonIgnore
    private List<User> personnel = new ArrayList<>();

    /**
     * Abonnement TunisieSMS avec crédits SMS gratuits : l'admin peut alors enregistrer sa clé API.
     * @ColumnDefault aide Hibernate ; la migration Flyway V1 garantit NOT NULL + défaut en base.
     */
    @ColumnDefault("false")
    @Column(nullable = false)
    private Boolean abonnementSmsGratuits = false;

    /** Clé API TunisieSMS (ne jamais exposer en JSON sur l'entité — utiliser le DTO dédié). */
    @Column(length = 2048)
    @JsonIgnore
    private String tunisiesmsApiKey;

    /** Nom d'expéditeur SMS pour cette clinique (sinon valeur globale application). */
    @Column(length = 32)
    private String tunisiesmsSender;

    /** Préférence affichée à la création : MONTHLY | YEARLY (facturation Stripe). */
    @Column(name = "preference_facturation", length = 16)
    private String preferenceFacturation;

    @Column(name = "stripe_customer_id", length = 128)
    private String stripeCustomerId;
}
