package com.pfe.pfe.service;

/**
 * Mode d’envoi des identifiants lors de la création du personnel (choix admin / super admin).
 */
public enum PersonnelCredentialsMode {

    /** TunisieSMS — comportement historique */
    TUNISIE_SMS,

    /** PDF joint à un e-mail (identifiants dans le PDF) */
    PDF_CODE,

    /** PDF uniquement : pas d’e-mail, le PDF est renvoyé dans la réponse API / à télécharger côté UI */
    PDF_ONLY,

    /** E-mail uniquement (mot de passe provisoire dans le message) */
    EMAIL;

    public static PersonnelCredentialsMode fromDto(String raw) {
        if (raw == null || raw.isBlank()) {
            return TUNISIE_SMS;
        }
        try {
            return valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return TUNISIE_SMS;
        }
    }
}
