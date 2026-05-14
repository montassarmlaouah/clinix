package com.pfe.pfe.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RendezVousDTO {
    private LocalDateTime dateHeure;
    private String motif;
    private String patientId;
    private String medecinId;
}
