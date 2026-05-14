package com.pfe.pfe.dto;

import lombok.Data;

/**
 * Mise à jour par l'admin clinique : clé API si l'abonnement inclut des SMS gratuits.
 */
@Data
public class CliniqueTunisieSmsUpdateDTO {

    /** Activer uniquement si l'abonnement TunisieSMS prévoit des SMS gratuits / crédits inclus. */
    private Boolean abonnementSmsGratuits;

    private String tunisiesmsSender;

    /**
     * Nouvelle clé API. Si null : ne pas modifier la clé existante.
     * Chaîne vide "" : effacer la clé enregistrée.
     */
    private String tunisiesmsApiKey;
}
