package com.pfe.pfe.controller;

import com.pfe.pfe.model.Service;
import com.pfe.pfe.dto.ServiceDTO;
import com.pfe.pfe.service.ServiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class ServiceController {
    
    private final ServiceService serviceService;
    
    /**
     * Initialiser les 6 services prédéfinis pour une clinique
     * POST /api/services/initialiser/{cliniqueId}
     */
    @PostMapping("/initialiser/{cliniqueId}")
    public ResponseEntity<?> initialiserServices(@PathVariable String cliniqueId) {
        try {
            List<Service> servicesCreés = serviceService.initialiserServicesParDefaut(cliniqueId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("✅ " + servicesCreés.size() + " services créés avec succès");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("❌ Erreur lors de l'initialisation : " + e.getMessage());
        }
    }
    
    /**
     * Obtenir tous les services
     * GET /api/services
     */
    @GetMapping
    public ResponseEntity<List<Service>> obtenirTousLesServices() {
        List<Service> services = serviceService.obtenirTousLesServices();
        return ResponseEntity.ok(services);
    }
    
    /**
     * Obtenir un service par ID
     * GET /api/services/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenirServiceParId(@PathVariable String id) {
        try {
            Service service = serviceService.obtenirServiceParId(id);
            return ResponseEntity.ok(service);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    /**
     * Obtenir les services d'une clinique
     * GET /api/services/clinique/{cliniqueId}
     */
    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<?> obtenirServicesParClinique(@PathVariable String cliniqueId) {
        try {
            List<Service> services = serviceService.obtenirServicesParClinique(cliniqueId);
            return ResponseEntity.ok(services);
        } catch (IllegalArgumentException e) {
            log.error("Erreur lors de la récupération des services pour la clinique {}: {}", cliniqueId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "Not Found",
                            "message", e.getMessage() != null ? e.getMessage() : "Clinique non trouvée",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des services pour la clinique {}: {}", cliniqueId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }
    
    /**
     * Obtenir les services actifs d'une clinique
     * GET /api/services/clinique/{cliniqueId}/actifs
     */
    @GetMapping("/clinique/{cliniqueId}/actifs")
    public ResponseEntity<?> obtenirServicesActifsParClinique(@PathVariable String cliniqueId) {
        try {
            List<Service> services = serviceService.obtenirServicesActifsParClinique(cliniqueId);
            return ResponseEntity.ok(services);
        } catch (IllegalArgumentException e) {
            log.error("Erreur lors de la récupération des services actifs pour la clinique {}: {}", cliniqueId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "Not Found",
                            "message", e.getMessage() != null ? e.getMessage() : "Clinique non trouvée",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des services actifs pour la clinique {}: {}", cliniqueId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }
    
    /**
     * Créer un service
     * POST /api/services
     */
    @PostMapping
    public ResponseEntity<?> creerService(@RequestBody ServiceDTO serviceDTO) {
        try {
            Service nouveauService = serviceService.creerService(serviceDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(nouveauService);
        } catch (IllegalArgumentException e) {
            log.error("Erreur lors de la création du service: {}", e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Bad Request",
                            "message", e.getMessage() != null ? e.getMessage() : "Erreur lors de la création du service",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la création du service: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", e.getMessage() != null ? e.getMessage() : "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }

    /**
     * Mettre à jour un service
     * PUT /api/services/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> mettreAJourService(@PathVariable String id, @RequestBody ServiceDTO serviceDTO) {
        try {
            Service serviceMisAJour = serviceService.mettreAJourService(id, serviceDTO);
            return ResponseEntity.ok(serviceMisAJour);
        } catch (IllegalArgumentException e) {
            log.error("Erreur lors de la mise à jour du service {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Bad Request",
                            "message", e.getMessage() != null ? e.getMessage() : "Erreur lors de la mise à jour du service",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la mise à jour du service {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", e.getMessage() != null ? e.getMessage() : "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }

    /**
     * Supprimer définitivement un service et ses chambres
     * DELETE /api/services/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerService(@PathVariable String id) {
        try {
            serviceService.supprimerService(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.error("Erreur lors de la suppression du service {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "Not Found",
                            "message", e.getMessage() != null ? e.getMessage() : "Service non trouvé",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la suppression du service {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", e.getMessage() != null ? e.getMessage() : "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }

    /**
     * Obtenir le nombre de lits disponibles
     * GET /api/services/{id}/lits-disponibles
     */
    @GetMapping("/{id}/lits-disponibles")
    public ResponseEntity<?> obtenirLitsDisponibles(@PathVariable String id) {
        try {
            Integer litsDisponibles = serviceService.obtenirLitsDisponibles(id);
            return ResponseEntity.ok(litsDisponibles);
        } catch (IllegalArgumentException e) {
            log.error("Erreur lors de la récupération des lits disponibles pour le service {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", "Not Found",
                            "message", e.getMessage() != null ? e.getMessage() : "Service non trouvé",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des lits disponibles pour le service {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "error", "Internal Server Error",
                            "message", "Une erreur interne s'est produite",
                            "timestamp", java.time.LocalDateTime.now()
                    ));
        }
    }
}
