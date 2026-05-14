package com.pfe.pfe.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.model.Absence;
import com.pfe.pfe.service.AbsenceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/absences")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AbsenceController {
    
    private final AbsenceService absenceService;
    
    /**
     * Créer une demande d'absence (congé)
     */
    @PostMapping
    public ResponseEntity<Absence> creerDemande(@RequestBody Absence absence) {
        Absence nouvelleDemande = absenceService.creerDemande(absence);
        return new ResponseEntity<>(nouvelleDemande, HttpStatus.CREATED);
    }

    /**
     * Créer une demande d'absence (utilisé par le front infirmier)
     * POST /api/absences/demande
     * Body: { utilisateurId, dateDebut, dateFin, motif }
     */
    @PostMapping("/demande")
    public ResponseEntity<Absence> creerDemandeParUtilisateur(@RequestBody CreateAbsenceRequest request) {
        Absence nouvelleDemande = absenceService.creerDemandePourUtilisateur(
                request.getUtilisateurId(),
                request.getDateDebut(),
                request.getDateFin(),
                request.getMotif()
        );
        return new ResponseEntity<>(nouvelleDemande, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Absence>> obtenirToutesLesAbsences() {
        List<Absence> absences = absenceService.obtenirToutesLesAbsences();
        return ResponseEntity.ok(absences);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Absence> obtenirAbsenceParId(@PathVariable String id) {
        Absence absence = absenceService.obtenirAbsenceParId(id);
        return ResponseEntity.ok(absence);
    }
    
    @GetMapping("/infirmier/{infirmierId}")
    public ResponseEntity<List<Absence>> obtenirAbsencesParInfirmier(@PathVariable String infirmierId) {
        List<Absence> absences = absenceService.obtenirAbsencesParInfirmier(infirmierId);
        return ResponseEntity.ok(absences);
    }
    
    @GetMapping("/en-attente")
    public ResponseEntity<List<Absence>> obtenirDemandesEnAttente() {
        List<Absence> absences = absenceService.obtenirDemandesEnAttente();
        return ResponseEntity.ok(absences);
    }
    
    @GetMapping("/periode")
    public ResponseEntity<List<Absence>> obtenirAbsencesParPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        List<Absence> absences = absenceService.obtenirAbsencesParPeriode(debut, fin);
        return ResponseEntity.ok(absences);
    }
    
    /**
     * Approuver une demande d'absence (Chef de personnel)
     */
    @PatchMapping("/{id}/approuver")
    public ResponseEntity<Absence> approuverDemande(@PathVariable String id) {
        Absence absence = absenceService.approuverDemande(id);
        return ResponseEntity.ok(absence);
    }
    
    /**
     * Refuser une demande d'absence (Chef de personnel)
     */
    @PatchMapping("/{id}/refuser")
    public ResponseEntity<Absence> refuserDemande(
            @PathVariable String id,
            @RequestParam String motifRefus) {
        Absence absence = absenceService.refuserDemande(id, motifRefus);
        return ResponseEntity.ok(absence);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerAbsence(@PathVariable String id) {
        absenceService.supprimerAbsence(id);
        return ResponseEntity.noContent().build();
    }

    @lombok.Data
    public static class CreateAbsenceRequest {
        private String utilisateurId;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate dateDebut;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        private LocalDate dateFin;
        private String motif;
    }
}
