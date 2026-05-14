package com.pfe.pfe.controller;

import com.pfe.pfe.model.Urgence;
import com.pfe.pfe.service.UrgenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/urgences")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UrgenceController {

    private final UrgenceService urgenceService;

    @PostMapping
    public ResponseEntity<Urgence> signalerUrgence(@RequestBody Map<String, String> request) {
        String patientId = request.get("patientId");
        String signaleParId = request.get("signaleParId");
        String motif = request.get("motif");
        String description = request.get("description");
        String niveauStr = request.get("niveau");

        Urgence.NiveauUrgence niveau = null;
        if (niveauStr != null && !niveauStr.isBlank()) {
            niveau = Urgence.NiveauUrgence.valueOf(niveauStr);
        }

        Urgence urgence = urgenceService.signalerUrgence(
                patientId, signaleParId, motif, description, niveau);
        return new ResponseEntity<>(urgence, HttpStatus.CREATED);
    }

    @GetMapping("/actives")
    public ResponseEntity<List<Urgence>> obtenirUrgencesActives() {
        return ResponseEntity.ok(urgenceService.obtenirUrgencesActives());
    }

    @GetMapping("/en-attente")
    public ResponseEntity<List<Urgence>> obtenirUrgencesEnAttente() {
        return ResponseEntity.ok(urgenceService.obtenirUrgencesEnAttente());
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Urgence>> obtenirParPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(urgenceService.obtenirUrgencesParPatient(patientId));
    }

    @GetMapping("/medecin/{medecinId}")
    public ResponseEntity<List<Urgence>> obtenirParMedecin(@PathVariable String medecinId) {
        return ResponseEntity.ok(urgenceService.obtenirUrgencesParMedecin(medecinId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Urgence> obtenirParId(@PathVariable String id) {
        return ResponseEntity.ok(urgenceService.obtenirParId(id));
    }

    @PatchMapping("/{id}/prendre-en-charge")
    public ResponseEntity<Urgence> prendreEnCharge(
            @PathVariable String id,
            @RequestParam String medecinId) {
        return ResponseEntity.ok(urgenceService.prendreEnCharge(id, medecinId));
    }

    @PatchMapping("/{id}/traiter")
    public ResponseEntity<Urgence> mettreEnTraitement(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request) {
        String notes = request != null ? request.get("notes") : null;
        return ResponseEntity.ok(urgenceService.mettreEnTraitement(id, notes));
    }

    @PatchMapping("/{id}/resoudre")
    public ResponseEntity<Urgence> resoudreUrgence(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request) {
        String notes = request != null ? request.get("notes") : null;
        return ResponseEntity.ok(urgenceService.resoudreUrgence(id, notes));
    }
}
