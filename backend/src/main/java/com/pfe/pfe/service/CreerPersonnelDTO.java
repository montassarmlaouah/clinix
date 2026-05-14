package com.pfe.pfe.service;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO pour créer un membre du personnel par l'Admin Clinique
 */
@Data
public class CreerPersonnelDTO {

    @NotBlank(message = "Le téléphone est obligatoire")
    private String telephone;

    /** Si absent et {@link #profilInvitationMinimal} = false, le service exige nom et prénom. */
    private String nom;

    /** Si absent et {@link #profilInvitationMinimal} = false, le service exige nom et prénom. */
    private String prenom;

    @NotBlank(message = "Le rôle est obligatoire")
    private String role; // MEDECIN, INFIRMIER, RADIOLOGUE, PHARMACIEN, SECRETAIRE, etc.

    private String specialite;
    private String cliniqueId;
    private String motDePasse;

    /**
     * TUNISIE_SMS | PDF_CODE | PDF_ONLY | EMAIL — défaut TUNISIE_SMS si absent.
     */
    private String modeEnvoiCredentials;

    private String email;

    /** Carte d’identité (CIN) — obligatoire pour la création d’un compte neuf (hors rattachement médecin existant). */
    private String numeroPieceIdentite;

    /**
     * Si true : nom/prénom peuvent être omis (placeholders côté serveur) — invitation à compléter le profil plus tard.
     */
    private Boolean profilInvitationMinimal;

    /**
     * E-mail en copie cachée (BCC) pour informer un autre compte (ex. secrétariat d'une autre clinique).
     */
    private String emailCopieInvitation;

    /**
     * Si renseigné (rôle MEDECIN uniquement) : rattacher un médecin déjà présent dans le système
     * au lieu de créer un nouveau compte.
     */
    private String medecinExistantId;
}
