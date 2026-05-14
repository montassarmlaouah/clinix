package com.pfe.pfe.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pfe.pfe.model.Garde;
import com.pfe.pfe.model.Garde.TypeGarde;
import com.pfe.pfe.model.Planning;
import com.pfe.pfe.model.User;
import com.pfe.pfe.repository.AbsenceRepository;
import com.pfe.pfe.repository.GardeRepository;
import com.pfe.pfe.repository.PlanningRepository;
import com.pfe.pfe.repository.ServiceRepository;
import com.pfe.pfe.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class GardeService {
    
    private final GardeRepository gardeRepository;
    private final UserRepository userRepository;
    private final PlanningRepository planningRepository;
    private final ServiceRepository serviceRepository;
    private final AbsenceRepository absenceRepository;
    
    /**
     * Créer un shift de jour (7h-13h ou 13h-19h)
     */
    public Garde creerShiftJour(String utilisateurId, LocalDate date, boolean matin, String planningId, String serviceId) {
        User utilisateur = userRepository.findById(utilisateurId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Blocage si congé sur ce jour (EN_ATTENTE ou APPROUVEE)
        if (absenceRepository.existsOverlappingAbsence(utilisateurId, date, date)) {
            throw new RuntimeException("Impossible de planifier: l'infirmier est en congé sur cette date");
        }
        
        Planning planning = null;
        if (planningId != null) {
            planning = planningRepository.findById(planningId)
                .orElseThrow(() -> new RuntimeException("Planning non trouvé"));
        }

        com.pfe.pfe.model.Service service = null;
        if (serviceId != null && !serviceId.isBlank()) {
            service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service non trouvé"));
        }
        
        Garde garde = new Garde();
        garde.setUtilisateur(utilisateur);
        garde.setPlanning(planning);
        garde.setService(service);
        garde.setType(TypeGarde.JOUR);
        
        if (matin) {
            // Shift du matin : 7h-13h
            garde.setDebut(LocalDateTime.of(date, LocalTime.of(7, 0)));
            garde.setFin(LocalDateTime.of(date, LocalTime.of(13, 0)));
        } else {
            // Shift de l'après-midi : 13h-19h
            garde.setDebut(LocalDateTime.of(date, LocalTime.of(13, 0)));
            garde.setFin(LocalDateTime.of(date, LocalTime.of(19, 0)));
        }
        
        return gardeRepository.save(garde);
    }
    
    /**
     * Créer une garde de nuit (19h-7h) sur 2 jours
     */
    public Garde creerGardeNuit(String utilisateurId, LocalDate dateDebut, String planningId, String serviceId) {
        User utilisateur = userRepository.findById(utilisateurId)
            .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Garde nuit chevauche 2 jours: dateDebut -> dateDebut+1
        if (absenceRepository.existsOverlappingAbsence(utilisateurId, dateDebut, dateDebut.plusDays(1))) {
            throw new RuntimeException("Impossible de planifier: l'infirmier est en congé sur cette période");
        }
        
        Planning planning = null;
        if (planningId != null) {
            planning = planningRepository.findById(planningId)
                .orElseThrow(() -> new RuntimeException("Planning non trouvé"));
        }

        com.pfe.pfe.model.Service service = null;
        if (serviceId != null && !serviceId.isBlank()) {
            service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service non trouvé"));
        }
        
        Garde garde = new Garde();
        garde.setUtilisateur(utilisateur);
        garde.setPlanning(planning);
        garde.setService(service);
        garde.setType(TypeGarde.NUIT);
        
        // Garde de nuit : 19h (jour 1) à 7h (jour 2)
        garde.setDebut(LocalDateTime.of(dateDebut, LocalTime.of(19, 0)));
        garde.setFin(LocalDateTime.of(dateDebut.plusDays(1), LocalTime.of(7, 0)));
        
        return gardeRepository.save(garde);
    }
    
    /**
     * Créer un planning hebdomadaire de 6 jours (shifts matin)
     */
    public List<Garde> creerPlanningHebdomadaireMatin(String utilisateurId, LocalDate dateDebut, String planningId, String serviceId) {
        List<Garde> gardes = new ArrayList<>();
        
        for (int i = 0; i < 6; i++) {
            Garde garde = creerShiftJour(utilisateurId, dateDebut.plusDays(i), true, planningId, serviceId);
            gardes.add(garde);
        }
        
        return gardes;
    }
    
    /**
     * Créer un planning hebdomadaire de 6 jours (shifts après-midi)
     */
    public List<Garde> creerPlanningHebdomadaireApresMidi(String utilisateurId, LocalDate dateDebut, String planningId, String serviceId) {
        List<Garde> gardes = new ArrayList<>();
        
        for (int i = 0; i < 6; i++) {
            Garde garde = creerShiftJour(utilisateurId, dateDebut.plusDays(i), false, planningId, serviceId);
            gardes.add(garde);
        }
        
        return gardes;
    }
    
    public List<Garde> obtenirToutesLesGardes() {
        return gardeRepository.findAll();
    }
    
    public Garde obtenirGardeParId(String id) {
        return gardeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Garde non trouvée"));
    }
    
    public List<Garde> obtenirGardesParUtilisateur(String utilisateurId) {
        return gardeRepository.findByUtilisateurId(utilisateurId);
    }
    
    public List<Garde> obtenirGardesParPeriode(LocalDateTime debut, LocalDateTime fin) {
        return gardeRepository.findByDebutBetween(debut, fin);
    }
    
    public List<Garde> obtenirGardesParType(TypeGarde type) {
        return gardeRepository.findByType(type);
    }
    
    public List<Garde> obtenirGardesParPlanning(String planningId) {
        return gardeRepository.findByPlanningId(planningId);
    }
    
    public void supprimerGarde(String id) {
        Garde garde = obtenirGardeParId(id);
        gardeRepository.delete(garde);
    }
    
    public Garde modifierGarde(String id, LocalDateTime debut, LocalDateTime fin) {
        Garde garde = obtenirGardeParId(id);
        garde.setDebut(debut);
        garde.setFin(fin);
        return gardeRepository.save(garde);
    }
}
