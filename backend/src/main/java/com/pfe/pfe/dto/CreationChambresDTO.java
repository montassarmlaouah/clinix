package com.pfe.pfe.dto;

import com.pfe.pfe.model.Chambre.TypeChambre;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreationChambresDTO {
    private String serviceId;
    private TypeChambre type;
    private Integer capacite;
    private Integer nombreLits;
    private Boolean disponible = true;
    private Integer nombreChambres; // Nombre de chambres à créer
    private String prefixeNumero; // Préfixe pour les numéros (ex: "101", "A", etc.)
    private Integer numeroDebut; // Numéro de départ (ex: 1, 101, etc.)
    private List<String> equipements; // Équipements communs à toutes les chambres
    private List<String> materielIds; // Matériels médicaux communs
}
