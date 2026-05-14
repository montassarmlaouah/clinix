package com.pfe.pfe.model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
@NoArgsConstructor
@AllArgsConstructor
public abstract class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    // Nullable pour permettre la création en 2 étapes (Super Admin crée avec téléphone uniquement)
    @Column(nullable = true)
    private String nom;
    
    @Column(nullable = true)
    private String prenom;

    @Column(nullable = false, unique = true)
    private String telephone;
    
    @JsonIgnore
    private String motDePasse;
    
    @Column(nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();
    
    @Column(nullable = false)
    private Boolean actif = true;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_roles",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
    
    @ManyToOne
    @JoinColumn(name = "clinique_id")
    private Clinique clinique;
    
    @ManyToOne
    @JoinColumn(name = "service_id")
    private Service service;

    /** E-mail (obligatoire pour modes EMAIL et PDF_CODE à l’invitation). */
    @Column(length = 255)
    private String email;

    /** Numéro de carte d’identité (CIN) — obligatoire pour le mode PDF_CODE. */
    @Column(name = "numero_piece_identite", length = 64)
    private String numeroPieceIdentite;

    /** Hash BCrypt d'un code optionnel (ex. ancien flux invitation) ; non utilisé pour le PDF identifiants seuls. */
    @Column(name = "onboarding_code_hash", length = 255)
    @JsonIgnore
    private String onboardingCodeHash;

    @Column(name = "onboarding_code_expires_at")
    private LocalDateTime onboardingCodeExpiresAt;
}
