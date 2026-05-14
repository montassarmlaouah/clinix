package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TraitementPanneDTO {
    private String repairType;
    private String repairNotes;
    private Integer repairHours;
    private Integer repairMinutes;
}
