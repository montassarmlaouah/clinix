package com.pfe.pfe.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.pfe.pfe.security.model.AppRole;
import com.pfe.pfe.security.model.AppUser;
import com.pfe.pfe.security.repository.AppUserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        try {
            log.info("═══════════════════════════════════════════════════════");
            log.info("🚀 INITIALISATION DES SUPER ADMINS - DÉMARRAGE");
            log.info("═══════════════════════════════════════════════════════");

            // Initialiser le Super Admin 1
            if (!appUserRepository.findByUsername("super.admin").isPresent()) {
                log.info(" Création de super.admin...");
                AppUser superAdmin1 = new AppUser();
                superAdmin1.setUsername("super.admin");
                superAdmin1.setPassword(passwordEncoder.encode("Password123!"));
                superAdmin1.setRole(AppRole.SUPER_ADMIN);
                appUserRepository.save(superAdmin1);
                log.info("✅ Super Admin 1 créé avec succès : super.admin");
            } else {
                log.info("⏭️  Super Admin 1 existe déjà : super.admin");
            }

            // Initialiser le Super Admin 2
            if (!appUserRepository.findByUsername("super.admin2").isPresent()) {
                log.info("➕ Création de super.admin2...");
                AppUser superAdmin2 = new AppUser();
                superAdmin2.setUsername("super.admin2");
                superAdmin2.setPassword(passwordEncoder.encode("Password123!"));
                superAdmin2.setRole(AppRole.SUPER_ADMIN);
                appUserRepository.save(superAdmin2);
                log.info("✅ Super Admin 2 créé avec succès : super.admin2");
            } else {
                log.info("⏭️  Super Admin 2 existe déjà : super.admin2");
            }

            log.info("═══════════════════════════════════════════════════════");
            log.info("✨ INITIALISATION TERMINÉE AVEC SUCCÈS");
            log.info("═══════════════════════════════════════════════════════");
            log.info("📝 Pour tester :");
            log.info("   - Username: super.admin ou super.admin2");
            log.info("   - Password: Password123!");
            log.info("   - Endpoint: POST /auth/login");
            log.info("═══════════════════════════════════════════════════════");

        } catch (Exception e) {
            log.error("❌ ERREUR lors de l'initialisation des super admins", e);
            throw e;
        }
    }
}
