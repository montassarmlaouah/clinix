package com.pfe.pfe.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.TraitementPanneDTO;
import com.pfe.pfe.model.Equipement;
import com.pfe.pfe.service.EquipementService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/equipements")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:3000"})
public class EquipementController {

    private final EquipementService equipementService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public ResponseEntity<Equipement> creerEquipement(@RequestBody Equipement equipement) {
        try {
            Equipement nouvelEquipement = equipementService.creerEquipement(equipement);
            return ResponseEntity.status(HttpStatus.CREATED).body(nouvelEquipement);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping
    public ResponseEntity<List<Equipement>> obtenirTousLesEquipements() {
        return ResponseEntity.ok(equipementService.obtenirTousLesEquipements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipement> obtenirEquipementParId(@PathVariable String id) {
        try {
            return ResponseEntity.ok(equipementService.obtenirEquipementParId(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<Equipement> obtenirEquipementParCode(@PathVariable String code) {
        return equipementService.obtenirEquipementParCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public ResponseEntity<Equipement> mettreAJourEquipement(
            @PathVariable String id,
            @RequestBody Equipement equipement) {
        try {
            return ResponseEntity.ok(equipementService.mettreAJourEquipement(id, equipement));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public ResponseEntity<Void> supprimerEquipement(@PathVariable String id) {
        try {
            equipementService.supprimerEquipement(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/rechercher")
    public ResponseEntity<List<Equipement>> rechercherEquipements(
            @RequestParam(required = false) String terme) {
        return ResponseEntity.ok(equipementService.rechercherEquipements(terme));
    }

    @GetMapping("/disponibles")
    public ResponseEntity<List<Equipement>> obtenirEquipementsDisponibles() {
        return ResponseEntity.ok(equipementService.obtenirEquipementsDisponibles());
    }

    @GetMapping("/categorie/{categorie}")
    public ResponseEntity<List<Equipement>> obtenirEquipementsParCategorie(
            @PathVariable Equipement.CategorieEquipement categorie) {
        return ResponseEntity.ok(equipementService.obtenirEquipementsParCategorie(categorie));
    }

    @GetMapping("/etat-technique/{etatTechnique}")
    public ResponseEntity<List<Equipement>> obtenirEquipementsParEtatTechnique(
            @PathVariable Equipement.EtatTechnique etatTechnique) {
        return ResponseEntity.ok(equipementService.obtenirEquipementsParEtatTechnique(etatTechnique));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Equipement>> obtenirEquipementsParStatut(
            @PathVariable Equipement.StatutEquipement statut) {
        return ResponseEntity.ok(equipementService.obtenirEquipementsParStatut(statut));
    }

    @PatchMapping("/{id}/etat-technique/{etatTechnique}")
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public ResponseEntity<Equipement> changerEtatTechnique(
            @PathVariable String id,
            @PathVariable Equipement.EtatTechnique etatTechnique) {
        try {
            return ResponseEntity.ok(equipementService.changerEtatTechnique(id, etatTechnique));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PatchMapping("/{id}/statut/{statut}")
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public ResponseEntity<Equipement> changerStatut(
            @PathVariable String id,
            @PathVariable Equipement.StatutEquipement statut) {
        try {
            return ResponseEntity.ok(equipementService.changerStatut(id, statut));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/{id}/traiter-panne")
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public ResponseEntity<Equipement> traiterPanne(
            @PathVariable String id,
            @RequestBody TraitementPanneDTO request) {
        try {
            return ResponseEntity.ok(
                    equipementService.traiterPanne(
                            id,
                            request.getRepairType(),
                            request.getRepairNotes(),
                            request.getRepairHours(),
                            request.getRepairMinutes()
                    )
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<List<Equipement>> obtenirEquipementsParClinique(
            @PathVariable String cliniqueId) {
        return ResponseEntity.ok(equipementService.obtenirEquipementsParClinique(cliniqueId));
    }

    @GetMapping("/chambre/{chambreId}")
    public ResponseEntity<List<Equipement>> obtenirEquipementsPourChambre(
            @PathVariable String chambreId) {
        return ResponseEntity.ok(equipementService.obtenirEquipementsPourChambre(chambreId));
    }
}