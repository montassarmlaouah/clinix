package com.pfe.pfe.security.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.security.services.AppUserDetailsService;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.security.tokenisation.JwtUtil;
import com.pfe.pfe.service.AdministrateurCliniqueService;
import com.pfe.pfe.service.AuthService;
import com.pfe.pfe.service.PersonnelService;
import com.pfe.pfe.service.TunisieSmsService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final AppUserDetailsService appUserDetailsService;
    private final AuthService authService;
    private final AdministrateurCliniqueService adminCliniqueService;
    private final PersonnelService personnelService;
    private final TunisieSmsService tunisieSmsService;
    
    // Rôles du personnel de la clinique
    private static final Set<String> ROLES_PERSONNEL = Set.of(
        "MEDECIN", "INFIRMIER", "RADIOLOGUE", "PHARMACIEN", "SECRETAIRE",
        "CHEF_PERSONNEL", "TECHNICIEN_MAINTENANCE"
    );

    @Autowired
    public AuthController(AuthenticationManager authManager, JwtUtil jwtUtil, 
                         AppUserDetailsService appUserDetailsService, AuthService authService,
                         AdministrateurCliniqueService adminCliniqueService,
                         PersonnelService personnelService,
                         TunisieSmsService tunisieSmsService) {
        this.authManager = authManager;
        this.jwtUtil = jwtUtil;
        this.appUserDetailsService = appUserDetailsService;
        this.authService = authService;
        this.adminCliniqueService = adminCliniqueService;
        this.personnelService = personnelService;
        this.tunisieSmsService = tunisieSmsService;
    }

    /**
     * Normalise l'identifiant de connexion :
     * - si c'est un numero de telephone tunisien (8 ou 9 chiffres), on le convertit en format 216XXXXXXXX
     * - sinon on retourne la valeur trimee (cas "super.admin", etc.)
     */
    private String normalizeUsername(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) return trimmed;
        String digits = trimmed.replaceAll("\\s+", "").replace("+", "");
        if (digits.matches("\\d{8}") || digits.matches("0\\d{8}")
                || digits.matches("216\\d{8}") || digits.matches("00216\\d{8}")) {
            return tunisieSmsService.normalizeInternationalTunisia(trimmed);
        }
        return trimmed;
    }

    /**
     * Login unifié pour tous les rôles
     * POST /auth/login
     * 
     * Body: { "username": "super.admin" ou "21612345678", "password": "Password123!" }
     * 
     * - Super Admin: username = "super.admin"
     * - Admin Clinique: username = téléphone (ex: "21612345678")
     * - Patient: username = téléphone
     * - Personnel (Médecin, Infirmier, etc.): username = téléphone
     */
    @PostMapping(value = "/login", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Map<String, Object>> login(@RequestBody AuthRequest request) {
        try {
            if (request == null || request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Le nom d'utilisateur est obligatoire"
                ));
            }
            
            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Le mot de passe est obligatoire"
                ));
            }

            String username = normalizeUsername(request.getUsername());

            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, request.getPassword())
            );

            UserDetails user = appUserDetailsService.loadUserByUsername(username);
            String token = jwtUtil.generateToken(user);

            String roleStr = user.getAuthorities().iterator().next().getAuthority();

            Map<String, Object> userInfo = new HashMap<>();
            if (user instanceof CustomUserDetails cud) {
                userInfo.put("id", cud.getId());
                userInfo.put("nom", cud.getNom());
                userInfo.put("prenom", cud.getPrenom());
                userInfo.put("telephone", cud.getTelephone());
                userInfo.put("role", cud.getRole());
                userInfo.put("cliniqueId", cud.getCliniqueId());
                if ("MEDECIN".equalsIgnoreCase(cud.getRole())) {
                    boolean estCabinet = cud.isAccesCabinet()
                            || cud.getCliniqueId() == null
                            || cud.getCliniqueId().isBlank();
                    userInfo.put("estCabinet", estCabinet);
                    userInfo.put("accesCabinet", cud.isAccesCabinet());
                }
            } else {
                userInfo.put("role", roleStr);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("message", "Connexion réussie");
            response.put("role", roleStr);
            response.put("user", userInfo);
            
            return ResponseEntity.ok(response);
        } catch (DisabledException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "message", "Compte desactive. Veuillez contacter un administrateur."
            ));
        } catch (UsernameNotFoundException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.startsWith("Compte non active") || msg.startsWith("Compte non enregistre")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "message", "Compte non active. Verifiez le SMS d'activation ou contactez un administrateur."
                ));
            }
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Identifiant ou mot de passe incorrect"
            ));
        } catch (BadCredentialsException e) {
            // Spring masque UsernameNotFoundException derriere BadCredentials : on verifie ici
            // si le compte existe mais n'est pas active, pour donner un message plus clair.
            try {
                String usernameBc = normalizeUsername(request.getUsername());
                appUserDetailsService.loadUserByUsername(usernameBc);
            } catch (UsernameNotFoundException unf) {
                String msg = unf.getMessage() != null ? unf.getMessage() : "";
                if (msg.startsWith("Compte non active") || msg.startsWith("Compte non enregistre")) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "message", "Compte non active. Verifiez le SMS d'activation ou contactez un administrateur."
                    ));
                }
            } catch (Exception ignore) { }
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Identifiant ou mot de passe incorrect"
            ));
        } catch (AuthenticationException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "message", "Identifiant ou mot de passe incorrect"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "message", "Erreur serveur lors de la connexion"
            ));
        }
    }

    /**
     * L'inscription publique est désactivée : les comptes sont créés par un administrateur
     * (mot de passe envoyé par SMS via TunisieSMS).
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerDisabled() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "message",
                "L'inscription publique est désactivée. Les comptes sont créés par un administrateur (SMS avec mot de passe)."
        ));
    }

    /**
     * Vérifier si un compte en attente existe pour un téléphone
     * GET /auth/verifier-compte/{telephone}
     * GET /auth/verifier-compte/{telephone}/{role}
     */
    @GetMapping("/verifier-compte/{telephone}")
    public ResponseEntity<Map<String, Object>> verifierCompte(@org.springframework.web.bind.annotation.PathVariable String telephone) {
        boolean compteEnAttente = adminCliniqueService.existeCompteEnAttente(telephone);
        
        Map<String, Object> response = new HashMap<>();
        response.put("telephone", telephone);
        response.put("compteEnAttente", compteEnAttente);
        
        if (compteEnAttente) {
            response.put("message", "Un compte Admin Clinique en attente existe. Vous pouvez compléter votre inscription.");
        } else {
            response.put("message", "Aucun compte en attente pour ce téléphone.");
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Vérifier si un compte en attente existe pour un téléphone et un rôle spécifique
     * GET /auth/verifier-compte/{telephone}/{role}
     */
    @GetMapping("/verifier-compte/{telephone}/{role}")
    public ResponseEntity<Map<String, Object>> verifierComptePersonnel(
            @org.springframework.web.bind.annotation.PathVariable String telephone,
            @org.springframework.web.bind.annotation.PathVariable String role) {
        
        String roleUpper = role.toUpperCase();
        boolean compteEnAttente;
        
        if ("ADMIN_CLINIQUE".equals(roleUpper)) {
            compteEnAttente = adminCliniqueService.existeCompteEnAttente(telephone);
        } else if (ROLES_PERSONNEL.contains(roleUpper)) {
            compteEnAttente = personnelService.existeCompteEnAttente(telephone, roleUpper);
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", "Rôle non reconnu: " + role));
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("telephone", telephone);
        response.put("role", roleUpper);
        response.put("compteEnAttente", compteEnAttente);
        
        if (compteEnAttente) {
            response.put("message", "Un compte " + roleUpper + " en attente existe. Vous pouvez compléter votre inscription.");
        } else {
            response.put("message", "Aucun compte " + roleUpper + " en attente pour ce téléphone.");
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Vérifier si un téléphone existe déjà (pour éviter les doublons)
     * GET /auth/verifier-telephone/{telephone}
     */
    @GetMapping("/verifier-telephone/{telephone}")
    public ResponseEntity<Map<String, Object>> verifierTelephone(@org.springframework.web.bind.annotation.PathVariable String telephone) {
        Map<String, Object> response = new HashMap<>();
        response.put("telephone", telephone);

        Optional<AdministrateurClinique> adminOpt = adminCliniqueService.trouverAdminParTelephone(telephone);
        if (adminOpt.isPresent()) {
            boolean actif = adminOpt.get().getActif() != null && adminOpt.get().getActif();
            response.put("existe", true);
            response.put("role", "ADMIN_CLINIQUE");
            response.put("actif", actif);
            if (!actif) {
                response.put("compteEnAttente", true);
                response.put("message", "Compte administrateur inactif. Veuillez compléter votre inscription.");
                response.put("peutInscrire", true);
            } else {
                response.put("compteEnAttente", false);
                response.put("message", "Compte administrateur déjà actif. Veuillez vous connecter.");
                response.put("peutInscrire", false);
            }
            return ResponseEntity.ok(response);
        }

        Optional<String> rolePersonnelEnAttente = personnelService.trouverRoleEnAttente(telephone);
        if (rolePersonnelEnAttente.isPresent()) {
            response.put("existe", true);
            response.put("role", rolePersonnelEnAttente.get());
            response.put("actif", false);
            response.put("compteEnAttente", true);
            response.put("message", "Compte " + rolePersonnelEnAttente.get() + " inactif. Veuillez compléter votre inscription.");
            response.put("peutInscrire", true);
            return ResponseEntity.ok(response);
        }

        Optional<String> rolePersonnel = personnelService.trouverRoleParTelephone(telephone);
        if (rolePersonnel.isPresent()) {
            response.put("existe", true);
            response.put("role", rolePersonnel.get());
            response.put("actif", true);
            response.put("compteEnAttente", false);
            response.put("message", "Compte " + rolePersonnel.get() + " déjà actif. Veuillez vous connecter.");
            response.put("peutInscrire", false);
            return ResponseEntity.ok(response);
        }

        boolean existe = authService.telephoneExiste(telephone);
        response.put("existe", existe);
        response.put("compteEnAttente", false);

        if (existe) {
            response.put("message", "Ce numéro de téléphone est déjà utilisé. Veuillez vous connecter.");
            response.put("peutInscrire", false);
        } else {
            response.put("role", "PATIENT");
            response.put("message", "Numéro libre. L'inscription publique est désactivée — contactez un administrateur.");
            response.put("peutInscrire", false);
        }

        return ResponseEntity.ok(response);
    }

    /**
     * Diagnostic - Vérifier les super admins créés
     * GET /auth/diagnostic/super-admins
     */
    @GetMapping("/diagnostic/super-admins")
    public ResponseEntity<Map<String, Object>> diagnosticSuperAdmins() {
        try {
            UserDetails user1 = appUserDetailsService.loadUserByUsername("super.admin");
            UserDetails user2 = appUserDetailsService.loadUserByUsername("super.admin2");

            return ResponseEntity.ok(Map.of(
                "super.admin_existe", true,
                "super.admin_role", user1.getAuthorities(),
                "super.admin2_existe", true,
                "super.admin2_role", user2.getAuthorities(),
                "message", " Les deux super admins sont correctement créés"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "message", " Erreur: " + e.getMessage(),
                "cause", "Les super admins n'ont pas été créés ou il y a une erreur lors de leur recherche"
            ));
        }
    }
}
