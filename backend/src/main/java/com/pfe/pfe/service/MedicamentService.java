package com.pfe.pfe.service;

import com.pfe.pfe.model.Medicament;
import com.pfe.pfe.repository.MedicamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class MedicamentService {
    
    private final MedicamentRepository medicamentRepository;
    
    public Medicament creerMedicament(Medicament medicament) {
        // Forcer l'ID à null pour éviter les conflits (l'ID sera auto-généré)
        medicament.setId(null);

        if (!StringUtils.hasText(medicament.getNom())) {
            throw new RuntimeException("Le nom du médicament est obligatoire");
        }

        // Valeurs par défaut pour supporter la création rapide côté frontend pharmacie
        if (!StringUtils.hasText(medicament.getForme())) {
            medicament.setForme("Comprimé");
        }
        if (!StringUtils.hasText(medicament.getDosage())) {
            medicament.setDosage("N/A");
        }
        if (medicament.getPrix() == null) {
            medicament.setPrix(BigDecimal.ZERO);
        }

        if (!StringUtils.hasText(medicament.getCode())) {
            medicament.setCode(genererCodeUnique());
        } else if (medicamentRepository.findByCode(medicament.getCode()).isPresent()) {
            throw new RuntimeException("Ce médicament existe déjà");
        }

        return medicamentRepository.save(medicament);
    }
    
    public List<Medicament> obtenirTousLesMedicaments() {
        return medicamentRepository.findAll();
    }
    
    public Medicament obtenirMedicamentParId(String id) {
        return medicamentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Médicament non trouvé"));
    }
    
    public List<Medicament> rechercherMedicaments(String recherche) {
        return medicamentRepository.findByNomContainingIgnoreCase(recherche);
    }
    
    public Medicament mettreAJourMedicament(String id, Medicament medicamentDetails) {
        Medicament medicament = obtenirMedicamentParId(id);

        if (StringUtils.hasText(medicamentDetails.getNom())) {
            medicament.setNom(medicamentDetails.getNom());
        }
        if (medicamentDetails.getDescription() != null) {
            medicament.setDescription(medicamentDetails.getDescription());
        }
        if (StringUtils.hasText(medicamentDetails.getForme())) {
            medicament.setForme(medicamentDetails.getForme());
        }
        if (StringUtils.hasText(medicamentDetails.getDosage())) {
            medicament.setDosage(medicamentDetails.getDosage());
        }
        if (medicamentDetails.getPrix() != null) {
            medicament.setPrix(medicamentDetails.getPrix());
        }

        return medicamentRepository.save(medicament);
    }
    
    public void supprimerMedicament(String id) {
        Medicament medicament = obtenirMedicamentParId(id);
        medicamentRepository.delete(medicament);
    }

    private String genererCodeUnique() {
        String code;
        do {
            code = "MED-" + System.currentTimeMillis();
        } while (medicamentRepository.findByCode(code).isPresent());
        return code;
    }
}
