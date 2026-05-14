package com.pfe.pfe.controller;

import com.pfe.pfe.model.DossierMedical;
import com.pfe.pfe.service.DossierMedicalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dossiers-medicaux")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DossierMedicalController {
    
    private final DossierMedicalService dossierMedicalService;
    
    @GetMapping("/{id}")
    public ResponseEntity<DossierMedical> obtenirDossierParId(@PathVariable String id) {
        DossierMedical dossier = dossierMedicalService.obtenirDossierParId(id);
        return ResponseEntity.ok(dossier);
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<DossierMedical> obtenirDossierParPatient(@PathVariable String patientId) {
        DossierMedical dossier = dossierMedicalService.obtenirDossierParPatient(patientId);
        return ResponseEntity.ok(dossier);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<DossierMedical> mettreAJourDossier(
            @PathVariable String id,
            @RequestBody DossierMedical dossier) {
        DossierMedical dossierMAJ = dossierMedicalService.mettreAJourDossier(id, dossier);
        return ResponseEntity.ok(dossierMAJ);
    }

    @PatchMapping("/{id}/notes-confidentielles")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN_CLINIQUE')")
    public ResponseEntity<DossierMedical> mettreNotesConfidentielles(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String notes = body != null ? body.get("notesConfidentielles") : null;
        return ResponseEntity.ok(dossierMedicalService.mettreNotesConfidentielles(id, notes));
    }
}
