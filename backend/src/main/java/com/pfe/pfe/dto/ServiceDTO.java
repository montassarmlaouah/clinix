package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ServiceDTO {
    
    private String nom;
    
    private String description;
    
    private String cliniqueId;
    
    private Boolean actif = true;
}
