package com.pfe.pfe.controller;

import com.pfe.pfe.model.Medicament;
import com.pfe.pfe.service.MedicamentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicaments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MedicamentController {
    
    private final MedicamentService medicamentService;
    
    @PostMapping
    public ResponseEntity<Medicament> creerMedicament(@RequestBody Medicament medicament) {
        Medicament nouveauMedicament = medicamentService.creerMedicament(medicament);
        return new ResponseEntity<>(nouveauMedicament, HttpStatus.CREATED);
    }
    
    @GetMapping
    public ResponseEntity<List<Medicament>> obtenirTousLesMedicaments() {
        List<Medicament> medicaments = medicamentService.obtenirTousLesMedicaments();
        return ResponseEntity.ok(medicaments);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Medicament> obtenirMedicamentParId(@PathVariable String id) {
        Medicament medicament = medicamentService.obtenirMedicamentParId(id);
        return ResponseEntity.ok(medicament);
    }
    
    @GetMapping("/recherche")
    public ResponseEntity<List<Medicament>> rechercherMedicaments(@RequestParam String q) {
        List<Medicament> medicaments = medicamentService.rechercherMedicaments(q);
        return ResponseEntity.ok(medicaments);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Medicament> mettreAJourMedicament(
            @PathVariable String id,
            @RequestBody Medicament medicament) {
        Medicament medicamentMAJ = medicamentService.mettreAJourMedicament(id, medicament);
        return ResponseEntity.ok(medicamentMAJ);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerMedicament(@PathVariable String id) {
        medicamentService.supprimerMedicament(id);
        return ResponseEntity.noContent().build();
    }
}
