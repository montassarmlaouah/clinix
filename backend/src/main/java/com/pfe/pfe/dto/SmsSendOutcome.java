package com.pfe.pfe.dto;

/**
 * Résultat d'une tentative d'envoi SMS TunisieSMS (hors exception fatale).
 */
public record SmsSendOutcome(boolean envoye, String detail) {

    public static SmsSendOutcome ok(String detail) {
        return new SmsSendOutcome(true, detail);
    }

    public static SmsSendOutcome echec(String detail) {
        return new SmsSendOutcome(false, detail);
    }
}
