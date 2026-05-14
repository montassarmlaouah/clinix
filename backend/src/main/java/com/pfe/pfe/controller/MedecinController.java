package com.pfe.pfe.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.CabinetMedecinCreationResponse;
import com.pfe.pfe.dto.CreerCabinetMedecinDTO;
import com.pfe.pfe.dto.PatientDTO;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.service.MedecinService;
import com.pfe.pfe.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/medecins")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MedecinController {

    private final MedecinService medecinService;
    private final PatientService patientService;

    // --- Cabinets médecins (super admin) : chemins statiques avant /{id} ---

    @GetMapping("/cabinets")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Medecin>> listerCabinetsMedecins() {
        return ResponseEntity.ok(medecinService.listerCabinetsMedecins());
    }

    @PostMapping("/cabinets")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<CabinetMedecinCreationResponse> creerCabinetMedecin(@RequestBody CreerCabinetMedecinDTO dto) {
        CabinetMedecinCreationResponse res = medecinService.creerCabinetMedecinSuperAdmin(dto);
        return new ResponseEntity<>(res, HttpStatus.CREATED);
    }

    @PutMapping("/cabinets/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Medecin> mettreAJourCabinetMedecin(
            @PathVariable String id,
            @RequestBody CreerCabinetMedecinDTO dto) {
        return ResponseEntity.ok(medecinService.mettreAJourCabinetMedecin(id, dto));
    }

    @DeleteMapping("/cabinets/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> supprimerCabinetMedecin(@PathVariable String id) {
        medecinService.supprimerCabinetMedecin(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping
    public ResponseEntity<Medecin> creerMedecin(@RequestBody Medecin medecin) {
        Medecin nouveauMedecin = medecinService.creerMedecin(medecin);
        return new ResponseEntity<>(nouveauMedecin, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<Medecin>> obtenirTousLesMedecins() {
        List<Medecin> medecins = medecinService.obtenirTousLesMedecins();
        return ResponseEntity.ok(medecins);
    }

    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<List<Medecin>> obtenirMedecinsParClinique(@PathVariable String cliniqueId) {
        List<Medecin> medecins = medecinService.obtenirMedecinsParClinique(cliniqueId);
        return ResponseEntity.ok(medecins);
    }

    @GetMapping("/specialite/{specialite}")
    public ResponseEntity<List<Medecin>> obtenirMedecinsParSpecialite(@PathVariable String specialite) {
        List<Medecin> medecins = medecinService.obtenirMedecinsParSpecialite(specialite);
        return ResponseEntity.ok(medecins);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Medecin> obtenirMedecinParId(@PathVariable String id) {
        Medecin medecin = medecinService.obtenirMedecinParId(id);
        return ResponseEntity.ok(medecin);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Medecin> mettreAJourMedecin(
            @PathVariable String id,
            @RequestBody Medecin medecin) {
        Medecin medecinMAJ = medecinService.mettreAJourMedecin(id, medecin);
        return ResponseEntity.ok(medecinMAJ);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerMedecin(@PathVariable String id) {
        medecinService.supprimerMedecin(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Médecin cabinet : ajouter un patient à son cabinet.
     * POST /api/medecins/{medecinId}/patients
     */
    @PostMapping("/{medecinId}/patients")
    @PreAuthorize("hasAnyRole('MEDECIN','SUPER_ADMIN')")
    public ResponseEntity<?> ajouterPatientCabinet(
            @PathVariable String medecinId,
            @RequestBody PatientDTO dto) {
        try {
            Patient p = patientService.creerPatientCabinet(medecinId, dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(p);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    /**
     * Médecin cabinet : liste de ses patients.
     * GET /api/medecins/{medecinId}/patients
     */
    @GetMapping("/{medecinId}/patients")
    @PreAuthorize("hasAnyRole('MEDECIN','SUPER_ADMIN','ADMIN_CLINIQUE','SECRETAIRE')")
    public ResponseEntity<List<Patient>> listerPatientsCabinet(@PathVariable String medecinId) {
        return ResponseEntity.ok(patientService.listerPatientsCabinet(medecinId));
    }
}
