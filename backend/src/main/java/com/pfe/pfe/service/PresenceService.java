package com.pfe.pfe.service;

import com.pfe.pfe.model.ChefPersonnel;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Presence;
import com.pfe.pfe.repository.ChefPersonnelRepository;
import com.pfe.pfe.repository.InfirmierRepository;
import com.pfe.pfe.repository.PresenceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PresenceService {
    
    private final PresenceRepository presenceRepository;
    private final InfirmierRepository infirmierRepository;
    private final ChefPersonnelRepository chefPersonnelRepository;
    
    /**
     * Marquer la présence d'un infirmier
     */
    public Presence marquerPresence(String infirmierId, LocalDate date, LocalTime heureArrivee, 
                                     String chefPersonnelId, String observation) {
        Infirmier infirmier = infirmierRepository.findById(infirmierId)
            .orElseThrow(() -> new RuntimeException("Infirmier non trouvé"));
        
        ChefPersonnel chef = chefPersonnelRepository.findById(chefPersonnelId)
            .orElseThrow(() -> new RuntimeException("Chef de personnel non trouvé"));
        
        // Vérifier si une présence existe déjà pour cette date
        var existante = presenceRepository.findByInfirmierIdAndDatePresence(infirmierId, date);
        if (existante.isPresent()) {
            throw new RuntimeException("Une présence existe déjà pour cet infirmier à cette date");
        }
        
        Presence presence = new Presence();
        presence.setInfirmier(infirmier);
        presence.setDatePresence(date);
        presence.setHeureArrivee(heureArrivee);
        presence.setPresent(true);
        presence.setObservation(observation);
        presence.setMarquePar(chef);
        
        log.info("Présence marquée pour {} {} le {}", infirmier.getPrenom(), infirmier.getNom(), date);
        return presenceRepository.save(presence);
    }
    
    /**
     * Marquer l'absence d'un infirmier
     */
    public Presence marquerAbsence(String infirmierId, LocalDate date, String motif, 
                                    String chefPersonnelId) {
        Infirmier infirmier = infirmierRepository.findById(infirmierId)
            .orElseThrow(() -> new RuntimeException("Infirmier non trouvé"));
        
        ChefPersonnel chef = chefPersonnelRepository.findById(chefPersonnelId)
            .orElseThrow(() -> new RuntimeException("Chef de personnel non trouvé"));
        
        // Vérifier si une présence existe déjà
        var existante = presenceRepository.findByInfirmierIdAndDatePresence(infirmierId, date);
        if (existante.isPresent()) {
            throw new RuntimeException("Une présence existe déjà pour cet infirmier à cette date");
        }
        
        Presence presence = new Presence();
        presence.setInfirmier(infirmier);
        presence.setDatePresence(date);
        presence.setPresent(false);
        presence.setStatut("ABSENT");
        presence.setObservation(motif);
        presence.setMarquePar(chef);
        
        log.info("Absence marquée pour {} {} le {}", infirmier.getPrenom(), infirmier.getNom(), date);
        return presenceRepository.save(presence);
    }
    
    /**
     * Marquer la présence de tous les infirmiers d'une clinique
     */
    public List<Presence> marquerPresencesMultiples(List<String> infirmierIds, LocalDate date, 
                                                     String chefPersonnelId) {
        List<Presence> presences = new java.util.ArrayList<>();
        
        for (String infirmierId : infirmierIds) {
            try {
                Presence presence = marquerPresence(infirmierId, date, LocalTime.now(), chefPersonnelId, "Présence marquée en masse");
                presences.add(presence);
            } catch (Exception e) {
                log.error("Erreur lors du marquage de présence pour l'infirmier {}: {}", infirmierId, e.getMessage());
            }
        }
        
        return presences;
    }
    
    /**
     * Enregistrer l'heure de départ
     */
    public Presence enregistrerDepart(String presenceId, LocalTime heureDepart) {
        Presence presence = presenceRepository.findById(presenceId)
            .orElseThrow(() -> new RuntimeException("Présence non trouvée"));
        
        presence.setHeureDepart(heureDepart);
        return presenceRepository.save(presence);
    }
    
    /**
     * Obtenir toutes les présences
     */
    public List<Presence> obtenirToutesLesPresences() {
        return presenceRepository.findAll();
    }
    
    /**
     * Obtenir les présences du jour
     */
    public List<Presence> obtenirPresencesDuJour(LocalDate date) {
        return presenceRepository.findByDatePresence(date);
    }
    
    /**
     * Obtenir les absences du jour
     */
    public List<Presence> obtenirAbsencesDuJour(LocalDate date) {
        return presenceRepository.findAbsencesDuJour(date);
    }
    
    /**
     * Obtenir les retards du jour
     */
    public List<Presence> obtenirRetardsDuJour(LocalDate date) {
        return presenceRepository.findRetardsDuJour(date);
    }
    
    /**
     * Obtenir l'historique de présence d'un infirmier
     */
    public List<Presence> obtenirHistoriqueInfirmier(String infirmierId) {
        return presenceRepository.findByInfirmierId(infirmierId);
    }
    
    /**
     * Obtenir les présences par période
     */
    public List<Presence> obtenirPresencesParPeriode(LocalDate debut, LocalDate fin) {
        return presenceRepository.findByPeriode(debut, fin);
    }
    
    /**
     * Obtenir les statistiques de présence d'un infirmier
     */
    public Map<String, Object> obtenirStatistiquesInfirmier(String infirmierId, LocalDate debut, LocalDate fin) {
        Long nbPresences = presenceRepository.countPresencesParPeriode(infirmierId, debut, fin);
        Long nbAbsences = presenceRepository.countAbsencesParPeriode(infirmierId, debut, fin);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("infirmierId", infirmierId);
        stats.put("periodeDebut", debut);
        stats.put("periodeFin", fin);
        stats.put("nombrePresences", nbPresences);
        stats.put("nombreAbsences", nbAbsences);
        stats.put("total", nbPresences + nbAbsences);
        
        if ((nbPresences + nbAbsences) > 0) {
            double tauxPresence = (nbPresences * 100.0) / (nbPresences + nbAbsences);
            stats.put("tauxPresence", String.format("%.2f%%", tauxPresence));
        } else {
            stats.put("tauxPresence", "0%");
        }
        
        return stats;
    }
    
    /**
     * Modifier une présence existante
     */
    public Presence modifierPresence(String id, Boolean present, LocalTime heureArrivee, 
                                     LocalTime heureDepart, String observation) {
        Presence presence = presenceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Présence non trouvée"));
        
        if (present != null) {
            presence.setPresent(present);
        }
        if (heureArrivee != null) {
            presence.setHeureArrivee(heureArrivee);
        }
        if (heureDepart != null) {
            presence.setHeureDepart(heureDepart);
        }
        if (observation != null) {
            presence.setObservation(observation);
        }
        
        return presenceRepository.save(presence);
    }
    
    /**
     * Supprimer une présence
     */
    public void supprimerPresence(String id) {
        Presence presence = presenceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Présence non trouvée"));
        presenceRepository.delete(presence);
    }
}
