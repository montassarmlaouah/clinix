package com.pfe.pfe.controller;

import com.pfe.pfe.model.Pharmacien;
import com.pfe.pfe.service.PharmacienService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmaciens")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PharmacienController {
    
    private final PharmacienService pharmacienService;
    
    @PostMapping
    public ResponseEntity<Pharmacien> creerPharmacien(@RequestBody Pharmacien pharmacien) {
        Pharmacien nouveauPharmacien = pharmacienService.creerPharmacien(pharmacien);
        return new ResponseEntity<>(nouveauPharmacien, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Pharmacien>> obtenirTousLesPharmaciens() {
        List<Pharmacien> pharmaciens = pharmacienService.obtenirTousLesPharmaciens();
        return ResponseEntity.ok(pharmaciens);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Pharmacien> obtenirPharmacienParId(@PathVariable String id) {
        Pharmacien pharmacien = pharmacienService.obtenirPharmacienParId(id);
        return ResponseEntity.ok(pharmacien);
    }
    
    @GetMapping("/telephone/{telephone}")
    public ResponseEntity<Pharmacien> obtenirPharmacienParTelephone(@PathVariable String telephone) {
        Pharmacien pharmacien = pharmacienService.obtenirPharmacienParTelephone(telephone);
        return ResponseEntity.ok(pharmacien);
    }
    
    @GetMapping("/numero-ordre/{numeroOrdre}")
    public ResponseEntity<Pharmacien> obtenirPharmacienParNumeroOrdre(@PathVariable String numeroOrdre) {
        Pharmacien pharmacien = pharmacienService.obtenirPharmacienParNumeroOrdre(numeroOrdre);
        return ResponseEntity.ok(pharmacien);
    }
    
    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<List<Pharmacien>> obtenirPharmacienParClinique(@PathVariable String cliniqueId) {
        List<Pharmacien> pharmaciens = pharmacienService.obtenirPharmacienParClinique(cliniqueId);
        return ResponseEntity.ok(pharmaciens);
    }
    
    @GetMapping("/actifs")
    public ResponseEntity<List<Pharmacien>> obtenirPharmacienActifs() {
        List<Pharmacien> pharmaciens = pharmacienService.obtenirPharmacienActifs();
        return ResponseEntity.ok(pharmaciens);
    }
    
    @GetMapping("/inactifs")
    public ResponseEntity<List<Pharmacien>> obtenirPharmacienInactifs() {
        List<Pharmacien> pharmaciens = pharmacienService.obtenirPharmacienInactifs();
        return ResponseEntity.ok(pharmaciens);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Pharmacien> mettreAJourPharmacien(
            @PathVariable String id,
            @RequestBody Pharmacien pharmacien) {
        Pharmacien pharmacienMAJ = pharmacienService.mettreAJourPharmacien(id, pharmacien);
        return ResponseEntity.ok(pharmacienMAJ);
    }
    
    @PatchMapping("/{id}/activer")
    public ResponseEntity<Pharmacien> activerPharmacien(@PathVariable String id) {
        Pharmacien pharmacien = pharmacienService.activerPharmacien(id);
        return ResponseEntity.ok(pharmacien);
    }
    
    @PatchMapping("/{id}/desactiver")
    public ResponseEntity<Pharmacien> desactiverPharmacien(@PathVariable String id) {
        Pharmacien pharmacien = pharmacienService.desactiverPharmacien(id);
        return ResponseEntity.ok(pharmacien);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerPharmacien(@PathVariable String id) {
        pharmacienService.supprimerPharmacien(id);
        return ResponseEntity.noContent().build();
    }
}
