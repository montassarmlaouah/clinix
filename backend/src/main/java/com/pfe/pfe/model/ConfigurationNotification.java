package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Configuration des préférences de notification par utilisateur
 */
@Entity
@Table(name = "configuration_notification")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConfigurationNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId; // Lien vers l'utilisateur

    @Column(name = "notifications_email", columnDefinition = "boolean default true")
    private Boolean notificationsEmail = true;

    @Column(name = "notifications_sms", columnDefinition = "boolean default true")
    private Boolean notificationsSms = true;

    @Column(name = "notifications_push", columnDefinition = "boolean default true")
    private Boolean notificationsPush = true;

    @Column(name = "rappel_rendez_vous", columnDefinition = "boolean default true")
    private Boolean rappelRendezVous = true; // SMS de rappel 24h avant

    @Column(name = "alertes_medicales", columnDefinition = "boolean default true")
    private Boolean alertesMedicales = true; // Alertes IA, résultats labs

    @Column(name = "notifications_administratives", columnDefinition = "boolean default true")
    private Boolean notificationsAdministratives = true;

    @Column(name = "email_principal")
    private String emailPrincipal;

    @Column(name = "telephone_principal")
    private String telephonePrincipal;

    @Column(name = "heure_debut_silencieux")
    private String heureDebutSilencieux; // Format: HH:mm (pour ne pas déranger)

    @Column(name = "heure_fin_silencieux")
    private String heureFinSilencieux;

    @Column(name = "fuseau_horaire")
    private String fuseauHoraire = "Africa/Tunis";
}
