package com.pfe.pfe.billing;

import java.io.IOException;
import java.util.Set;

import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pfe.pfe.security.services.CustomUserDetails;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * Bloque l'accès API (402) si l'abonnement clinique ou cabinet requis n'est pas actif et payé.
 */
@Component
@RequiredArgsConstructor
public class SubscriptionAccessFilter extends OncePerRequestFilter {

    private static final Set<String> ROLES_CLINIQUE_ABONNEMENT = Set.of(
            "ADMIN_CLINIQUE", "SECRETAIRE", "INFIRMIER", "PHARMACIEN",
            "RADIOLOGUE", "TECHNICIEN_MAINTENANCE", "CHEF_PERSONNEL");

    private final SubscriptionAccessService subscriptionAccessService;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        if (path == null) {
            return true;
        }
        if (path.startsWith("/auth/")
                || path.startsWith("/api/auth/")
                || path.startsWith("/api/billing/")
                || path.startsWith("/api/webhooks/")
                || path.equals("/api/health")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/v3/api-docs/")) {
            return true;
        }
        return false;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails user)) {
            chain.doFilter(request, response);
            return;
        }

        String role = normalizeRole(user.getRole());
        if ("SUPER_ADMIN".equals(role) || "PATIENT".equals(role)) {
            chain.doFilter(request, response);
            return;
        }

        boolean cabinetScope = isCabinetScope(request);

        if ("MEDECIN".equals(role)) {
            if (cabinetScope) {
                if (!user.isAccesCabinet()) {
                    deny(response, "Accès cabinet non activé pour votre compte.");
                    return;
                }
                if (!subscriptionAccessService.hasActivePaidCabinetSubscription(user.getId())) {
                    deny(response, "Abonnement cabinet requis ou expiré. Veuillez souscrire à un forfait cabinet.");
                    return;
                }
            } else if (StringUtils.hasText(user.getCliniqueId())) {
                if (!subscriptionAccessService.hasActivePaidCliniqueSubscription(user.getCliniqueId())) {
                    deny(response, "Abonnement clinique requis ou expiré. Contactez l'administrateur de la clinique.");
                    return;
                }
            } else {
                if (!subscriptionAccessService.hasActivePaidCabinetSubscription(user.getId())) {
                    deny(response, "Abonnement cabinet requis ou expiré. Veuillez souscrire à un forfait cabinet.");
                    return;
                }
            }
            chain.doFilter(request, response);
            return;
        }

        if (ROLES_CLINIQUE_ABONNEMENT.contains(role)) {
            if (!StringUtils.hasText(user.getCliniqueId())) {
                deny(response, "Aucune clinique associée à votre compte.");
                return;
            }
            if (!subscriptionAccessService.hasActivePaidCliniqueSubscription(user.getCliniqueId())) {
                deny(response, "Abonnement clinique requis ou expiré. Veuillez souscrire à un forfait.");
                return;
            }
        }

        chain.doFilter(request, response);
    }

    private boolean isCabinetScope(HttpServletRequest request) {
        String scope = request.getParameter("scope");
        if (StringUtils.hasText(scope) && "cabinet".equalsIgnoreCase(scope.trim())) {
            return true;
        }
        String header = request.getHeader("X-Billing-Scope");
        if (StringUtils.hasText(header) && "cabinet".equalsIgnoreCase(header.trim())) {
            return true;
        }
        String path = request.getRequestURI().toLowerCase();
        if (path.contains("cabinet") || path.contains("rdv-cabinet")) {
            return true;
        }
        // Patients cabinet : GET/POST /api/medecins/{id}/patients
        return path.matches(".*/api/medecins/[^/]+/patients.*");
    }

    private void deny(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_PAYMENT_REQUIRED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"message\":\"" + escapeJson(message) + "\"}");
    }

    private String escapeJson(String s) {
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String normalizeRole(String role) {
        if (!StringUtils.hasText(role)) {
            return "";
        }
        String r = role.toUpperCase().replace("-", "_");
        if (r.startsWith("ROLE_")) {
            r = r.substring(5);
        }
        return r;
    }
}
