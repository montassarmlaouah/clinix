package com.pfe.pfe.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages_internes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageInterne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "expediteur_id", nullable = false)
    private User expediteur;

    @ManyToOne
    @JoinColumn(name = "destinataire_id", nullable = false)
    private User destinataire;

    @Column(nullable = false, length = 200)
    private String sujet;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Column(nullable = false)
    private Boolean lu = false;

    @Column(nullable = false)
    private LocalDateTime dateEnvoi = LocalDateTime.now();

    private LocalDateTime dateLecture;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PrioriteMessage priorite = PrioriteMessage.NORMALE;

    public enum PrioriteMessage {
        NORMALE, URGENTE
    }
}
