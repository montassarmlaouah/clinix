package com.pfe.pfe.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.PatientDTO;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.service.PatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PatientController {
    
    private final PatientService patientService;
    
    @PostMapping
    public ResponseEntity<Patient> creerPatient(@RequestBody PatientDTO patientDTO) {
        Patient patient = patientService.creerPatient(patientDTO);
        return new ResponseEntity<>(patient, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Patient>> obtenirTousLesPatients() {
        List<Patient> patients = patientService.obtenirTousLesPatients();
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<List<Patient>> obtenirPatientsParClinique(@PathVariable String cliniqueId) {
        List<Patient> patients = patientService.obtenirPatientsParClinique(cliniqueId);
        return ResponseEntity.ok(patients);
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Patient>> obtenirPatientsParService(@PathVariable String serviceId) {
        List<Patient> patients = patientService.obtenirPatientsParService(serviceId);
        return ResponseEntity.ok(patients);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Patient> obtenirPatientParId(@PathVariable String id) {
        Patient patient = patientService.obtenirPatientParId(id);
        return ResponseEntity.ok(patient);
    }
    
    @GetMapping("/numero/{numeroPatient}")
    public ResponseEntity<Patient> obtenirPatientParNumero(@PathVariable String numeroPatient) {
        Patient patient = patientService.obtenirPatientParNumero(numeroPatient);
        return ResponseEntity.ok(patient);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Patient> mettreAJourPatient(
            @PathVariable String id,
            @RequestBody PatientDTO patientDTO) {
        Patient patient = patientService.mettreAJourPatient(id, patientDTO);
        return ResponseEntity.ok(patient);
    }

    @PutMapping("/{id}/verifier-secretaire")
    public ResponseEntity<Patient> verifierPatientParSecretaire(@PathVariable String id) {
        Patient patient = patientService.verifierParSecretaire(id);
        return ResponseEntity.ok(patient);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerPatient(@PathVariable String id) {
        patientService.supprimerPatient(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reactiver")
    public ResponseEntity<Patient> reactiverPatient(@PathVariable String id) {
        return ResponseEntity.ok(patientService.reactiverPatient(id));
    }

    @GetMapping("/clinique/{cliniqueId}/inactifs")
    public ResponseEntity<List<Patient>> obtenirPatientsInactifsParClinique(@PathVariable String cliniqueId) {
        return ResponseEntity.ok(patientService.obtenirPatientsInactifsParClinique(cliniqueId));
    }
}
