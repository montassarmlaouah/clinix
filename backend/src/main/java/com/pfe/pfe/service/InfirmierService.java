package com.pfe.pfe.service;

import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.repository.InfirmierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InfirmierService {
    
    private final InfirmierRepository infirmierRepository;
    private final PasswordEncoder passwordEncoder;
    
    public Infirmier creerInfirmier(Infirmier infirmier) {
        if (infirmierRepository.findByTelephone(infirmier.getTelephone()).isPresent()) {
            throw new RuntimeException("Un infirmier avec ce numéro de téléphone existe déjà");
        }
        
        infirmier.setMotDePasse(passwordEncoder.encode(infirmier.getMotDePasse()));
        infirmier.setDateCreation(LocalDateTime.now());
        infirmier.setActif(true);
        
        return infirmierRepository.save(infirmier);
    }
    
    public List<Infirmier> obtenirTousLesInfirmiers() {
        return infirmierRepository.findAll();
    }
    
    public Infirmier obtenirInfirmierParId(String id) {
        return infirmierRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Infirmier non trouvé"));
    }
    
    public List<Infirmier> obtenirInfirmiersParClinique(String cliniqueId) {
        return infirmierRepository.findByCliniqueId(cliniqueId);
    }
    
    public Infirmier mettreAJourInfirmier(String id, Infirmier infirmierDetails) {
        Infirmier infirmier = obtenirInfirmierParId(id);
        
        infirmier.setNom(infirmierDetails.getNom());
        infirmier.setPrenom(infirmierDetails.getPrenom());
        infirmier.setTelephone(infirmierDetails.getTelephone());
        
        return infirmierRepository.save(infirmier);
    }
    
    public void supprimerInfirmier(String id) {
        Infirmier infirmier = obtenirInfirmierParId(id);
        infirmier.setActif(false);
        infirmierRepository.save(infirmier);
    }
}
