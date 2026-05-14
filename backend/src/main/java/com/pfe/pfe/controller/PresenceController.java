package com.pfe.pfe.controller;

import com.pfe.pfe.model.Presence;
import com.pfe.pfe.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/presences")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PresenceController {
    
    private final PresenceService presenceService;
    
    /**
     * Marquer la présence d'un infirmier
     * POST /api/presences/marquer-presence
     */
    @PostMapping("/marquer-presence")
    public ResponseEntity<Presence> marquerPresence(
            @RequestParam String infirmierId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime heureArrivee,
            @RequestParam String chefPersonnelId,
            @RequestParam(required = false) String observation) {
        
        Presence presence = presenceService.marquerPresence(infirmierId, date, heureArrivee, chefPersonnelId, observation);
        return new ResponseEntity<>(presence, HttpStatus.CREATED);
    }
    
    /**
     * Marquer l'absence d'un infirmier
     * POST /api/presences/marquer-absence
     */
    @PostMapping("/marquer-absence")
    public ResponseEntity<Presence> marquerAbsence(
            @RequestParam String infirmierId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam String motif,
            @RequestParam String chefPersonnelId) {
        
        Presence presence = presenceService.marquerAbsence(infirmierId, date, motif, chefPersonnelId);
        return new ResponseEntity<>(presence, HttpStatus.CREATED);
    }
    
    /**
     * Marquer la présence de plusieurs infirmiers
     * POST /api/presences/marquer-multiples
     */
    @PostMapping("/marquer-multiples")
    public ResponseEntity<List<Presence>> marquerPresencesMultiples(
            @RequestBody Map<String, Object> request) {
        
        @SuppressWarnings("unchecked")
        List<String> infirmierIds = (List<String>) request.get("infirmierIds");
        LocalDate date = LocalDate.parse((String) request.get("date"));
        String chefPersonnelId = (String) request.get("chefPersonnelId");
        
        List<Presence> presences = presenceService.marquerPresencesMultiples(infirmierIds, date, chefPersonnelId);
        return new ResponseEntity<>(presences, HttpStatus.CREATED);
    }
    
    /**
     * Enregistrer l'heure de départ
     * PATCH /api/presences/{id}/depart
     */
    @PatchMapping("/{id}/depart")
    public ResponseEntity<Presence> enregistrerDepart(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime heureDepart) {
        
        Presence presence = presenceService.enregistrerDepart(id, heureDepart);
        return ResponseEntity.ok(presence);
    }
    
    /**
     * Obtenir toutes les présences
     */
    @GetMapping
    public ResponseEntity<List<Presence>> obtenirToutesLesPresences() {
        List<Presence> presences = presenceService.obtenirToutesLesPresences();
        return ResponseEntity.ok(presences);
    }
    
    /**
     * Obtenir les présences du jour
     * GET /api/presences/aujourdhui?date=2024-01-15
     */
    @GetMapping("/aujourdhui")
    public ResponseEntity<List<Presence>> obtenirPresencesDuJour(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Presence> presences = presenceService.obtenirPresencesDuJour(date);
        return ResponseEntity.ok(presences);
    }
    
    /**
     * Obtenir les absences du jour
     */
    @GetMapping("/absences-jour")
    public ResponseEntity<List<Presence>> obtenirAbsencesDuJour(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Presence> absences = presenceService.obtenirAbsencesDuJour(date);
        return ResponseEntity.ok(absences);
    }
    
    /**
     * Obtenir les retards du jour
     */
    @GetMapping("/retards-jour")
    public ResponseEntity<List<Presence>> obtenirRetardsDuJour(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Presence> retards = presenceService.obtenirRetardsDuJour(date);
        return ResponseEntity.ok(retards);
    }
    
    /**
     * Obtenir l'historique de présence d'un infirmier
     */
    @GetMapping("/infirmier/{infirmierId}")
    public ResponseEntity<List<Presence>> obtenirHistoriqueInfirmier(@PathVariable String infirmierId) {
        List<Presence> presences = presenceService.obtenirHistoriqueInfirmier(infirmierId);
        return ResponseEntity.ok(presences);
    }
    
    /**
     * Obtenir les présences par période
     */
    @GetMapping("/periode")
    public ResponseEntity<List<Presence>> obtenirPresencesParPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        List<Presence> presences = presenceService.obtenirPresencesParPeriode(debut, fin);
        return ResponseEntity.ok(presences);
    }
    
    /**
     * Obtenir les statistiques de présence d'un infirmier
     */
    @GetMapping("/statistiques/{infirmierId}")
    public ResponseEntity<Map<String, Object>> obtenirStatistiquesInfirmier(
            @PathVariable String infirmierId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        
        Map<String, Object> stats = presenceService.obtenirStatistiquesInfirmier(infirmierId, debut, fin);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Modifier une présence
     */
    @PutMapping("/{id}")
    public ResponseEntity<Presence> modifierPresence(
            @PathVariable String id,
            @RequestBody Map<String, Object> updates) {
        
        Boolean present = updates.containsKey("present") ? (Boolean) updates.get("present") : null;
        LocalTime heureArrivee = updates.containsKey("heureArrivee") ? 
            LocalTime.parse((String) updates.get("heureArrivee")) : null;
        LocalTime heureDepart = updates.containsKey("heureDepart") ? 
            LocalTime.parse((String) updates.get("heureDepart")) : null;
        String observation = (String) updates.get("observation");
        
        Presence presence = presenceService.modifierPresence(id, present, heureArrivee, heureDepart, observation);
        return ResponseEntity.ok(presence);
    }
    
    /**
     * Supprimer une présence
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerPresence(@PathVariable String id) {
        presenceService.supprimerPresence(id);
        return ResponseEntity.noContent().build();
    }
}
