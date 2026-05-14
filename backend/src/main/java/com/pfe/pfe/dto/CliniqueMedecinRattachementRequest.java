package com.pfe.pfe.dto;

import lombok.Data;

@Data
public class CliniqueMedecinRattachementRequest {
    /** Identifiant utilisateur / médecin (UUID) — compte centralisé. */
    private String medecinId;
}
