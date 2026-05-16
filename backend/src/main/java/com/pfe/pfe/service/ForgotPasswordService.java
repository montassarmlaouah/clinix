package com.pfe.pfe.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.model.ChefPersonnel;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.model.Pharmacien;
import com.pfe.pfe.model.Radiologue;
import com.pfe.pfe.model.Secretaire;
import com.pfe.pfe.model.SuperAdministrateur;
import com.pfe.pfe.model.TechnicienMaintenance;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.ChefPersonnelRepository;
import com.pfe.pfe.repository.InfirmierRepository;
import com.pfe.pfe.repository.MedecinRepository;
import com.pfe.pfe.repository.PatientRepository;
import com.pfe.pfe.repository.PharmacienRepository;
import com.pfe.pfe.repository.RadiologueRepository;
import com.pfe.pfe.repository.SecretaireRepository;
import com.pfe.pfe.repository.TechnicienMaintenanceRepository;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service pour gérer la réinitialisation de mot de passe
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ForgotPasswordService {

    private final OtpSmsService otpSmsService;
    private final TunisieSmsService tunisieSmsService;
    private final PasswordEncoder passwordEncoder;
    private final PersonnelEmailService personnelEmailService;
    private final UserRepository userRepository;
    
    // Repositories pour tous les types d'utilisateurs
    private final PatientRepository patientRepository;
    private final AdministrateurCliniqueRepository adminRepository;
    private final MedecinRepository medecinRepository;
    private final InfirmierRepository infirmierRepository;
    private final PharmacienRepository pharmacienRepository;
    private final RadiologueRepository radiologueRepository;
    private final SecretaireRepository secretaireRepository;
    private final ChefPersonnelRepository chefPersonnelRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;

    // Stockage des tokens de réinitialisation (en production, utiliser Redis)
    private final Map<String, ResetTokenData> resetTokenStorage = new ConcurrentHashMap<>();

    /** OTP e-mail (clé = e-mail normalisé minuscule) */
    private final Map<String, EmailOtpData> emailOtpStorage = new ConcurrentHashMap<>();

    // Durée de validité du token (15 minutes)
    private static final int TOKEN_VALIDITY_MINUTES = 15;

    private static final int EMAIL_OTP_VALIDITY_MINUTES = 5;

    /**
     * Étape 1: Envoyer un code de vérification par SMS
     */
    public Map<String, Object> sendVerificationCode(String telephone) {
        Map<String, Object> response = new HashMap<>();

        UserInfo userInfo = findUserByTelephone(telephone);

        if (userInfo == null) {
            log.warn("Tentative de réinitialisation pour un téléphone non enregistré: {}", telephone);
            response.put("success", false);
            response.put("message", "Aucun compte associé à ce numéro de téléphone");
            return response;
        }

        var otpResult = otpSmsService.envoyerCodeOtp(telephone);
        if (!otpResult.smsEnvoyeParApi()) {
            log.warn("OTP généré mais envoi TunisieSMS non confirmé pour {} — détail côté logs [OTP]", telephone);
        }

        log.info("Code de vérification pour la réinitialisation de mot de passe: {} (type: {})",
                telephone, userInfo.userType);

        response.put("success", true);
        response.put("message", "Code de vérification envoyé par SMS");
        response.put("channel", "SMS");
        response.put("userType", userInfo.userType);

        return response;
    }

    /**
     * Étape 1 (e-mail): envoyer un code OTP par e-mail
     */
    public Map<String, Object> sendVerificationCodeByEmail(String email) {
        Map<String, Object> response = new HashMap<>();
        String emailKey = normalizeEmail(email);

        UserInfo userInfo = findUserByEmail(emailKey);
        if (userInfo == null) {
            log.warn("Tentative de réinitialisation pour un e-mail non enregistré: {}", emailKey);
            response.put("success", false);
            response.put("message", "Aucun compte associé à cette adresse e-mail");
            return response;
        }

        String code = genererCodeOtpSixChiffres();
        emailOtpStorage.put(emailKey, new EmailOtpData(code, LocalDateTime.now().plusMinutes(EMAIL_OTP_VALIDITY_MINUTES)));

        boolean envoye = false;
        if (personnelEmailService.isMailConfigured()) {
            try {
                personnelEmailService.sendTextEmail(
                        userInfo.user.getEmail().trim(),
                        "[Clinix] Réinitialisation du mot de passe",
                        "Votre code de vérification : " + code + " (valide " + EMAIL_OTP_VALIDITY_MINUTES
                                + " min). Ne le partagez avec personne.");
                envoye = true;
            } catch (Exception e) {
                log.error("[OTP Email] Échec envoi vers {} : {}", emailKey, e.getMessage());
            }
        } else {
            log.warn("[OTP Email] spring.mail non configuré — code pour {} : {}", emailKey, code);
        }

        response.put("success", true);
        response.put("channel", "EMAIL");
        response.put("emailSent", envoye);
        response.put("message", envoye
                ? "Code de vérification envoyé par e-mail"
                : "Code généré ; l'e-mail n'a pas pu être envoyé (vérifiez la configuration e-mail du serveur).");
        response.put("userType", userInfo.userType);
        return response;
    }

    /**
     * Étape 2: Vérifier le code et générer un token de réinitialisation (SMS)
     */
    public Map<String, Object> verifyCode(String telephone, String code) {
        Map<String, Object> response = new HashMap<>();

        boolean isValid = otpSmsService.verifierCodeOtp(telephone, code);

        if (!isValid) {
            response.put("success", false);
            response.put("message", "Code invalide ou expiré");
            return response;
        }

        String resetToken = UUID.randomUUID().toString();
        String subjectKey = tunisieSmsService.normalizeOtpStorageKey(telephone);
        ResetTokenData tokenData = new ResetTokenData(
                subjectKey,
                false,
                LocalDateTime.now().plusMinutes(TOKEN_VALIDITY_MINUTES));
        resetTokenStorage.put(resetToken, tokenData);

        log.info("Code vérifié avec succès. Token de réinitialisation généré pour (SMS): {}", telephone);

        response.put("success", true);
        response.put("message", "Code vérifié avec succès");
        response.put("resetToken", resetToken);

        return response;
    }

    /**
     * Étape 2 (e-mail): vérifier le code OTP e-mail
     */
    public Map<String, Object> verifyCodeByEmail(String email, String code) {
        Map<String, Object> response = new HashMap<>();
        String emailKey = normalizeEmail(email);

        EmailOtpData data = emailOtpStorage.get(emailKey);
        if (data == null) {
            response.put("success", false);
            response.put("message", "Code invalide ou expiré");
            return response;
        }
        if (LocalDateTime.now().isAfter(data.expiration())) {
            emailOtpStorage.remove(emailKey);
            response.put("success", false);
            response.put("message", "Code invalide ou expiré");
            return response;
        }
        if (!data.code().equals(code.trim())) {
            response.put("success", false);
            response.put("message", "Code invalide ou expiré");
            return response;
        }

        emailOtpStorage.remove(emailKey);

        String resetToken = UUID.randomUUID().toString();
        ResetTokenData tokenData = new ResetTokenData(
                emailKey,
                true,
                LocalDateTime.now().plusMinutes(TOKEN_VALIDITY_MINUTES));
        resetTokenStorage.put(resetToken, tokenData);

        log.info("Code e-mail vérifié avec succès. Token généré pour: {}", emailKey);

        response.put("success", true);
        response.put("message", "Code vérifié avec succès");
        response.put("resetToken", resetToken);
        return response;
    }

    /**
     * Étape 3: Réinitialiser le mot de passe (téléphone ou e-mail selon le canal du token)
     */
    @Transactional
    public Map<String, Object> resetPassword(String telephone, String email, String newPassword, String resetToken) {
        Map<String, Object> response = new HashMap<>();

        boolean useEmail = email != null && !email.isBlank();
        String subjectKey = useEmail ? normalizeEmail(email) : tunisieSmsService.normalizeOtpStorageKey(telephone);

        if (resetToken != null && !resetToken.isEmpty()) {
            ResetTokenData tokenData = resetTokenStorage.get(resetToken);

            if (tokenData == null) {
                response.put("success", false);
                response.put("message", "Token de réinitialisation invalide");
                return response;
            }

            if (LocalDateTime.now().isAfter(tokenData.expiration())) {
                resetTokenStorage.remove(resetToken);
                response.put("success", false);
                response.put("message", "Token de réinitialisation expiré");
                return response;
            }

            if (tokenData.emailChannel() != useEmail || !tokenData.subjectKey().equals(subjectKey)) {
                response.put("success", false);
                response.put("message", useEmail
                        ? "Le token ne correspond pas à cette adresse e-mail"
                        : "Le token ne correspond pas au numéro de téléphone");
                return response;
            }
        }

        UserInfo userInfo = useEmail ? findUserByEmail(subjectKey) : findUserByTelephone(telephone);

        if (userInfo == null) {
            response.put("success", false);
            response.put("message", "Utilisateur non trouvé");
            return response;
        }

        String encodedPassword = passwordEncoder.encode(newPassword);

        boolean updated = updateUserPassword(userInfo, encodedPassword);

        if (!updated) {
            response.put("success", false);
            response.put("message", "Erreur lors de la mise à jour du mot de passe");
            return response;
        }

        if (resetToken != null) {
            resetTokenStorage.remove(resetToken);
        }

        log.info("Mot de passe réinitialisé avec succès (canal {}) pour: {}",
                useEmail ? "EMAIL" : "SMS", subjectKey);

        response.put("success", true);
        response.put("message", "Mot de passe réinitialisé avec succès");

        return response;
    }

    private String genererCodeOtpSixChiffres() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000);
        return String.valueOf(code);
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private UserInfo findUserByEmail(String emailNormalized) {
        if (emailNormalized == null || emailNormalized.isBlank()) {
            return null;
        }
        Optional<User> opt = userRepository.findByEmailIgnoreCase(emailNormalized);
        return opt.map(this::mapUserToUserInfo).orElse(null);
    }

    private UserInfo mapUserToUserInfo(User user) {
        if (user instanceof Patient p) {
            return new UserInfo(p, "PATIENT");
        }
        if (user instanceof AdministrateurClinique a) {
            return new UserInfo(a, "ADMIN_CLINIQUE");
        }
        if (user instanceof Medecin m) {
            return new UserInfo(m, "MEDECIN");
        }
        if (user instanceof Infirmier i) {
            return new UserInfo(i, "INFIRMIER");
        }
        if (user instanceof Pharmacien p) {
            return new UserInfo(p, "PHARMACIEN");
        }
        if (user instanceof Radiologue r) {
            return new UserInfo(r, "RADIOLOGUE");
        }
        if (user instanceof Secretaire s) {
            return new UserInfo(s, "SECRETAIRE");
        }
        if (user instanceof ChefPersonnel c) {
            return new UserInfo(c, "CHEF_PERSONNEL");
        }
        if (user instanceof TechnicienMaintenance t) {
            return new UserInfo(t, "TECHNICIEN_MAINTENANCE");
        }
        if (user instanceof SuperAdministrateur sa) {
            return new UserInfo(sa, "SUPER_ADMIN");
        }
        log.warn("Type utilisateur non géré pour réinitialisation mot de passe: {}", user.getClass().getName());
        return null;
    }

    private record EmailOtpData(String code, LocalDateTime expiration) {
    }

    /**
     * Rechercher un utilisateur par téléphone dans tous les repositories (plusieurs formats possibles).
     */
    private UserInfo findUserByTelephone(String telephone) {
        for (String variant : telephoneVariants(telephone)) {
            UserInfo found = findUserByTelephoneExact(variant);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    private List<String> telephoneVariants(String telephone) {
        LinkedHashSet<String> out = new LinkedHashSet<>();
        if (telephone == null || telephone.isBlank()) {
            return List.of();
        }
        String t = telephone.trim();
        out.add(t);
        String g = tunisieSmsService.normalizeGsm(t);
        if (g != null) {
            out.add(g);
            out.add("+" + g);
            if (g.length() >= 11 && g.startsWith("216")) {
                String local = g.substring(3);
                out.add(local);
                out.add("0" + local);
            }
        }
        return new ArrayList<>(out);
    }

    private UserInfo findUserByTelephoneExact(String telephone) {
        Optional<Patient> patient = patientRepository.findByTelephone(telephone);
        if (patient.isPresent()) {
            return new UserInfo(patient.get(), "PATIENT");
        }

        Optional<AdministrateurClinique> admin = adminRepository.findByTelephone(telephone);
        if (admin.isPresent()) {
            return new UserInfo(admin.get(), "ADMIN_CLINIQUE");
        }

        Optional<Medecin> medecin = medecinRepository.findByTelephone(telephone);
        if (medecin.isPresent()) {
            return new UserInfo(medecin.get(), "MEDECIN");
        }

        Optional<Infirmier> infirmier = infirmierRepository.findByTelephone(telephone);
        if (infirmier.isPresent()) {
            return new UserInfo(infirmier.get(), "INFIRMIER");
        }

        Optional<Pharmacien> pharmacien = pharmacienRepository.findByTelephone(telephone);
        if (pharmacien.isPresent()) {
            return new UserInfo(pharmacien.get(), "PHARMACIEN");
        }

        Optional<Radiologue> radiologue = radiologueRepository.findByTelephone(telephone);
        if (radiologue.isPresent()) {
            return new UserInfo(radiologue.get(), "RADIOLOGUE");
        }

        Optional<Secretaire> secretaire = secretaireRepository.findByTelephone(telephone);
        if (secretaire.isPresent()) {
            return new UserInfo(secretaire.get(), "SECRETAIRE");
        }

        Optional<ChefPersonnel> chefPersonnel = chefPersonnelRepository.findByTelephone(telephone);
        if (chefPersonnel.isPresent()) {
            return new UserInfo(chefPersonnel.get(), "CHEF_PERSONNEL");
        }

        Optional<TechnicienMaintenance> technicien = technicienMaintenanceRepository.findByTelephone(telephone);
        if (technicien.isPresent()) {
            return new UserInfo(technicien.get(), "TECHNICIEN_MAINTENANCE");
        }

        return null;
    }

    /**
     * Mettre à jour le mot de passe de l'utilisateur
     */
    private boolean updateUserPassword(UserInfo userInfo, String encodedPassword) {
        try {
            User user = userInfo.user;
            user.setMotDePasse(encodedPassword);

            // Sauvegarder selon le type
            switch (userInfo.userType) {
                case "PATIENT":
                    patientRepository.save((Patient) user);
                    break;
                case "ADMIN_CLINIQUE":
                    adminRepository.save((AdministrateurClinique) user);
                    break;
                case "MEDECIN":
                    medecinRepository.save((Medecin) user);
                    break;
                case "INFIRMIER":
                    infirmierRepository.save((Infirmier) user);
                    break;
                case "PHARMACIEN":
                    pharmacienRepository.save((Pharmacien) user);
                    break;
                case "RADIOLOGUE":
                    radiologueRepository.save((Radiologue) user);
                    break;
                case "SECRETAIRE":
                    secretaireRepository.save((Secretaire) user);
                    break;
                case "CHEF_PERSONNEL":
                    chefPersonnelRepository.save((ChefPersonnel) user);
                    break;
                case "TECHNICIEN_MAINTENANCE":
                    technicienMaintenanceRepository.save((TechnicienMaintenance) user);
                    break;
                case "SUPER_ADMIN":
                    userRepository.save((SuperAdministrateur) user);
                    break;
                default:
                    return false;
            }
            return true;
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du mot de passe", e);
            return false;
        }
    }

    /**
     * Classe interne pour stocker les informations utilisateur
     */
    private static class UserInfo {
        final User user;
        final String userType;

        UserInfo(User user, String userType) {
            this.user = user;
            this.userType = userType;
        }
    }

    /**
     * Données du token de réinitialisation (téléphone normalisé ou e-mail normalisé)
     */
    private record ResetTokenData(String subjectKey, boolean emailChannel, LocalDateTime expiration) {
    }
}
