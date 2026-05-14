package com.pfe.pfe.controller;

import com.pfe.pfe.model.Chambre;
import com.pfe.pfe.dto.ChambreDTO;
import com.pfe.pfe.service.ChambreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chambres")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class ChambreController {
    
    private final ChambreService chambreService;
    
    @PostMapping
    public ResponseEntity<?> creerChambre(@RequestBody ChambreDTO chambre) {
        try {
            Chambre nouvelleChambre = chambreService.creerChambre(chambre);
            return new ResponseEntity<>(nouvelleChambre, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de la chambre: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Bad Request",
                            "message", e.getMessage() != null ? e.getMessage() : "Erreur lors de la création de la chambre",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la création de la chambre: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", e.getMessage() != null ? e.getMessage() : "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }
    
    @PostMapping("/multiple")
    public ResponseEntity<?> creerPlusieursChambres(@RequestBody com.pfe.pfe.dto.CreationChambresDTO dto) {
        try {
            List<Chambre> chambresCreees = chambreService.creerPlusieursChambres(dto);
            return new ResponseEntity<>(Map.of(
                    "message", chambresCreees.size() + " chambre(s) créée(s) avec succès",
                    "chambres", chambresCreees,
                    "nombreCree", chambresCreees.size()
            ), HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la création de plusieurs chambres: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Bad Request",
                            "message", e.getMessage() != null ? e.getMessage() : "Erreur lors de la création des chambres",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la création de plusieurs chambres: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", e.getMessage() != null ? e.getMessage() : "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }
    
    @GetMapping
    public ResponseEntity<List<Chambre>> obtenirToutesLesChambres() {
        List<Chambre> chambres = chambreService.obtenirToutesLesChambres();
        return ResponseEntity.ok(chambres);
    }

    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<List<Chambre>> obtenirChambresParClinique(@PathVariable String cliniqueId) {
        List<Chambre> chambres = chambreService.obtenirChambresParClinique(cliniqueId);
        return ResponseEntity.ok(chambres);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenirChambreParId(@PathVariable String id) {
        try {
            Chambre chambre = chambreService.obtenirChambreParId(id);
            return ResponseEntity.ok(chambre);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/disponibles")
    public ResponseEntity<List<Chambre>> obtenirChambresDisponibles() {
        List<Chambre> chambres = chambreService.obtenirChambresDisponibles();
        return ResponseEntity.ok(chambres);
    }
    
    @GetMapping("/type/{typeChambre}")
    public ResponseEntity<List<Chambre>> obtenirChambresParType(@PathVariable String typeChambre) {
        List<Chambre> chambres = chambreService.obtenirChambresParType(typeChambre);
        return ResponseEntity.ok(chambres);
    }

    @GetMapping("/existe/{numero}")
    public ResponseEntity<Boolean> verifierNumeroExiste(@PathVariable String numero) {
        return ResponseEntity.ok(chambreService.numeroExiste(numero));
    }

    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> obtenirStatistiques() {
        return ResponseEntity.ok(chambreService.obtenirStatistiques());
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> mettreAJourChambre(
            @PathVariable String id,
            @RequestBody ChambreDTO chambre) {
        try {
            Chambre chambreMAJ = chambreService.mettreAJourChambre(id, chambre);
            return ResponseEntity.ok(chambreMAJ);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la mise à jour de la chambre {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Bad Request",
                            "message", e.getMessage() != null ? e.getMessage() : "Erreur lors de la mise à jour de la chambre",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour de la chambre {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", e.getMessage() != null ? e.getMessage() : "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerChambre(@PathVariable String id) {
        try {
            chambreService.supprimerChambre(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Erreur lors de la suppression de la chambre {}: {}", id, e.getMessage(), e);
            // Si jamais une "Chambre non trouvée" remonte encore, renvoyer 404 au lieu de 400
            if (e.getMessage() != null && e.getMessage().toLowerCase().contains("chambre non trouv")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Bad Request",
                            "message", e.getMessage() != null ? e.getMessage() : "Erreur lors de la suppression de la chambre",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la suppression de la chambre {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", e.getMessage() != null ? e.getMessage() : "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }
    
    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Chambre>> obtenirChambresParService(@PathVariable String serviceId) {
        List<Chambre> chambres = chambreService.obtenirChambresParService(serviceId);
        return ResponseEntity.ok(chambres);
    }
    
    @PatchMapping("/{id}/equipements")
    public ResponseEntity<Chambre> ajouterEquipements(@PathVariable String id, @RequestBody List<String> equipements) {
        try {
            Chambre chambreMaj = chambreService.ajouterEquipements(id, equipements);
            return ResponseEntity.ok(chambreMaj);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/{id}/equipements/{equipement}")
    public ResponseEntity<Chambre> supprimerEquipement(@PathVariable String id, @PathVariable String equipement) {
        try {
            Chambre chambreMaj = chambreService.supprimerEquipement(id, equipement);
            return ResponseEntity.ok(chambreMaj);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
