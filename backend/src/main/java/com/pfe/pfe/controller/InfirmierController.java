package com.pfe.pfe.controller;

import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.service.InfirmierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infirmiers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InfirmierController {
    
    private final InfirmierService infirmierService;
    
    @PostMapping
    public ResponseEntity<Infirmier> creerInfirmier(@RequestBody Infirmier infirmier) {
        Infirmier nouvelInfirmier = infirmierService.creerInfirmier(infirmier);
        return new ResponseEntity<>(nouvelInfirmier, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Infirmier>> obtenirTousLesInfirmiers() {
        List<Infirmier> infirmiers = infirmierService.obtenirTousLesInfirmiers();
        return ResponseEntity.ok(infirmiers);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Infirmier> obtenirInfirmierParId(@PathVariable String id) {
        Infirmier infirmier = infirmierService.obtenirInfirmierParId(id);
        return ResponseEntity.ok(infirmier);
    }
    
    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<List<Infirmier>> obtenirInfirmiersParClinique(@PathVariable String cliniqueId) {
        List<Infirmier> infirmiers = infirmierService.obtenirInfirmiersParClinique(cliniqueId);
        return ResponseEntity.ok(infirmiers);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Infirmier> mettreAJourInfirmier(
            @PathVariable String id,
            @RequestBody Infirmier infirmier) {
        Infirmier infirmierMAJ = infirmierService.mettreAJourInfirmier(id, infirmier);
        return ResponseEntity.ok(infirmierMAJ);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerInfirmier(@PathVariable String id) {
        infirmierService.supprimerInfirmier(id);
        return ResponseEntity.noContent().build();
    }
}
