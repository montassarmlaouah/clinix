package com.pfe.pfe.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.pfe.pfe.security.services.CustomUserDetails;

/**
 * Vérifie que l'utilisateur peut gérer une clinique (Super Admin ou Admin Clinique de cette clinique).
 */
@Service
public class CliniqueAccessService {

    public void assertCanManageClinique(String cliniqueId) {
        if (cliniqueId == null || cliniqueId.isBlank()) {
            throw new AccessDeniedException("Identifiant clinique requis");
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Non authentifié");
        }
        boolean superAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
        if (superAdmin) {
            return;
        }
        if (auth.getPrincipal() instanceof CustomUserDetails cd) {
            if ("ADMIN_CLINIQUE".equals(cd.getRole()) && cliniqueId.equals(cd.getCliniqueId())) {
                return;
            }
        }
        throw new AccessDeniedException("Vous ne pouvez pas modifier cette clinique");
    }
}
