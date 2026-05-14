package com.pfe.pfe.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String type = "Bearer";
    private String id;
    private String telephone;
    private String nom;
    private String prenom;
    
    public LoginResponse(String token, String id, String telephone, String nom, String prenom) {
        this.token = token;
        this.id = id;
        this.telephone = telephone;
        this.nom = nom;
        this.prenom = prenom;
    }
}
