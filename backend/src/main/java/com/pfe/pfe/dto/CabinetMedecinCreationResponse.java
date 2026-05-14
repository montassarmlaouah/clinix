package com.pfe.pfe.dto;

import com.pfe.pfe.model.Medecin;

/**
 * Réponse POST /api/medecins/cabinets : médecin créé + état explicite de l'envoi SMS.
 */
public record CabinetMedecinCreationResponse(
        Medecin medecin,
        boolean smsEnvoye,
        String smsDetail,
        /** true si un médecin cabinet existant (même CIN + même mobile) a été mis à jour sans régénérer le mot de passe */
        boolean compteExistantRattache,
        /** false si le mot de passe existant a été conservé */
        boolean motDePasseRegenere
) {
}
