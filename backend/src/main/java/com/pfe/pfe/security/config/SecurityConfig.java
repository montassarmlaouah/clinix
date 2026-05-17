package com.pfe.pfe.security.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import com.pfe.pfe.security.PublicWebUiGetMatcher;
import com.pfe.pfe.security.services.AppUserDetailsService;
import com.pfe.pfe.security.tokenisation.JwtFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Autowired
    public SecurityConfig(JwtFilter jwtFilter, CorsConfigurationSource corsConfigurationSource) {
        this.jwtFilter = jwtFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(AppUserDetailsService appUserDetailsService,
                                                            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(appUserDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(DaoAuthenticationProvider authProvider) {
        return new ProviderManager(authProvider);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // ✅ CORS activé avec la configuration de WebConfig
        http.cors(cors -> cors.configurationSource(corsConfigurationSource));

        http.csrf(csrf -> csrf.disable());
        http.sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        http.authorizeHttpRequests(auth -> auth
                // Préflight CORS (OPTIONS) — doit passer avant toute règle authentifiée
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Shell SPA + assets (GET hors /api et /auth — ceux-ci ont leurs propres règles)
                .requestMatchers(new PublicWebUiGetMatcher()).permitAll()
                // Test rapide : backend joignable sans JWT (navigateur GET)
                .requestMatchers(HttpMethod.GET, "/api/health").permitAll()
                // Profil : JWT obligatoire (avant le permitAll général /auth/**)
                .requestMatchers("/auth/profile", "/auth/change-password").authenticated()
                // Endpoints publics sous /auth (login, codes, etc.)
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/webhooks/stripe").permitAll()
                .requestMatchers("/api/administrateurs-clinique/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN_CLINIQUE")
                .requestMatchers("/api/sms/test-send", "/api/sms/dlr").authenticated()
                .requestMatchers("/api/sms/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/upload").authenticated()

                // Services: admin, chef personnel, secrétaire (lecture/liste)
                .requestMatchers(HttpMethod.GET, "/api/services/**").hasAnyRole("ADMIN_CLINIQUE", "CHEF_PERSONNEL", "SECRETAIRE")
                // Services: écriture réservée
                .requestMatchers("/api/services/**").hasAnyRole("ADMIN_CLINIQUE", "CHEF_PERSONNEL")
                // Chambres: lecture autorisée pour Responsable Logistique et Secrétaire
                .requestMatchers(HttpMethod.GET, "/api/chambres/**").hasAnyRole(
                        "ADMIN_CLINIQUE", "TECHNICIEN_MAINTENANCE", "SECRETAIRE",
                        "MEDECIN", "INFIRMIER"
                )
                // Écriture réservée à l'admin clinique
                .requestMatchers("/api/chambres/**").hasRole("ADMIN_CLINIQUE")

                // Liste cliniques actives : orientation cabinet → hôpital, secrétariat
                .requestMatchers(HttpMethod.GET, "/api/cliniques/actives").hasAnyRole(
                        "SUPER_ADMIN", "ADMIN_CLINIQUE", "MEDECIN", "SECRETAIRE"
                )
                // Endpoints sécurisés par rôle
                .requestMatchers("/api/cliniques/**").hasAnyRole("SUPER_ADMIN", "ADMIN_CLINIQUE")
                .requestMatchers("/api/personnel/**").hasAnyRole("SUPER_ADMIN", "ADMIN_CLINIQUE", "CHEF_PERSONNEL")
                .requestMatchers("/api/patients/**").hasAnyRole("MEDECIN", "INFIRMIER", "SECRETAIRE", "ADMIN_CLINIQUE")
                .requestMatchers("/api/medecins/cabinets/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/medecins/**").hasAnyRole("SUPER_ADMIN", "MEDECIN", "INFIRMIER", "SECRETAIRE", "ADMIN_CLINIQUE")
                .requestMatchers("/api/infirmiers/**").hasRole("INFIRMIER")
                .requestMatchers("/api/hospitalisations/**").hasAnyRole("MEDECIN", "INFIRMIER", "SECRETAIRE", "ADMIN_CLINIQUE")
                // Dossiers médicaux : lecture pour patient, écriture pour médecin
                .requestMatchers(HttpMethod.GET, "/api/dossiers-medicaux/**").hasAnyRole("MEDECIN", "INFIRMIER", "PATIENT", "ADMIN_CLINIQUE", "RADIOLOGUE")
                .requestMatchers("/api/dossiers-medicaux/**").hasAnyRole("MEDECIN", "ADMIN_CLINIQUE")

                // Ordonnances : lecture élargie (infirmier : suivi thérapeutique) ; écriture médecin / pharmacien
                .requestMatchers(HttpMethod.GET, "/api/ordonnances/**").hasAnyRole("MEDECIN", "PATIENT", "PHARMACIEN", "ADMIN_CLINIQUE", "INFIRMIER")
                .requestMatchers("/api/ordonnances/**").hasAnyRole("MEDECIN", "PHARMACIEN", "ADMIN_CLINIQUE")

                // Espace radiologue (JWT = id radiologue ; pas de radiologueId dans l'URL)
                .requestMatchers("/api/radiologue/**").hasRole("RADIOLOGUE")

                // Radiologie
                .requestMatchers(HttpMethod.GET, "/api/imageries/**").hasAnyRole("MEDECIN", "RADIOLOGUE", "ADMIN_CLINIQUE", "INFIRMIER")
                .requestMatchers(HttpMethod.POST, "/api/imageries/**").hasAnyRole("MEDECIN", "RADIOLOGUE")
                .requestMatchers("/api/imageries/**").hasAnyRole("RADIOLOGUE", "ADMIN_CLINIQUE")
                .requestMatchers("/api/rapports-imagerie/**").hasAnyRole("MEDECIN", "RADIOLOGUE", "ADMIN_CLINIQUE", "INFIRMIER")

                // Constantes vitales et surveillance
                .requestMatchers("/api/constantes-vitales/**").hasAnyRole("MEDECIN", "INFIRMIER", "ADMIN_CLINIQUE")
                .requestMatchers("/api/surveillances/**").hasAnyRole("MEDECIN", "INFIRMIER", "ADMIN_CLINIQUE")
                .requestMatchers("/api/administrations/**").hasAnyRole("MEDECIN", "INFIRMIER", "ADMIN_CLINIQUE")

                // Urgences
                .requestMatchers("/api/urgences/**").hasAnyRole("MEDECIN", "INFIRMIER", "SECRETAIRE", "ADMIN_CLINIQUE")

                // Messagerie interne
                .requestMatchers("/api/messages/**").authenticated()

                .requestMatchers("/api/rendez-vous/**").hasAnyRole("MEDECIN", "PATIENT", "SECRETAIRE", "INFIRMIER")
                .requestMatchers(HttpMethod.POST, "/api/consultations/**").hasRole("MEDECIN")
                .requestMatchers(HttpMethod.PATCH, "/api/consultations/**").hasRole("MEDECIN")
                .requestMatchers(HttpMethod.GET, "/api/consultations/**").hasAnyRole("MEDECIN", "PATIENT", "INFIRMIER")

                // Pharmacien - Gestion des médicaments et pharmacie
                .requestMatchers("/api/medicaments/**").hasAnyRole("PHARMACIEN", "MEDECIN", "ADMIN_CLINIQUE")
                .requestMatchers("/api/stocks/**").hasAnyRole("PHARMACIEN", "ADMIN_CLINIQUE")
                .requestMatchers("/api/pharmaciens/**").hasAnyRole("PHARMACIEN", "ADMIN_CLINIQUE")
                .requestMatchers("/api/demandes-medicament/**").hasAnyRole("PHARMACIEN", "MEDECIN", "SECRETAIRE", "INFIRMIER", "ADMIN_CLINIQUE")

                // Congés médecins
                .requestMatchers("/api/conges-medecin/**").hasAnyRole("MEDECIN", "SECRETAIRE", "ADMIN_CLINIQUE", "CHEF_PERSONNEL")

                // Demandes d'opération
                .requestMatchers("/api/demandes-operation/**").hasAnyRole("MEDECIN", "SECRETAIRE", "ADMIN_CLINIQUE", "INFIRMIER")

                // Technicien maintenance : équipements de sa clinique (lecture + alertes e-mail)
                .requestMatchers("/api/technicien-maintenance/**").hasRole("TECHNICIEN_MAINTENANCE")

                // Mise à jour équipement (interface /equipements côté technicien : PUT limité + contrôle clinique dans le service)
                .requestMatchers(HttpMethod.PUT, "/api/equipements/**").hasAnyRole("ADMIN_CLINIQUE", "TECHNICIEN_MAINTENANCE")

                // Équipements — le reste (GET/POST/PATCH/DELETE) : admin clinique uniquement
                .requestMatchers("/api/equipements/**").hasRole("ADMIN_CLINIQUE")

                // Facturation patient (sortie, CNAM, PDF)
                .requestMatchers("/api/facturation-patient/**").hasAnyRole("SECRETAIRE", "ADMIN_CLINIQUE")

                .anyRequest().authenticated()
        );
        
        // Gestion des erreurs d'authentification
        http.exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    System.err.println("❌ [SecurityConfig] Erreur d'authentification pour " + request.getRequestURI() + " : " + authException.getMessage());
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"Token JWT manquant ou invalide\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    System.err.println("❌ [SecurityConfig] Accès refusé pour " + request.getRequestURI() + " : " + accessDeniedException.getMessage());
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Forbidden\",\"message\":\"Vous n'avez pas les permissions nécessaires\"}");
                })
        );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}