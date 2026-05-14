package com.pfe.pfe.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;

/**
 * Création d'une ordonnance : soit par consultation, soit par médecin + patient.
 */
@Data
public class CreerOrdonnanceDTO {

    /** Id de la consultation (optionnel si medecinId + patientId sont fournis). */
    private String consultationId;

    /** Id du médecin (obligatoire si pas de consultation). */
    private String medecinId;

    /** Id du patient (obligatoire si pas de consultation). */
    private String patientId;

    /** Lignes médicaments à ajouter dès la création (optionnel). */
    private List<LigneMedicamentDTO> medicaments = new ArrayList<>();
}
