package com.pfe.pfe.security.tokenisation;


import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.pfe.pfe.security.services.AppUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AppUserDetailsService appUserDetailsService;

    @Autowired
    public JwtFilter(JwtUtil jwtUtil, @Lazy AppUserDetailsService appUserDetailsService) {
        this.jwtUtil = jwtUtil;
        this.appUserDetailsService = appUserDetailsService;
    }

    /**
     * Ignorer le filtre JWT pour les endpoints publics
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/auth/") ||
               path.startsWith("/api/auth/") ||
               path.startsWith("/swagger-ui/") ||
               path.startsWith("/v3/api-docs/") ||
               path.startsWith("/api/webhooks/stripe");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        final String authHeader = req.getHeader("Authorization");
        String requestPath = req.getRequestURI();
        
        // Log pour débogage
        System.out.println("🔍 [JwtFilter] Requête reçue : " + req.getMethod() + " " + requestPath);
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                System.out.println("🔍 [JwtFilter] Token reçu : " + token.substring(0, Math.min(20, token.length())) + "...");
                
                // Extraire le username du token (cette méthode lève une exception si le token est invalide)
                String username = jwtUtil.extractUsername(token);
                System.out.println("✅ [JwtFilter] Username extrait : " + username);

                UserDetails user = appUserDetailsService.loadUserByUsername(username);
                System.out.println("✅ [JwtFilter] User trouvé : " + user.getUsername());
                System.out.println("✅ [JwtFilter] Autorités : " + user.getAuthorities());

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

                SecurityContextHolder.getContext().setAuthentication(auth);
                System.out.println("✅ [JwtFilter] Authentification définie avec succès");
            } catch (Exception e) {
                System.err.println("❌ [JwtFilter] Erreur d'authentification pour " + requestPath + " : " + e.getMessage());
                e.printStackTrace();
                // Ne pas bloquer la requête ici, laisser Spring Security gérer l'authentification
                // Si l'utilisateur n'est pas authentifié, Spring Security retournera 401/403
            }
        } else {
            System.out.println("⚠️  [JwtFilter] Pas de header Authorization ou mauvais format pour " + requestPath);
            // Ne pas bloquer, laisser Spring Security gérer
        }

        chain.doFilter(req, res);
    }
}
