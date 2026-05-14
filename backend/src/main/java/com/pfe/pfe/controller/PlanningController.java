package com.pfe.pfe.controller;

import com.pfe.pfe.model.Planning;
import com.pfe.pfe.model.Planning.TypePlanning;
import com.pfe.pfe.service.PlanningService;
import com.pfe.pfe.service.PlanningPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/plannings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PlanningController {
    
    private final PlanningService planningService;
    private final PlanningPdfService planningPdfService;
    
    /**
     * Créer un planning hebdomadaire
     * POST /api/plannings/hebdomadaire
     * Body: {
     *   "dateDebut": "2024-01-15",
     *   "utilisateurIds": ["id1", "id2"],
     *   "createurId": "chefId"
     * }
     */
    @PostMapping("/hebdomadaire")
    public ResponseEntity<Planning> creerPlanningHebdomadaire(@RequestBody PlanningRequest request) {
        Planning planning = planningService.creerPlanningHebdomadaire(
            request.getDateDebut(), 
            request.getUtilisateurIds(), 
            request.getCreateurId()
        );
        return new ResponseEntity<>(planning, HttpStatus.CREATED);
    }
    
    /**
     * Créer un planning mensuel
     */
    @PostMapping("/mensuel")
    public ResponseEntity<Planning> creerPlanningMensuel(@RequestBody PlanningRequest request) {
        Planning planning = planningService.creerPlanningMensuel(
            request.getDateDebut(), 
            request.getUtilisateurIds(), 
            request.getCreateurId()
        );
        return new ResponseEntity<>(planning, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Planning>> obtenirTousLesPlanning() {
        List<Planning> plannings = planningService.obtenirTousLesPlanning();
        return ResponseEntity.ok(plannings);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Planning> obtenirPlanningParId(@PathVariable String id) {
        Planning planning = planningService.obtenirPlanningParId(id);
        return ResponseEntity.ok(planning);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> telechargerPlanningPdf(
            @PathVariable String id,
            @RequestParam(required = false) String serviceId,
            @RequestParam(required = false) String utilisateurId) {
        byte[] pdf = planningPdfService.generatePlanningPdf(id, serviceId, utilisateurId);
        String filename = utilisateurId != null && !utilisateurId.isBlank()
            ? "planning-" + id + "-" + utilisateurId + ".pdf"
            : "planning-" + id + ".pdf";
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .body(pdf);
    }
    
    @GetMapping("/utilisateur/{utilisateurId}")
    public ResponseEntity<List<Planning>> obtenirPlanningParUtilisateur(@PathVariable String utilisateurId) {
        List<Planning> plannings = planningService.obtenirPlanningParUtilisateur(utilisateurId);
        return ResponseEntity.ok(plannings);
    }
    
    @GetMapping("/periode")
    public ResponseEntity<List<Planning>> obtenirPlanningParPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        List<Planning> plannings = planningService.obtenirPlanningParPeriode(debut, fin);
        return ResponseEntity.ok(plannings);
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Planning>> obtenirPlanningParType(@PathVariable TypePlanning type) {
        List<Planning> plannings = planningService.obtenirPlanningParType(type);
        return ResponseEntity.ok(plannings);
    }
    
    @PatchMapping("/{id}/valider")
    public ResponseEntity<Planning> validerPlanning(@PathVariable String id) {
        Planning planning = planningService.validerPlanning(id);
        return ResponseEntity.ok(planning);
    }
    
    @PatchMapping("/{id}/invalider")
    public ResponseEntity<Planning> invaliderPlanning(@PathVariable String id) {
        Planning planning = planningService.invaliderPlanning(id);
        return ResponseEntity.ok(planning);
    }
    
    @PostMapping("/{id}/utilisateur/{utilisateurId}")
    public ResponseEntity<Planning> ajouterUtilisateur(
            @PathVariable String id, 
            @PathVariable String utilisateurId) {
        Planning planning = planningService.ajouterUtilisateur(id, utilisateurId);
        return ResponseEntity.ok(planning);
    }
    
    @DeleteMapping("/{id}/utilisateur/{utilisateurId}")
    public ResponseEntity<Planning> retirerUtilisateur(
            @PathVariable String id, 
            @PathVariable String utilisateurId) {
        Planning planning = planningService.retirerUtilisateur(id, utilisateurId);
        return ResponseEntity.ok(planning);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerPlanning(@PathVariable String id) {
        planningService.supprimerPlanning(id);
        return ResponseEntity.noContent().build();
    }
    
    // Inner class pour la requête
    @lombok.Data
    public static class PlanningRequest {
        private LocalDate dateDebut;
        private List<String> utilisateurIds;
        private String createurId;
    }
}
