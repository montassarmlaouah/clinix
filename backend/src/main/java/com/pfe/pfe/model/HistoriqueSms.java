package com.pfe.pfe.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "historique_sms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoriqueSms {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String telephone; // Destinataire

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String statut; // SENT, FAILED, DELIVERED, UNDELIVERED

    @Column(name = "twilio_sid")
    private String twilioSid; // Identifiant Twilio

    @Column(name = "date_envoi")
    private LocalDateTime dateEnvoi;

    @Column(name = "date_livraison")
    private LocalDateTime dateLivraison;

    @Column(columnDefinition = "TEXT")
    private String motifEchec;

    @Column(name = "type_sms")
    private String typeSms; // OTP, NOTIFICATION, RAPPEL, etc.

    @Column(name = "frais_cents")
    private Double fraisCents; // Coût en cents (Twilio)

    @Column(name = "destinataire_id") 
    private String destinataireId; // Lien vers Patient, Personnel, etc.

    @PrePersist
    public void prePersist() {
        this.dateEnvoi = LocalDateTime.now();
        if (this.statut == null) {
            this.statut = "SENT";
        }
    }
}
