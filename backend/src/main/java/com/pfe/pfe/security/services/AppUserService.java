package com.pfe.pfe.security.services;

import com.pfe.pfe.security.model.AppRole;
import com.pfe.pfe.security.model.AppUser;
import com.pfe.pfe.security.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AppUserService {

    private   final AppUserRepository appUserRepository;
    private  final PasswordEncoder passwordEncoder;

    // Injection via le constructeur
    @Autowired
    public AppUserService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<AppUser> loadByUsername(String username) {
        return appUserRepository.findByUsername(username);
    }

    // Vérifie si le username existe déjà
    public boolean existsByUsername(String username) {
        return appUserRepository.findByUsername(username).isPresent();
    }

    // Sauvegarde un nouvel utilisateur avec mot de passe encodé et rôle
    public AppUser saveUser(String username, String password, String role) {
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(AppRole.valueOf(role)); // AppRole est un enum
        return appUserRepository.save(user);
    }
}
