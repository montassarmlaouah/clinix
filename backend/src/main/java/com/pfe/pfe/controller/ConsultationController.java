package com.pfe.pfe.controller;

import com.pfe.pfe.model.Consultation;
import com.pfe.pfe.service.ConsultationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/consultations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConsultationController {
    
    private final ConsultationService consultationService;
    
    @PostMapping
    public ResponseEntity<Consultation> creerConsultation(@RequestBody Map<String, String> request) {
        String patientId = request.get("patientId");
        String medecinId = request.get("medecinId");
        String motif = request.get("motif");
        try {
            Consultation consultation = consultationService.creerConsultation(patientId, medecinId, motif);
            return new ResponseEntity<>(consultation, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
    
    @PatchMapping("/{id}/diagnostic")
    public ResponseEntity<Consultation> ajouterDiagnostic(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String diagnostic = request.get("diagnostic");
        String observations = request.get("observations");
        
        Consultation consultation = consultationService.ajouterDiagnostic(id, diagnostic, observations);
        return ResponseEntity.ok(consultation);
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Consultation>> obtenirConsultationsParPatient(@PathVariable String patientId) {
        List<Consultation> consultations = consultationService.obtenirConsultationsParPatient(patientId);
        return ResponseEntity.ok(consultations);
    }
    
    @GetMapping("/medecin/{medecinId}")
    public ResponseEntity<List<Consultation>> obtenirConsultationsParMedecin(@PathVariable String medecinId) {
        List<Consultation> consultations = consultationService.obtenirConsultationsParMedecin(medecinId);
        return ResponseEntity.ok(consultations);
    }
}
