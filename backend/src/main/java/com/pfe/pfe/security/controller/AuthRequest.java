package com.pfe.pfe.security.controller;

import com.fasterxml.jackson.annotation.JsonProperty;

public class AuthRequest {
    @JsonProperty("username")
    private String username;
    
    @JsonProperty("password")
    private String password;
    
    @JsonProperty("role")
    private String role;

    // Constructeur par défaut (nécessaire pour Jackson)
    public AuthRequest() {
    }

    // Constructeur avec paramètres
    public AuthRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
