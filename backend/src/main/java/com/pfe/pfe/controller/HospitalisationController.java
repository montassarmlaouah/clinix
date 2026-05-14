package com.pfe.pfe.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.NoteHospitalisationRequest;
import com.pfe.pfe.model.Hospitalisation;
import com.pfe.pfe.model.NoteHospitalisation;
import com.pfe.pfe.service.HospitalisationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/hospitalisations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HospitalisationController {
    
    private final HospitalisationService hospitalisationService;
    
    @PostMapping
    public ResponseEntity<Hospitalisation> creerHospitalisation(@RequestBody Hospitalisation hospitalisation) {
        Hospitalisation nouvelleHospitalisation = hospitalisationService.creerHospitalisation(hospitalisation);
        return new ResponseEntity<>(nouvelleHospitalisation, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Hospitalisation>> obtenirToutesLesHospitalisations() {
        List<Hospitalisation> hospitalisations = hospitalisationService.obtenirToutesLesHospitalisations();
        return ResponseEntity.ok(hospitalisations);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Hospitalisation> obtenirHospitalisationParId(@PathVariable String id) {
        Hospitalisation hospitalisation = hospitalisationService.obtenirHospitalisationParId(id);
        return ResponseEntity.ok(hospitalisation);
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<Hospitalisation>> obtenirHospitalisationsParPatient(@PathVariable String patientId) {
        List<Hospitalisation> hospitalisations = hospitalisationService.obtenirHospitalisationsParPatient(patientId);
        return ResponseEntity.ok(hospitalisations);
    }
    
    @GetMapping("/en-cours")
    public ResponseEntity<List<Hospitalisation>> obtenirHospitalisationsEnCours() {
        List<Hospitalisation> hospitalisations = hospitalisationService.obtenirHospitalisationsEnCours();
        return ResponseEntity.ok(hospitalisations);
    }
    
    @PatchMapping("/{id}/terminer")
    public ResponseEntity<Hospitalisation> terminerHospitalisation(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateSortie) {
        Hospitalisation hospitalisation = hospitalisationService.terminerHospitalisation(id, dateSortie);
        return ResponseEntity.ok(hospitalisation);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Hospitalisation> mettreAJourHospitalisation(
            @PathVariable String id,
            @RequestBody Hospitalisation hospitalisation) {
        Hospitalisation hospitalisationMAJ = hospitalisationService.mettreAJourHospitalisation(id, hospitalisation);
        return ResponseEntity.ok(hospitalisationMAJ);
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<List<NoteHospitalisation>> obtenirNotes(@PathVariable String id) {
        List<NoteHospitalisation> notes = hospitalisationService.obtenirNotes(id);
        return ResponseEntity.ok(notes);
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<NoteHospitalisation> ajouterNote(
            @PathVariable String id,
            @RequestBody NoteHospitalisationRequest request) {
        NoteHospitalisation note = hospitalisationService.ajouterNote(id, request);
        return new ResponseEntity<>(note, HttpStatus.CREATED);
    }
}
