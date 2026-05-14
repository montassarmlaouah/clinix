package com.pfe.pfe.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entité pour les notifications affichées dans l'interface utilisateur
 * (Différent de Notification qui gère les SMS/Email)
 */
@Entity
@Table(name = "notifications_utilisateur")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationUtilisateur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeNotification type;

    @Column(nullable = false)
    private Boolean lu = false;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_lecture")
    private LocalDateTime dateLecture;

    @Column(name = "destinataire_id")
    private Long destinataireId; // ID numérique du destinataire (optionnel si destinataire_id_str utilisé)

    @Column(name = "destinataire_id_str", length = 36)
    private String destinataireIdStr; // ID UUID du destinataire (User.id) pour compatibilité

    @Column(name = "code", length = 80)
    private String code; // Code métier : ACTIVATION_COMPTE, LICENCE_MODIFIEE, NOUVEAU_RDV, etc.

    @Column(name = "destinataire_type")
    private String destinataireType; // Type d'utilisateur (PATIENT, MEDECIN, etc.)

    @Column(name = "reference_id")
    private Long referenceId; // ID de l'objet lié (rendez-vous, patient, etc.)

    @Column(name = "reference_type")
    private String referenceType; // Type de l'objet lié (RENDEZ_VOUS, PATIENT, etc.)

    @Column(name = "action_url")
    private String actionUrl; // URL pour rediriger lors du clic

    @PrePersist
    protected void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (lu == null) {
            lu = false;
        }
    }

    public enum TypeNotification {
        INFO,
        SUCCESS,
        WARNING,
        ERROR
    }
}
