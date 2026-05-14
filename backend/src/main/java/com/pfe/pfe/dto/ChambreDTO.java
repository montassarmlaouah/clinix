package com.pfe.pfe.dto;

import com.pfe.pfe.model.Chambre.TypeChambre;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChambreDTO {
    
    private String numero;
    private TypeChambre type;
    private Integer capacite;
    private Integer nombreLits;
    private Boolean disponible = true;
    private String serviceId;
    private List<String> equipements;
    private List<String> materielIds;
}
