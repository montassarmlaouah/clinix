package com.pfe.pfe.service;

import com.pfe.pfe.dto.SurveillanceInfirmiereDTO;
import com.pfe.pfe.model.*;
import com.pfe.pfe.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class SurveillanceInfirmiereService {
    
    private final SurveillanceInfirmiereRepository surveillanceRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    
    public SurveillanceInfirmiere creerSurveillance(SurveillanceInfirmiereDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        
        User userInfirmier = userRepository.findById(dto.getInfirmierId())
                .orElseThrow(() -> new RuntimeException("Infirmier non trouvé"));
        if (!(userInfirmier instanceof Infirmier)) {
            throw new RuntimeException("L'utilisateur spécifié n'est pas un infirmier");
        }
        Infirmier infirmier = (Infirmier) userInfirmier;
        
        SurveillanceInfirmiere surveillance = new SurveillanceInfirmiere();
        surveillance.setPatient(patient);
        surveillance.setInfirmier(infirmier);
        surveillance.setHeureObservation(dto.getHeureObservation() != null ? 
                dto.getHeureObservation() : LocalDateTime.now());
        
        // Paramètres vitaux
        surveillance.setTensionArterielleSystemique(dto.getTensionArterielleSystemique());
        surveillance.setTensionArterielleDiastolique(dto.getTensionArterielleDiastolique());
        surveillance.setFrequenceCardiaque(dto.getFrequenceCardiaque());
        surveillance.setFrequenceRespiratoire(dto.getFrequenceRespiratoire());
        surveillance.setSaturationOxygene(dto.getSaturationOxygene());
        surveillance.setTemperature(dto.getTemperature());
        
        // Paramètres métaboliques
        surveillance.setGlycemieCapillaire(dto.getGlycemieCapillaire());
        surveillance.setAcetonuriePositive(dto.getAcetonuriePositive());
        surveillance.setGlucosuriePositive(dto.getGlucosuriePositive());
        
        // Bilan hydrique
        surveillance.setEntreesHydriques(dto.getEntreesHydriques());
        surveillance.setSortiesUrines(dto.getSortiesUrines());
        surveillance.setTypeHydratation(dto.getTypeHydratation());
        
        // État clinique
        surveillance.setScoreGlasgow(dto.getScoreGlasgow());
        surveillance.setScoreEVA(dto.getScoreEVA());
        surveillance.setEtatConscience(dto.getEtatConscience());
        surveillance.setEtatRespiratoire(dto.getEtatRespiratoire());
        
        // Oxygénothérapie
        surveillance.setSousOxygene(dto.getSousOxygene());
        surveillance.setDebitOxygene(dto.getDebitOxygene());
        surveillance.setModeAdministration(dto.getModeAdministration());
        
        // Observations
        surveillance.setObservations(dto.getObservations());
        surveillance.setSoinsRealises(dto.getSoinsRealises());
        surveillance.setAerosoltherapieAdministree(dto.getAerosoltherapieAdministree());
        surveillance.setMedicamentsAdministres(dto.getMedicamentsAdministres());
        
        // Détection automatique des alertes
        detecterAlertes(surveillance);
        
        return surveillanceRepository.save(surveillance);
    }
    
    private void detecterAlertes(SurveillanceInfirmiere surveillance) {
        StringBuilder alertes = new StringBuilder();
        
        // Alerte SpO2
        if (surveillance.getSaturationOxygene() != null && surveillance.getSaturationOxygene() < 94.0) {
            alertes.append("SpO2 < 94% (").append(surveillance.getSaturationOxygene()).append("%). ");
            surveillance.setAlerteDeclenche(true);
        }
        
        // Alerte Glycémie
        if (surveillance.getGlycemieCapillaire() != null) {
            if (surveillance.getGlycemieCapillaire() > 2.5) {
                alertes.append("Hyperglycémie > 2.5 g/L (")
                       .append(surveillance.getGlycemieCapillaire()).append("). ");
                surveillance.setAlerteDeclenche(true);
            } else if (surveillance.getGlycemieCapillaire() < 0.7) {
                alertes.append("Hypoglycémie < 0.7 g/L (")
                       .append(surveillance.getGlycemieCapillaire()).append("). ");
                surveillance.setAlerteDeclenche(true);
            }
        }
        
        // Alerte Tension artérielle
        if (surveillance.getTensionArterielleSystemique() != null && 
            surveillance.getTensionArterielleSystemique() < 90) {
            alertes.append("Hypotension < 9/x mmHg. ");
            surveillance.setAlerteDeclenche(true);
        }
        
        // Alerte Score de Glasgow
        if (surveillance.getScoreGlasgow() != null && surveillance.getScoreGlasgow() < 13) {
            alertes.append("Glasgow < 13 (").append(surveillance.getScoreGlasgow()).append("). ");
            surveillance.setAlerteDeclenche(true);
        }
        
        // Alerte Température
        if (surveillance.getTemperature() != null) {
            if (surveillance.getTemperature() > 38.5) {
                alertes.append("Fièvre > 38.5°C (").append(surveillance.getTemperature()).append("°C). ");
                surveillance.setAlerteDeclenche(true);
            } else if (surveillance.getTemperature() < 36.0) {
                alertes.append("Hypothermie < 36°C (").append(surveillance.getTemperature()).append("°C). ");
                surveillance.setAlerteDeclenche(true);
            }
        }
        
        if (alertes.length() > 0) {
            surveillance.setTypeAlerte(alertes.toString().trim());
        }
    }
    
    public List<SurveillanceInfirmiere> obtenirSurveillancesPatient(String patientId) {
        return surveillanceRepository.findByPatientIdOrderByHeureObservationDesc(patientId);
    }
    
    public List<SurveillanceInfirmiere> obtenirSurveillancesPatientPeriode(
            String patientId, LocalDateTime debut, LocalDateTime fin) {
        return surveillanceRepository.findByPatientIdAndHeureObservationBetweenOrderByHeureObservationDesc(
                patientId, debut, fin);
    }
    
    public List<SurveillanceInfirmiere> obtenirSurveillancesDuJour(String patientId) {
        LocalDateTime debut = LocalDate.now().atStartOfDay();
        LocalDateTime fin = LocalDate.now().plusDays(1).atStartOfDay();
        return surveillanceRepository.findTodaySurveillancesByPatientId(patientId, debut, fin);
    }
    
    public SurveillanceInfirmiere obtenirDerniereSurveillance(String patientId) {
        List<SurveillanceInfirmiere> surveillances = surveillanceRepository.findLastByPatientId(patientId);
        return surveillances.isEmpty() ? null : surveillances.get(0);
    }
    
    public List<SurveillanceInfirmiere> obtenirSurveillancesAvecAlertes(String patientId) {
        return surveillanceRepository.findByPatientIdAndAlerteDeclencheTrue(patientId);
    }
    
    public List<SurveillanceInfirmiere> obtenirSurveillancesInfirmier(String infirmierId) {
        return surveillanceRepository.findByInfirmierId(infirmierId);
    }
    
    public SurveillanceInfirmiere obtenirSurveillanceParId(String id) {
        return surveillanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Surveillance non trouvée"));
    }
    
    public SurveillanceInfirmiere mettreAJourSurveillance(String id, SurveillanceInfirmiereDTO dto) {
        SurveillanceInfirmiere surveillance = obtenirSurveillanceParId(id);
        
        // Mise à jour des paramètres vitaux
        if (dto.getTensionArterielleSystemique() != null) {
            surveillance.setTensionArterielleSystemique(dto.getTensionArterielleSystemique());
        }
        if (dto.getTensionArterielleDiastolique() != null) {
            surveillance.setTensionArterielleDiastolique(dto.getTensionArterielleDiastolique());
        }
        if (dto.getFrequenceCardiaque() != null) {
            surveillance.setFrequenceCardiaque(dto.getFrequenceCardiaque());
        }
        if (dto.getSaturationOxygene() != null) {
            surveillance.setSaturationOxygene(dto.getSaturationOxygene());
        }
        if (dto.getGlycemieCapillaire() != null) {
            surveillance.setGlycemieCapillaire(dto.getGlycemieCapillaire());
        }
        if (dto.getObservations() != null) {
            surveillance.setObservations(dto.getObservations());
        }
        
        // Re-détecter les alertes
        detecterAlertes(surveillance);
        
        return surveillanceRepository.save(surveillance);
    }
    
    public void supprimerSurveillance(String id) {
        surveillanceRepository.deleteById(id);
    }
    
    // ============ RECHERCHE ============
    
    public List<SurveillanceInfirmiere> rechercherParPatient(String searchTerm) {
        return surveillanceRepository.rechercherParPatient(searchTerm);
    }
    
    public List<SurveillanceInfirmiere> rechercherParInfirmier(String searchTerm) {
        return surveillanceRepository.rechercherParInfirmier(searchTerm);
    }
    
    public List<SurveillanceInfirmiere> rechercheGlobale(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return List.of();
        }
        return surveillanceRepository.rechercheGlobale(searchTerm.trim());
    }
    
    public List<SurveillanceInfirmiere> rechercheAvancee(
            String patientId, 
            String infirmierId, 
            LocalDateTime dateDebut, 
            LocalDateTime dateFin, 
            Boolean avecAlerte) {
        return surveillanceRepository.rechercheAvancee(
                patientId, infirmierId, dateDebut, dateFin, avecAlerte);
    }
    
    // ============ ALERTES ET VALIDATION ============
    
    public List<SurveillanceInfirmiere> obtenirToutesLesAlertes() {
        return surveillanceRepository.findAllAlertesNonValidees();
    }
    
    // ============ STATISTIQUES ============
    
    public Map<String, Object> obtenirStatistiquesPatient(String patientId) {
        List<SurveillanceInfirmiere> surveillances = 
                surveillanceRepository.findByPatientIdOrderByHeureObservationDesc(patientId);
        
        if (surveillances.isEmpty()) {
            return Map.of(
                "total", 0,
                "alertes", 0,
                "dernierControle", "Aucun"
            );
        }
        
        long totalAlertes = surveillances.stream()
                .filter(s -> Boolean.TRUE.equals(s.getAlerteDeclenche()))
                .count();
        
        SurveillanceInfirmiere derniere = surveillances.get(0);
        
        // Calcul des moyennes sur les 24 dernières heures
        LocalDateTime il24h = LocalDateTime.now().minusHours(24);
        List<SurveillanceInfirmiere> dernieres24h = surveillances.stream()
                .filter(s -> s.getHeureObservation().isAfter(il24h))
                .toList();
        
        Double moyenneSaturation = dernieres24h.stream()
                .filter(s -> s.getSaturationOxygene() != null)
                .mapToDouble(SurveillanceInfirmiere::getSaturationOxygene)
                .average()
                .orElse(0.0);
        
        Double moyenneGlycemie = dernieres24h.stream()
                .filter(s -> s.getGlycemieCapillaire() != null)
                .mapToDouble(SurveillanceInfirmiere::getGlycemieCapillaire)
                .average()
                .orElse(0.0);
        
        return Map.of(
            "total", surveillances.size(),
            "alertes", totalAlertes,
            "dernierControle", derniere.getHeureObservation().toString(),
            "controles24h", dernieres24h.size(),
            "moyenneSaturation24h", String.format("%.1f", moyenneSaturation),
            "moyenneGlycemie24h", String.format("%.2f", moyenneGlycemie),
            "derniereSaturation", derniere.getSaturationOxygene() != null ? derniere.getSaturationOxygene() : "N/A",
            "derniereGlycemie", derniere.getGlycemieCapillaire() != null ? derniere.getGlycemieCapillaire() : "N/A"
        );
    }
    
    public Map<String, Object> obtenirStatistiquesGlobales() {
        List<SurveillanceInfirmiere> toutes = surveillanceRepository.findAll();
        List<SurveillanceInfirmiere> alertes = surveillanceRepository.findAllAlertesNonValidees();
        
        LocalDateTime aujourdhui = LocalDate.now().atStartOfDay();
        long controlesAujourdhui = toutes.stream()
                .filter(s -> s.getHeureObservation().isAfter(aujourdhui))
                .count();
        
        return Map.of(
            "totalControles", toutes.size(),
            "totalAlertes", alertes.size(),
            "controlesAujourdhui", controlesAujourdhui,
            "patientsUniques", toutes.stream()
                    .map(s -> s.getPatient().getId())
                    .distinct()
                    .count()
        );
    }
}
