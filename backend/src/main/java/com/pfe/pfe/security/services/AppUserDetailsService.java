package com.pfe.pfe.security.services;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.pfe.pfe.model.*;
import com.pfe.pfe.repository.*;
import com.pfe.pfe.security.model.AppRole;
import com.pfe.pfe.security.model.AppUser;
import com.pfe.pfe.security.repository.AppUserRepository;

@Service
public class AppUserDetailsService implements UserDetailsService {

    private final AppUserRepository appUserRepository;
    private final AdministrateurCliniqueRepository adminCliniqueRepository;
    private final MedecinRepository medecinRepository;
    private final InfirmierRepository infirmierRepository;
    private final RadiologueRepository radiologueRepository;
    private final PharmacienRepository pharmacienRepository;
    private final SecretaireRepository secretaireRepository;
    private final ChefPersonnelRepository chefPersonnelRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AppUserDetailsService(AppUserRepository appUserRepository, 
                                  AdministrateurCliniqueRepository adminCliniqueRepository,
                                  MedecinRepository medecinRepository,
                                  InfirmierRepository infirmierRepository,
                                  RadiologueRepository radiologueRepository,
                                  PharmacienRepository pharmacienRepository,
                                  SecretaireRepository secretaireRepository,
                                  ChefPersonnelRepository chefPersonnelRepository,
                                  TechnicienMaintenanceRepository technicienMaintenanceRepository,
                                  PatientRepository patientRepository,
                                  PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.adminCliniqueRepository = adminCliniqueRepository;
        this.medecinRepository = medecinRepository;
        this.infirmierRepository = infirmierRepository;
        this.radiologueRepository = radiologueRepository;
        this.pharmacienRepository = pharmacienRepository;
        this.secretaireRepository = secretaireRepository;
        this.chefPersonnelRepository = chefPersonnelRepository;
        this.technicienMaintenanceRepository = technicienMaintenanceRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // D'abord chercher dans AppUser (Super Admin, etc.)
        Optional<AppUser> appUserOpt = appUserRepository.findByUsername(username);
        
        if (appUserOpt.isPresent()) {
            AppUser user = appUserOpt.get();
            return new CustomUserDetails(user.getUsername(), user.getPassword(), user.getRole().name(), user.getId());
        }
        
        // Chercher dans AdministrateurClinique par téléphone
        Optional<AdministrateurClinique> adminOpt = adminCliniqueRepository.findByTelephone(username);
        if (adminOpt.isPresent()) {
            AdministrateurClinique admin = adminOpt.get();
            String cliniqueId = admin.getClinique() != null ? admin.getClinique().getId() : null;
            return buildCustomUserDetails(admin, "ADMIN_CLINIQUE", cliniqueId, username);
        }
        
        // Chercher dans Medecin
        Optional<Medecin> medecinOpt = medecinRepository.findByTelephone(username);
        if (medecinOpt.isPresent()) {
            Medecin medecin = medecinOpt.get();
            String cliniqueId = medecin.getClinique() != null ? medecin.getClinique().getId() : null;
            return buildCustomUserDetails(medecin, "MEDECIN", cliniqueId, username);
        }
        
        // Chercher dans Infirmier
        Optional<Infirmier> infirmierOpt = infirmierRepository.findByTelephone(username);
        if (infirmierOpt.isPresent()) {
            Infirmier infirmier = infirmierOpt.get();
            String cliniqueId = infirmier.getClinique() != null ? infirmier.getClinique().getId() : null;
            return buildCustomUserDetails(infirmier, "INFIRMIER", cliniqueId, username);
        }
        
        // Chercher dans Radiologue
        Optional<Radiologue> radiologueOpt = radiologueRepository.findByTelephone(username);
        if (radiologueOpt.isPresent()) {
            Radiologue radiologue = radiologueOpt.get();
            String cliniqueId = radiologue.getClinique() != null ? radiologue.getClinique().getId() : null;
            return buildCustomUserDetails(radiologue, "RADIOLOGUE", cliniqueId, username);
        }
        
        // Chercher dans Pharmacien
        Optional<Pharmacien> pharmacienOpt = pharmacienRepository.findByTelephone(username);
        if (pharmacienOpt.isPresent()) {
            Pharmacien pharmacien = pharmacienOpt.get();
            String cliniqueId = pharmacien.getClinique() != null ? pharmacien.getClinique().getId() : null;
            return buildCustomUserDetails(pharmacien, "PHARMACIEN", cliniqueId, username);
        }
        
        // Chercher dans Secretaire
        Optional<Secretaire> secretaireOpt = secretaireRepository.findByTelephone(username);
        if (secretaireOpt.isPresent()) {
            Secretaire secretaire = secretaireOpt.get();
            String cliniqueId = secretaire.getClinique() != null ? secretaire.getClinique().getId() : null;
            return buildCustomUserDetails(secretaire, "SECRETAIRE", cliniqueId, username);
        }
        
        // Chercher dans ChefPersonnel
        Optional<ChefPersonnel> chefOpt = chefPersonnelRepository.findByTelephone(username);
        if (chefOpt.isPresent()) {
            ChefPersonnel chef = chefOpt.get();
            String cliniqueId = chef.getClinique() != null ? chef.getClinique().getId() : null;
            return buildCustomUserDetails(chef, "CHEF_PERSONNEL", cliniqueId, username);
        }
        
        // Chercher dans TechnicienMaintenance
        Optional<TechnicienMaintenance> technicienOpt = technicienMaintenanceRepository.findByTelephone(username);
        if (technicienOpt.isPresent()) {
            TechnicienMaintenance technicien = technicienOpt.get();
            String cliniqueId = technicien.getClinique() != null ? technicien.getClinique().getId() : null;
            return buildCustomUserDetails(technicien, "TECHNICIEN_MAINTENANCE", cliniqueId, username);
        }
        
        // Chercher dans Patient
        Optional<Patient> patientOpt = patientRepository.findByTelephone(username);
        if (patientOpt.isPresent()) {
            return buildCustomUserDetails(patientOpt.get(), "PATIENT", null, username);
        }
        
        throw new UsernameNotFoundException("Utilisateur non trouvé: " + username);
    }

    /**
     * Construit CustomUserDetails pour un utilisateur de type User (personnel, admin, patient)
     */
    private CustomUserDetails buildCustomUserDetails(User user, String role, String cliniqueId, String username) {
        // Vérifier que le compte est actif
        if (user.getActif() == null || !user.getActif()) {
            throw new UsernameNotFoundException("Compte non activé: " + username);
        }
        
        // Vérifier que le mot de passe existe
        if (user.getMotDePasse() == null || user.getMotDePasse().isEmpty()) {
            throw new UsernameNotFoundException("Compte non enregistré: " + username);
        }
        
        return new CustomUserDetails(user, role, cliniqueId);
    }

    public boolean existsByUsername(String username) {
        return appUserRepository.findByUsername(username).isPresent();
    }

    public AppUser saveUser(String username, String password, String role) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(AppRole.valueOf(role));
        return appUserRepository.save(user);
    }
}

