package com.pfe.pfe.controller;

import com.pfe.pfe.model.Garde;
import com.pfe.pfe.model.Garde.TypeGarde;
import com.pfe.pfe.service.GardeService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/gardes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GardeController {
    
    private final GardeService gardeService;
    
    /**
     * Créer un shift de jour (matin ou après-midi)
     * POST /api/gardes/shift-jour
     * Body: {
     *   "utilisateurId": "id",
     *   "date": "2024-01-15",
     *   "matin": true,
     *   "planningId": "planningId" (optionnel)
     * }
     */
    @PostMapping("/shift-jour")
    public ResponseEntity<Garde> creerShiftJour(@RequestBody ShiftJourRequest request) {
        Garde garde = gardeService.creerShiftJour(
            request.getUtilisateurId(), 
            request.getDate(), 
            request.isMatin(), 
            request.getPlanningId(),
            request.getServiceId()
        );
        return new ResponseEntity<>(garde, HttpStatus.CREATED);
    }
    
    /**
     * Créer une garde de nuit (2 jours)
     * POST /api/gardes/garde-nuit
     * Body: {
     *   "utilisateurId": "id",
     *   "dateDebut": "2024-01-15",
     *   "planningId": "planningId" (optionnel)
     * }
     */
    @PostMapping("/garde-nuit")
    public ResponseEntity<Garde> creerGardeNuit(@RequestBody GardeNuitRequest request) {
        Garde garde = gardeService.creerGardeNuit(
            request.getUtilisateurId(), 
            request.getDateDebut(), 
            request.getPlanningId(),
            request.getServiceId()
        );
        return new ResponseEntity<>(garde, HttpStatus.CREATED);
    }
    
    /**
     * Créer un planning hebdomadaire de 6 jours (shifts matin)
     */
    @PostMapping("/hebdomadaire-matin")
    public ResponseEntity<List<Garde>> creerPlanningHebdomadaireMatin(@RequestBody PlanningHebdoRequest request) {
        List<Garde> gardes = gardeService.creerPlanningHebdomadaireMatin(
            request.getUtilisateurId(), 
            request.getDateDebut(), 
            request.getPlanningId(),
            request.getServiceId()
        );
        return new ResponseEntity<>(gardes, HttpStatus.CREATED);
    }
    
    /**
     * Créer un planning hebdomadaire de 6 jours (shifts après-midi)
     */
    @PostMapping("/hebdomadaire-apres-midi")
    public ResponseEntity<List<Garde>> creerPlanningHebdomadaireApresMidi(@RequestBody PlanningHebdoRequest request) {
        List<Garde> gardes = gardeService.creerPlanningHebdomadaireApresMidi(
            request.getUtilisateurId(), 
            request.getDateDebut(), 
            request.getPlanningId(),
            request.getServiceId()
        );
        return new ResponseEntity<>(gardes, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Garde>> obtenirToutesLesGardes() {
        List<Garde> gardes = gardeService.obtenirToutesLesGardes();
        return ResponseEntity.ok(gardes);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Garde> obtenirGardeParId(@PathVariable String id) {
        Garde garde = gardeService.obtenirGardeParId(id);
        return ResponseEntity.ok(garde);
    }
    
    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<Garde>> obtenirGardesParUtilisateur(@PathVariable String utilisateurId) {
        List<Garde> gardes = gardeService.obtenirGardesParUtilisateur(utilisateurId);
        return ResponseEntity.ok(gardes);
    }
    
    @GetMapping("/periode")
    public ResponseEntity<List<Garde>> obtenirGardesParPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fin) {
        List<Garde> gardes = gardeService.obtenirGardesParPeriode(debut, fin);
        return ResponseEntity.ok(gardes);
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Garde>> obtenirGardesParType(@PathVariable TypeGarde type) {
        List<Garde> gardes = gardeService.obtenirGardesParType(type);
        return ResponseEntity.ok(gardes);
    }
    
    @GetMapping("/planning/{planningId}")
    public ResponseEntity<List<Garde>> obtenirGardesParPlanning(@PathVariable String planningId) {
        List<Garde> gardes = gardeService.obtenirGardesParPlanning(planningId);
        return ResponseEntity.ok(gardes);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Garde> modifierGarde(
            @PathVariable String id,
            @RequestBody ModifierGardeRequest request) {
        Garde garde = gardeService.modifierGarde(id, request.getDebut(), request.getFin());
        return ResponseEntity.ok(garde);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerGarde(@PathVariable String id) {
        gardeService.supprimerGarde(id);
        return ResponseEntity.noContent().build();
    }
    
    // Inner classes pour les requêtes
    @lombok.Data
    public static class ShiftJourRequest {
        private String utilisateurId;
        private LocalDate date;
        private boolean matin;
        private String planningId;
        private String serviceId;
    }
    
    @lombok.Data
    public static class GardeNuitRequest {
        private String utilisateurId;
        private LocalDate dateDebut;
        private String planningId;
        private String serviceId;
    }
    
    @lombok.Data
    public static class PlanningHebdoRequest {
        private String utilisateurId;
        private LocalDate dateDebut;
        private String planningId;
        private String serviceId;
    }
    
    @lombok.Data
    public static class ModifierGardeRequest {
        private LocalDateTime debut;
        private LocalDateTime fin;
    }
}
