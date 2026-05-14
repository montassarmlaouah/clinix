package com.pfe.pfe.controller;

import com.pfe.pfe.dto.SurveillanceInfirmiereDTO;
import com.pfe.pfe.model.SurveillanceInfirmiere;
import com.pfe.pfe.service.SurveillanceInfirmiereService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour la surveillance infirmière
 * Gère toutes les opérations liées à la surveillance continue des patients
 */
@RestController
@RequestMapping("/api/surveillances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SurveillanceInfirmiereController {
    
    private final SurveillanceInfirmiereService surveillanceService;
    
    /**
     * Créer une nouvelle surveillance infirmière
     * POST /api/surveillances
     */
    @PostMapping
    public ResponseEntity<SurveillanceInfirmiere> creerSurveillance(
            @RequestBody SurveillanceInfirmiereDTO dto) {
        SurveillanceInfirmiere surveillance = surveillanceService.creerSurveillance(dto);
        return new ResponseEntity<>(surveillance, HttpStatus.CREATED);
    }
    
 
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<SurveillanceInfirmiere>> obtenirSurveillancesPatient(
            @PathVariable String patientId) {
        List<SurveillanceInfirmiere> surveillances = 
                surveillanceService.obtenirSurveillancesPatient(patientId);
        return ResponseEntity.ok(surveillances);
    }
    
    /**
     * Obtenir les surveillances d'un patient sur une période
     * GET /api/surveillances/patient/{patientId}/periode?debut=...&fin=...
     */
    @GetMapping("/patient/{patientId}/periode")
    public ResponseEntity<List<SurveillanceInfirmiere>> obtenirSurveillancesPeriode(
            @PathVariable String patientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        List<SurveillanceInfirmiere> surveillances = 
                surveillanceService.obtenirSurveillancesPatientPeriode(patientId, debut, fin);
        return ResponseEntity.ok(surveillances);
    }
    
    /**
     * Obtenir les surveillances du jour pour un patient
     * GET /api/surveillances/patient/{patientId}/aujourd-hui
     */
    @GetMapping("/patient/{patientId}/aujourd-hui")
    public ResponseEntity<List<SurveillanceInfirmiere>> obtenirSurveillancesDuJour(
            @PathVariable String patientId) {
        List<SurveillanceInfirmiere> surveillances = 
                surveillanceService.obtenirSurveillancesDuJour(patientId);
        return ResponseEntity.ok(surveillances);
    }
    
    /**
     * Obtenir la dernière surveillance d'un patient
     * GET /api/surveillances/patient/{patientId}/derniere
     */
    @GetMapping("/patient/{patientId}/derniere")
    public ResponseEntity<SurveillanceInfirmiere> obtenirDerniereSurveillance(
            @PathVariable String patientId) {
        SurveillanceInfirmiere surveillance = 
                surveillanceService.obtenirDerniereSurveillance(patientId);
        if (surveillance == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(surveillance);
    }
    
    /**
     * Obtenir les surveillances avec alertes pour un patient
     * GET /api/surveillances/patient/{patientId}/alertes
     */
    @GetMapping("/patient/{patientId}/alertes")
    public ResponseEntity<List<SurveillanceInfirmiere>> obtenirSurveillancesAvecAlertes(
            @PathVariable String patientId) {
        List<SurveillanceInfirmiere> surveillances = 
                surveillanceService.obtenirSurveillancesAvecAlertes(patientId);
        return ResponseEntity.ok(surveillances);
    }
    
    /**
     * Obtenir toutes les surveillances effectuées par un infirmier
     * GET /api/surveillances/infirmier/{infirmierId}
     */
    @GetMapping("/infirmier/{infirmierId}")
    public ResponseEntity<List<SurveillanceInfirmiere>> obtenirSurveillancesInfirmier(
            @PathVariable String infirmierId) {
        List<SurveillanceInfirmiere> surveillances = 
                surveillanceService.obtenirSurveillancesInfirmier(infirmierId);
        return ResponseEntity.ok(surveillances);
    }
    
    /**
     * Obtenir une surveillance par son ID
     * GET /api/surveillances/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<SurveillanceInfirmiere> obtenirSurveillanceParId(
            @PathVariable String id) {
        SurveillanceInfirmiere surveillance = surveillanceService.obtenirSurveillanceParId(id);
        return ResponseEntity.ok(surveillance);
    }
    
    /**
     * Mettre à jour une surveillance
     * PUT /api/surveillances/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<SurveillanceInfirmiere> mettreAJourSurveillance(
            @PathVariable String id,
            @RequestBody SurveillanceInfirmiereDTO dto) {
        SurveillanceInfirmiere surveillance = 
                surveillanceService.mettreAJourSurveillance(id, dto);
        return ResponseEntity.ok(surveillance);
    }
    
    /**
     * Ajouter des observations à une surveillance
     * PATCH /api/surveillances/{id}/observations
     */
    @PatchMapping("/{id}/observations")
    public ResponseEntity<SurveillanceInfirmiere> ajouterObservations(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String observations = request.get("observations");
        SurveillanceInfirmiereDTO dto = new SurveillanceInfirmiereDTO();
        dto.setObservations(observations);
        SurveillanceInfirmiere surveillance = 
                surveillanceService.mettreAJourSurveillance(id, dto);
        return ResponseEntity.ok(surveillance);
    }
    
    /**
     * Supprimer une surveillance
     * DELETE /api/surveillances/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerSurveillance(@PathVariable String id) {
        surveillanceService.supprimerSurveillance(id);
        return ResponseEntity.noContent().build();
    }
    
    // ============ RECHERCHE ============
    
    /**
     * Recherche globale (patient, infirmier, observations)
     * GET /api/surveillances/recherche?q=...
     */
    @GetMapping("/recherche")
    public ResponseEntity<List<SurveillanceInfirmiere>> rechercheGlobale(
            @RequestParam(value = "q", required = false) String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        List<SurveillanceInfirmiere> resultats = surveillanceService.rechercheGlobale(searchTerm);
        return ResponseEntity.ok(resultats);
    }
    
    /**
     * Recherche par nom de patient
     * GET /api/surveillances/recherche/patient?nom=...
     */
    @GetMapping("/recherche/patient")
    public ResponseEntity<List<SurveillanceInfirmiere>> rechercherParPatient(
            @RequestParam(value = "nom") String nom) {
        List<SurveillanceInfirmiere> resultats = surveillanceService.rechercherParPatient(nom);
        return ResponseEntity.ok(resultats);
    }
    
    /**
     * Recherche par nom d'infirmier
     * GET /api/surveillances/recherche/infirmier?nom=...
     */
    @GetMapping("/recherche/infirmier")
    public ResponseEntity<List<SurveillanceInfirmiere>> rechercherParInfirmier(
            @RequestParam(value = "nom") String nom) {
        List<SurveillanceInfirmiere> resultats = surveillanceService.rechercherParInfirmier(nom);
        return ResponseEntity.ok(resultats);
    }
    
    /**
     * Recherche avancée avec plusieurs critères
     * GET /api/surveillances/recherche/avancee?patientId=...&infirmierId=...&dateDebut=...&dateFin=...&avecAlerte=...
     */
    @GetMapping("/recherche/avancee")
    public ResponseEntity<List<SurveillanceInfirmiere>> rechercheAvancee(
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String infirmierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dateFin,
            @RequestParam(required = false) Boolean avecAlerte) {
        List<SurveillanceInfirmiere> resultats = surveillanceService.rechercheAvancee(
                patientId, infirmierId, dateDebut, dateFin, avecAlerte);
        return ResponseEntity.ok(resultats);
    }
    
    // ============ ALERTES ============
    
    /**
     * Obtenir toutes les alertes non validées
     * GET /api/surveillances/alertes/toutes
     */
    @GetMapping("/alertes/toutes")
    public ResponseEntity<List<SurveillanceInfirmiere>> obtenirToutesLesAlertes() {
        List<SurveillanceInfirmiere> alertes = surveillanceService.obtenirToutesLesAlertes();
        return ResponseEntity.ok(alertes);
    }
    
    // ============ STATISTIQUES ============
    
    /**
     * Obtenir les statistiques de surveillance pour un patient
     * GET /api/surveillances/stats/patient/{patientId}
     */
    @GetMapping("/stats/patient/{patientId}")
    public ResponseEntity<Map<String, Object>> obtenirStatistiquesPatient(
            @PathVariable String patientId) {
        Map<String, Object> stats = surveillanceService.obtenirStatistiquesPatient(patientId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Obtenir les statistiques globales de surveillance
     * GET /api/surveillances/stats/globales
     */
    @GetMapping("/stats/globales")
    public ResponseEntity<Map<String, Object>> obtenirStatistiquesGlobales() {
        Map<String, Object> stats = surveillanceService.obtenirStatistiquesGlobales();
        return ResponseEntity.ok(stats);
    }
}
