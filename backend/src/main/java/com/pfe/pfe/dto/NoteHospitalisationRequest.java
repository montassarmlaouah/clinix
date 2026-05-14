package com.pfe.pfe.dto;

import lombok.Data;

@Data
public class NoteHospitalisationRequest {
    private String contenu;
    private String auteurId;
    private String auteurNom;
    private String auteurRole;
}
