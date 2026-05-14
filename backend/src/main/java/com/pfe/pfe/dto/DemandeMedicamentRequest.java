package com.pfe.pfe.dto;

import java.util.List;

import lombok.Data;

@Data
public class DemandeMedicamentRequest {
    private String patientId;
    private String chambreId;
    private String notes;
    private List<ItemRequest> items;

    @Data
    public static class ItemRequest {
        private String medicamentId;
        private Integer quantite;
        private String instructions;
    }
}
