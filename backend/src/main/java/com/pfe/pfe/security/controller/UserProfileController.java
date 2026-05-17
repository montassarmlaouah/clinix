package com.pfe.pfe.security.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.model.ChefPersonnel;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.Pharmacien;
import com.pfe.pfe.model.Radiologue;
import com.pfe.pfe.model.Secretaire;
import com.pfe.pfe.model.TechnicienMaintenance;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.ChefPersonnelRepository;
import com.pfe.pfe.repository.InfirmierRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PatientRepository;
import com.pfe.pfe.repository.PharmacienRepository;
import com.pfe.pfe.repository.RadiologueRepository;
import com.pfe.pfe.repository.SecretaireRepository;
import com.pfe.pfe.repository.TechnicienMaintenanceRepository;
import com.pfe.pfe.repository.UserRepository;
import com.pfe.pfe.service.TunisieSmsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Profil utilisateur connecté (JWT).
 * GET /auth/profile — lecture
 * PUT /auth/profile — mise à jour (e-mail, téléphone, CIN, nom, prénom)
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class UserProfileController {

    private static final Pattern EMAIL_SIMPLE =
            Pattern.compile("^[\\w.%+-]+@[\\w.-]+\\.[A-Za-z]{2,}$");

    private final PatientRepository patientRepository;
    private final AdministrateurCliniqueRepository adminRepository;
    private final MedecinRepository medecinRepository;
    private final InfirmierRepository infirmierRepository;
    private final PharmacienRepository pharmacienRepository;
    private final RadiologueRepository radiologueRepository;
    private final SecretaireRepository secretaireRepository;
    private final ChefPersonnelRepository chefPersonnelRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;
    private final UserRepository userRepository;
    private final CliniqueRepository cliniqueRepository;
    private final TunisieSmsService tunisieSmsService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            String username = auth.getName();

            log.info("Récupération du profil pour: {}", username);

            Map<String, Object> profile = findUserProfile(username);

            if (profile == null) {
                return ResponseEntity.notFound().build();
            }

            enrichCliniqueNom(profile);
            return ResponseEntity.ok(profile);

        } catch (Exception e) {
            log.error("Erreur lors de la récupération du profil", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur lors de la récupération du profil: " + e.getMessage()
            ));
        }
    }

    private void putCommonUserFields(Map<String, Object> profile, User u) {
        profile.put("email", u.getEmail());
        profile.put("cin", u.getNumeroPieceIdentite());
        if (u.getDateCreation() != null) {
            profile.put("dateCreation", u.getDateCreation().toString());
        }
    }

    private Map<String, Object> findUserProfile(String username) {
        Map<String, Object> profile = new HashMap<>();

        if ("super.admin".equals(username) || "super.admin2".equals(username)) {
            profile.put("id", null);
            profile.put("nom", "Super");
            profile.put("prenom", "Admin");
            profile.put("telephone", null);
            profile.put("email", null);
            profile.put("cin", null);
            profile.put("role", "SUPER_ADMIN");
            profile.put("cliniqueId", null);
            profile.put("profilModifiable", false);
            return profile;
        }

        Optional<AdministrateurClinique> adminOpt = adminRepository.findByTelephone(username);
        if (adminOpt.isPresent()) {
            AdministrateurClinique admin = adminOpt.get();
            profile.put("id", admin.getId());
            profile.put("nom", admin.getNom());
            profile.put("prenom", admin.getPrenom());
            profile.put("telephone", admin.getTelephone());
            profile.put("role", "ADMIN_CLINIQUE");
            profile.put("cliniqueId", admin.getClinique() != null ? admin.getClinique().getId() : null);
            profile.put("cliniqueNom", admin.getClinique() != null ? admin.getClinique().getNom() : null);
            putCommonUserFields(profile, admin);
            profile.put("profilModifiable", true);
            return profile;
        }

        Optional<Medecin> medecinOpt = medecinRepository.findByTelephone(username);
        if (medecinOpt.isPresent()) {
            Medecin medecin = medecinOpt.get();
            profile.put("id", medecin.getId());
            profile.put("nom", medecin.getNom());
            profile.put("prenom", medecin.getPrenom());
            profile.put("telephone", medecin.getTelephone());
            profile.put("role", "MEDECIN");
            profile.put("specialite", medecin.getSpecialite());
            profile.put("cliniqueId", medecin.getClinique() != null ? medecin.getClinique().getId() : null);
            putCommonUserFields(profile, medecin);
            profile.put("profilModifiable", true);
            return profile;
        }

        Optional<Infirmier> infirmierOpt = infirmierRepository.findByTelephone(username);
        if (infirmierOpt.isPresent()) {
            Infirmier infirmier = infirmierOpt.get();
            profile.put("id", infirmier.getId());
            profile.put("nom", infirmier.getNom());
            profile.put("prenom", infirmier.getPrenom());
            profile.put("telephone", infirmier.getTelephone());
            profile.put("role", "INFIRMIER");
            profile.put("cliniqueId", infirmier.getClinique() != null ? infirmier.getClinique().getId() : null);
            putCommonUserFields(profile, infirmier);
            profile.put("profilModifiable", true);
            return profile;
        }

        Optional<Pharmacien> pharmacienOpt = pharmacienRepository.findByTelephone(username);
        if (pharmacienOpt.isPresent()) {
            Pharmacien pharmacien = pharmacienOpt.get();
            profile.put("id", pharmacien.getId());
            profile.put("nom", pharmacien.getNom());
            profile.put("prenom", pharmacien.getPrenom());
            profile.put("telephone", pharmacien.getTelephone());
            profile.put("role", "PHARMACIEN");
            profile.put("cliniqueId", pharmacien.getClinique() != null ? pharmacien.getClinique().getId() : null);
            putCommonUserFields(profile, pharmacien);
            profile.put("profilModifiable", true);
            return profile;
        }

        Optional<Radiologue> radiologueOpt = radiologueRepository.findByTelephone(username);
        if (radiologueOpt.isPresent()) {
            Radiologue radiologue = radiologueOpt.get();
            profile.put("id", radiologue.getId());
            profile.put("nom", radiologue.getNom());
            profile.put("prenom", radiologue.getPrenom());
            profile.put("telephone", radiologue.getTelephone());
            profile.put("role", "RADIOLOGUE");
            profile.put("cliniqueId", radiologue.getClinique() != null ? radiologue.getClinique().getId() : null);
            putCommonUserFields(profile, radiologue);
            profile.put("profilModifiable", true);
            return profile;
        }

        Optional<Secretaire> secretaireOpt = secretaireRepository.findByTelephone(username);
        if (secretaireOpt.isPresent()) {
            Secretaire secretaire = secretaireOpt.get();
            profile.put("id", secretaire.getId());
            profile.put("nom", secretaire.getNom());
            profile.put("prenom", secretaire.getPrenom());
            profile.put("telephone", secretaire.getTelephone());
            profile.put("role", "SECRETAIRE");
            profile.put("cliniqueId", secretaire.getClinique() != null ? secretaire.getClinique().getId() : null);
            putCommonUserFields(profile, secretaire);
            profile.put("profilModifiable", true);
            return profile;
        }

        Optional<ChefPersonnel> chefOpt = chefPersonnelRepository.findByTelephone(username);
        if (chefOpt.isPresent()) {
            ChefPersonnel chef = chefOpt.get();
            profile.put("id", chef.getId());
            profile.put("nom", chef.getNom());
            profile.put("prenom", chef.getPrenom());
            profile.put("telephone", chef.getTelephone());
            profile.put("role", "CHEF_PERSONNEL");
            profile.put("cliniqueId", chef.getClinique() != null ? chef.getClinique().getId() : null);
            putCommonUserFields(profile, chef);
            profile.put("profilModifiable", true);
            return profile;
        }

        Optional<TechnicienMaintenance> technicienOpt = technicienMaintenanceRepository.findByTelephone(username);
        if (technicienOpt.isPresent()) {
            TechnicienMaintenance technicien = technicienOpt.get();
            profile.put("id", technicien.getId());
            profile.put("nom", technicien.getNom());
            profile.put("prenom", technicien.getPrenom());
            profile.put("telephone", technicien.getTelephone());
            profile.put("role", "TECHNICIEN_MAINTENANCE");
            profile.put("cliniqueId", technicien.getClinique() != null ? technicien.getClinique().getId() : null);
            putCommonUserFields(profile, technicien);
            profile.put("profilModifiable", true);
            return profile;
        }

        Optional<Patient> patientOpt = patientRepository.findByTelephone(username);
        if (patientOpt.isPresent()) {
            Patient patient = patientOpt.get();
            profile.put("id", patient.getId());
            profile.put("nom", patient.getNom());
            profile.put("prenom", patient.getPrenom());
            profile.put("telephone", patient.getTelephone());
            profile.put("role", "PATIENT");
            profile.put("numeroPatient", patient.getNumeroPatient());
            profile.put("cliniqueId", null);
            putCommonUserFields(profile, patient);
            profile.put("profilModifiable", true);
            return profile;
        }

        return null;
    }

    private void enrichCliniqueNom(Map<String, Object> profile) {
        if (profile.get("cliniqueNom") != null) {
            return;
        }
        Object cid = profile.get("cliniqueId");
        if (cid == null) {
            return;
        }
        cliniqueRepository.findById(cid.toString()).ifPresent(c -> profile.put("cliniqueNom", c.getNom()));
    }

    /**
     * Changement de mot de passe pour l'utilisateur connecté (JWT).
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@RequestBody Map<String, String> body) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
            }
            String username = auth.getName();

            if ("super.admin".equals(username) || "super.admin2".equals(username)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Le mot de passe super administrateur ne peut pas être modifié ici."
                ));
            }

            String ancien = body != null ? body.get("ancienMotDePasse") : null;
            String nouveau = body != null ? body.get("nouveauMotDePasse") : null;
            String confirmation = body != null ? body.get("confirmationMotDePasse") : null;

            if (!StringUtils.hasText(ancien) || !StringUtils.hasText(nouveau) || !StringUtils.hasText(confirmation)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Tous les champs sont obligatoires."));
            }
            if (!nouveau.equals(confirmation)) {
                return ResponseEntity.badRequest().body(Map.of("error", "La confirmation ne correspond pas au nouveau mot de passe."));
            }
            if (nouveau.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le mot de passe doit contenir au moins 6 caractères."));
            }

            Optional<User> userOpt = userRepository.findByTelephone(username);
            if (userOpt.isEmpty() && StringUtils.hasText(username)) {
                String normalized = tunisieSmsService.normalizeInternationalTunisia(username);
                if (!normalized.equals(username)) {
                    userOpt = userRepository.findByTelephone(normalized);
                }
            }
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur introuvable"));
            }

            User user = userOpt.get();
            String stored = user.getMotDePasse();
            if (!StringUtils.hasText(stored) || !passwordEncoder.matches(ancien, stored)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Ancien mot de passe incorrect."));
            }

            user.setMotDePasse(passwordEncoder.encode(nouveau));
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Mot de passe modifié avec succès"));
        } catch (Exception e) {
            log.error("Erreur changement mot de passe", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur lors du changement de mot de passe: " + e.getMessage()
            ));
        }
    }

    /**
     * Met à jour l'entité {@link User} (tous les rôles sauf super-admin applicatif).
     * Champs supportés : nom, prenom, email, telephone, cin (numéro de pièce d'identité).
     */
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, String> updates) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Non authentifié"));
            }
            String username = auth.getName();

            if ("super.admin".equals(username) || "super.admin2".equals(username)) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Le profil super administrateur n'est pas modifiable depuis cette interface."
                ));
            }

            log.info("Mise à jour du profil pour: {}", username);

            Optional<User> userOpt = userRepository.findByTelephone(username);
            if (userOpt.isEmpty() && StringUtils.hasText(username)) {
                String normalized = tunisieSmsService.normalizeInternationalTunisia(username);
                if (!normalized.equals(username)) {
                    userOpt = userRepository.findByTelephone(normalized);
                }
            }
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Utilisateur introuvable"));
            }

            User user = userOpt.get();
            boolean reconnectRequired = false;

            if (updates.containsKey("nom")) {
                String nom = updates.get("nom");
                if (nom != null && !nom.trim().isEmpty()) {
                    user.setNom(nom.trim());
                }
            }
            if (updates.containsKey("prenom")) {
                String prenom = updates.get("prenom");
                if (prenom != null && !prenom.trim().isEmpty()) {
                    user.setPrenom(prenom.trim());
                }
            }

            if (updates.containsKey("email")) {
                String raw = updates.get("email");
                String em = raw == null ? "" : raw.trim();
                if (em.isEmpty()) {
                    user.setEmail(null);
                } else {
                    if (!EMAIL_SIMPLE.matcher(em).matches()) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Format d'e-mail invalide."));
                    }
                    if (userRepository.existsByEmailIgnoreCaseAndIdNot(em, user.getId())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Cette adresse e-mail est déjà utilisée."));
                    }
                    user.setEmail(em);
                }
            }

            if (updates.containsKey("telephone")) {
                String telRaw = updates.get("telephone");
                if (telRaw == null || !StringUtils.hasText(telRaw.trim())) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Le numéro de téléphone est obligatoire."));
                }
                String telNorm = tunisieSmsService.normalizeInternationalTunisia(telRaw.trim());
                if (!StringUtils.hasText(telNorm) || telNorm.length() < 8) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Numéro de téléphone invalide."));
                }
                if (!telNorm.equals(user.getTelephone())) {
                    if (userRepository.existsByTelephoneAndIdNot(telNorm, user.getId())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Ce numéro de téléphone est déjà utilisé."));
                    }
                    user.setTelephone(telNorm);
                    reconnectRequired = true;
                }
            }

            if (updates.containsKey("cin")) {
                String cinRaw = updates.get("cin");
                String cin = cinRaw == null ? "" : cinRaw.trim().toUpperCase();
                if (cin.isEmpty()) {
                    user.setNumeroPieceIdentite(null);
                } else {
                    if (cin.length() > 64) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Le CIN est trop long (64 caractères max)."));
                    }
                    if (userRepository.existsByNumeroPieceIdentiteAndIdNot(cin, user.getId())) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Ce numéro de pièce d'identité est déjà enregistré."));
                    }
                    user.setNumeroPieceIdentite(cin);
                }
            }

            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profil mis à jour avec succès");
            response.put("nom", user.getNom());
            response.put("prenom", user.getPrenom());
            response.put("email", user.getEmail());
            response.put("telephone", user.getTelephone());
            response.put("cin", user.getNumeroPieceIdentite());
            response.put("reconnectRequired", reconnectRequired);
            if (reconnectRequired) {
                response.put("info", "Le numéro de connexion a changé : reconnectez-vous avec le nouveau numéro.");
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du profil", e);
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Erreur lors de la mise à jour du profil: " + e.getMessage()
            ));
        }
    }
}
