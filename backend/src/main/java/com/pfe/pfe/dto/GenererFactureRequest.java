package com.pfe.pfe.dto;

import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class GenererFactureRequest {
    private String hospitalisationId;
    private List<LignePrestationRequest> prestationsSupplementaires = new ArrayList<>();
}
