package com.pfe.pfe.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.security.services.CustomUserDetails;

/**
 * Vérifications d'accès pour l'activité cabinet médical (médecin).
 */
public final class MedecinCabinetSecurity {

    private MedecinCabinetSecurity() {
    }

    public static void assertMedecinCabinetAccess(String medecinId) {
        CustomUserDetails user = currentUser();
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Non authentifié.");
        }
        if (!isSuperAdmin(user) && (medecinId == null || !medecinId.equals(user.getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès réservé au médecin concerné.");
        }
        if (!user.isAccesCabinet()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès cabinet non activé pour votre compte.");
        }
    }

    public static CustomUserDetails currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails user)) {
            return null;
        }
        return user;
    }

    private static boolean isSuperAdmin(CustomUserDetails user) {
        String role = user.getRole();
        if (role == null) {
            return false;
        }
        String r = role.toUpperCase().replace("-", "_");
        if (r.startsWith("ROLE_")) {
            r = r.substring(5);
        }
        return "SUPER_ADMIN".equals(r);
    }
}
