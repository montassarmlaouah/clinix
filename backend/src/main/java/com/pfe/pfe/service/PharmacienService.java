package com.pfe.pfe.service;

import com.pfe.pfe.model.Pharmacien;
import com.pfe.pfe.repository.PharmacienRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PharmacienService {
    
    private final PharmacienRepository pharmacienRepository;
    
    public Pharmacien creerPharmacien(Pharmacien pharmacien) {
        // Forcer l'ID à null pour éviter les conflits (l'ID sera auto-généré)
        pharmacien.setId(null);
        
        // Vérifier si le téléphone existe déjà
        if (pharmacienRepository.findByTelephone(pharmacien.getTelephone()).isPresent()) {
            throw new RuntimeException("Un pharmacien avec ce numéro de téléphone existe déjà");
        }
        
        // Générer le numéro d'ordre automatiquement
        String numeroOrdre = genererNumeroOrdre();
        pharmacien.setNumeroOrdre(numeroOrdre);
        pharmacien.setActif(true);
        
        return pharmacienRepository.save(pharmacien);
    }
    
    public List<Pharmacien> obtenirTousLesPharmaciens() {
        return pharmacienRepository.findAll();
    }
    
    public Pharmacien obtenirPharmacienParId(String id) {
        return pharmacienRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Pharmacien non trouvé avec l'id: " + id));
    }
    
    public Pharmacien obtenirPharmacienParTelephone(String telephone) {
        return pharmacienRepository.findByTelephone(telephone)
            .orElseThrow(() -> new RuntimeException("Pharmacien non trouvé avec le téléphone: " + telephone));
    }
    
    public Pharmacien obtenirPharmacienParNumeroOrdre(String numeroOrdre) {
        return pharmacienRepository.findByNumeroOrdre(numeroOrdre)
            .orElseThrow(() -> new RuntimeException("Pharmacien non trouvé avec le numéro d'ordre: " + numeroOrdre));
    }
    
    public List<Pharmacien> obtenirPharmacienParClinique(String cliniqueId) {
        return pharmacienRepository.findByCliniqueId(cliniqueId);
    }
    
    public List<Pharmacien> obtenirPharmacienActifs() {
        return pharmacienRepository.findByActif(true);
    }
    
    public List<Pharmacien> obtenirPharmacienInactifs() {
        return pharmacienRepository.findByActif(false);
    }
    
    public Pharmacien mettreAJourPharmacien(String id, Pharmacien pharmacienDetails) {
        Pharmacien pharmacien = obtenirPharmacienParId(id);
        
        if (pharmacienDetails.getNom() != null) {
            pharmacien.setNom(pharmacienDetails.getNom());
        }
        if (pharmacienDetails.getPrenom() != null) {
            pharmacien.setPrenom(pharmacienDetails.getPrenom());
        }
        if (pharmacienDetails.getTelephone() != null && 
            !pharmacien.getTelephone().equals(pharmacienDetails.getTelephone())) {
            // Vérifier si le nouveau téléphone n'est pas déjà utilisé
            if (pharmacienRepository.findByTelephone(pharmacienDetails.getTelephone()).isPresent()) {
                throw new RuntimeException("Ce numéro de téléphone est déjà utilisé");
            }
            pharmacien.setTelephone(pharmacienDetails.getTelephone());
        }
        
        return pharmacienRepository.save(pharmacien);
    }
    
    public Pharmacien activerPharmacien(String id) {
        Pharmacien pharmacien = obtenirPharmacienParId(id);
        pharmacien.setActif(true);
        return pharmacienRepository.save(pharmacien);
    }
    
    public Pharmacien desactiverPharmacien(String id) {
        Pharmacien pharmacien = obtenirPharmacienParId(id);
        pharmacien.setActif(false);
        return pharmacienRepository.save(pharmacien);
    }
    
    public void supprimerPharmacien(String id) {
        Pharmacien pharmacien = obtenirPharmacienParId(id);
        pharmacienRepository.delete(pharmacien);
    }
    
    private String genererNumeroOrdre() {
        int annee = java.time.Year.now().getValue();
        long count = pharmacienRepository.count() + 1;
        return String.format("PHA-%d-%03d", annee, count);
    }
}
