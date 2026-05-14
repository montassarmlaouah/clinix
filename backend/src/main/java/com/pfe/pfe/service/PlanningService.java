package com.pfe.pfe.service;

import com.pfe.pfe.model.Planning;
import com.pfe.pfe.model.Planning.TypePlanning;
import com.pfe.pfe.model.User;
import com.pfe.pfe.model.ChefPersonnel;
import com.pfe.pfe.repository.PlanningRepository;
import com.pfe.pfe.repository.UserRepository;
import com.pfe.pfe.repository.ChefPersonnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class PlanningService {
    
    private final PlanningRepository planningRepository;
    private final UserRepository userRepository;
    private final ChefPersonnelRepository chefPersonnelRepository;
    
    /**
     * Créer un planning hebdomadaire
     */
    public Planning creerPlanningHebdomadaire(LocalDate dateDebut, List<String> utilisateurIds, String createurId) {
        if (hasConflict(dateDebut, TypePlanning.HEBDOMADAIRE, utilisateurIds)) {
            throw new RuntimeException("Certains infirmiers ont déjà un planning pour cette période.");
        }
        ChefPersonnel createur = chefPersonnelRepository.findById(createurId)
            .orElseThrow(() -> new RuntimeException("Chef personnel non trouvé"));
        
        List<User> utilisateurs = new ArrayList<>();
        for (String userId : utilisateurIds) {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + userId));
            utilisateurs.add(user);
        }
        
        Planning planning = new Planning();
        planning.setDate(dateDebut);
        planning.setType(TypePlanning.HEBDOMADAIRE);
        planning.setCreateur(createur);
        planning.setUtilisateurs(utilisateurs);
        planning.setValide(false);
        
        return planningRepository.save(planning);
    }
    
    /**
     * Créer un planning mensuel
     */
    public Planning creerPlanningMensuel(LocalDate dateDebut, List<String> utilisateurIds, String createurId) {
        if (hasConflict(dateDebut, TypePlanning.MENSUEL, utilisateurIds)) {
            throw new RuntimeException("Certains infirmiers ont déjà un planning pour cette période.");
        }
        ChefPersonnel createur = chefPersonnelRepository.findById(createurId)
            .orElseThrow(() -> new RuntimeException("Chef personnel non trouvé"));
        
        List<User> utilisateurs = new ArrayList<>();
        for (String userId : utilisateurIds) {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé: " + userId));
            utilisateurs.add(user);
        }
        
        Planning planning = new Planning();
        planning.setDate(dateDebut);
        planning.setType(TypePlanning.MENSUEL);
        planning.setCreateur(createur);
        planning.setUtilisateurs(utilisateurs);
        planning.setValide(false);
        
        return planningRepository.save(planning);
    }
    
    public List<Planning> obtenirTousLesPlanning() {
        return planningRepository.findAllWithRelations();
    }
    
    public Planning obtenirPlanningParId(String id) {
        return planningRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Planning non trouvé"));
    }
    
    public List<Planning> obtenirPlanningParUtilisateur(String utilisateurId) {
        return planningRepository.findByUtilisateursIdWithRelations(utilisateurId);
    }
    
    public List<Planning> obtenirPlanningParPeriode(LocalDate debut, LocalDate fin) {
        return planningRepository.findByDateBetween(debut, fin);
    }
    
    public List<Planning> obtenirPlanningParType(TypePlanning type) {
        return planningRepository.findByType(type);
    }
    
    public Planning validerPlanning(String id) {
        Planning planning = obtenirPlanningParId(id);
        planning.setValide(true);
        return planningRepository.save(planning);
    }
    
    public Planning invaliderPlanning(String id) {
        Planning planning = obtenirPlanningParId(id);
        planning.setValide(false);
        return planningRepository.save(planning);
    }
    
    public void supprimerPlanning(String id) {
        Planning planning = obtenirPlanningParId(id);
        planningRepository.delete(planning);
    }
    
    public Planning ajouterUtilisateur(String planningId, String utilisateurId) {
        Planning planning = obtenirPlanningParId(planningId);
        User user = userRepository.findById(utilisateurId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        
        planning.getUtilisateurs().add(user);
        return planningRepository.save(planning);
    }
    
    public Planning retirerUtilisateur(String planningId, String utilisateurId) {
        Planning planning = obtenirPlanningParId(planningId);
        planning.getUtilisateurs().removeIf(u -> u.getId().equals(utilisateurId));
        return planningRepository.save(planning);
    }

    private boolean hasConflict(LocalDate dateDebut, TypePlanning type, List<String> utilisateurIds) {
        if (utilisateurIds == null || utilisateurIds.isEmpty()) {
            return false;
        }
        return !planningRepository.findConflictingPlans(dateDebut, type, utilisateurIds).isEmpty();
    }
}
