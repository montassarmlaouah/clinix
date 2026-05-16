package com.pfe.pfe.security.services;

import com.pfe.pfe.model.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * UserDetails personnalisé contenant les informations supplémentaires
 * nécessaires pour le JWT (nom, prénom, id, cliniqueId, etc.)
 */
@Getter
public class CustomUserDetails implements UserDetails {
    
    private final String username;
    private final String password;
    private final Collection<? extends GrantedAuthority> authorities;
    
    // Informations supplémentaires
    private final String id;
    private final String nom;
    private final String prenom;
    private final String telephone;
    private final String cliniqueId;
    private final String role;

    /**
     * Constructeur pour les utilisateurs de type User (personnel, patient, admin clinique)
     */
    public CustomUserDetails(User user, String role, String cliniqueId) {
        this.username = user.getTelephone();
        this.password = user.getMotDePasse();
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
        this.id = user.getId();
        this.nom = user.getNom();
        this.prenom = user.getPrenom();
        this.telephone = user.getTelephone();
        this.cliniqueId = cliniqueId;
        this.role = role;
    }

    /**
     * Constructeur pour Super Admin (AppUser)
     */
    public CustomUserDetails(String username, String password, String role, Long appUserId) {
        this.username = username;
        this.password = password;
        this.authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role));
        this.id = appUserId != null ? String.valueOf(appUserId) : username;
        this.nom = "Super";
        this.prenom = "Admin";
        this.telephone = null;
        this.cliniqueId = null;
        this.role = role;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
