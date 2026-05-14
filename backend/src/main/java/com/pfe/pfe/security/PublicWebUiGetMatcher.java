package com.pfe.pfe.security;

import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.web.util.matcher.RequestMatcher;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Autorise les GET publics pour le shell SPA et les assets (hors préfixes réservés au backend).
 * Les routes {@code /auth/**} et {@code /api/**} sont gérées par d’autres règles.
 */
public class PublicWebUiGetMatcher implements RequestMatcher {

    @Override
    public boolean matches(HttpServletRequest request) {
        if (!HttpMethod.GET.matches(request.getMethod())) {
            return false;
        }
        String path = stripContextPath(request);
        if (path.startsWith("/api/") || path.startsWith("/auth/")) {
            return false;
        }
        if (path.startsWith("/v3/") || path.startsWith("/swagger-ui")) {
            return false;
        }
        if (path.startsWith("/actuator")) {
            return false;
        }
        return true;
    }

    private static String stripContextPath(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String ctx = request.getContextPath();
        if (ctx != null && !ctx.isEmpty() && uri.startsWith(ctx)) {
            uri = uri.substring(ctx.length());
        }
        return uri.isEmpty() ? "/" : uri;
    }
}
