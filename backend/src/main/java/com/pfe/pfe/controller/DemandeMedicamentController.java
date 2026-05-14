package com.pfe.pfe.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.DemandeMedicamentRequest;
import com.pfe.pfe.model.DemandeMedicament;
import com.pfe.pfe.repository.UserRepository;
import com.pfe.pfe.service.DemandeMedicamentService;

import lombok.RequiredArgsConstructor;

/**
 * Demandes de médicaments vers la pharmacie.
 * Base : /api/demandes-medicament
 */
@RestController
@RequestMapping("/api/demandes-medicament")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemandeMedicamentController {

    private final DemandeMedicamentService service;
    private final UserRepository userRepository;

    /**
     * Créer une demande de médicaments.
     * POST /api/demandes-medicament
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MEDECIN','SECRETAIRE','ADMIN_CLINIQUE','INFIRMIER')")
    public ResponseEntity<?> creer(@RequestBody DemandeMedicamentRequest req, Authentication auth) {
        try {
            String demandeurId = userRepository.findByTelephone(auth.getName())
                    .map(u -> u.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Utilisateur non trouvé"));
            return ResponseEntity.ok(service.creer(demandeurId, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Liste des demandes en attente (vue pharmacien).
     * GET /api/demandes-medicament/en-attente?cliniqueId=...
     */
    @GetMapping("/en-attente")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN_CLINIQUE')")
    public ResponseEntity<List<DemandeMedicament>> enAttente(@RequestParam(required = false) String cliniqueId) {
        return ResponseEntity.ok(service.listerEnAttente(cliniqueId));
    }

    /**
     * Liste des demandes.
     * GET /api/demandes-medicament?cliniqueId=...&patientId=...&demandeurId=...
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MEDECIN','SECRETAIRE','ADMIN_CLINIQUE','INFIRMIER','PHARMACIEN')")
    public ResponseEntity<List<DemandeMedicament>> lister(
            @RequestParam(required = false) String cliniqueId,
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) String demandeurId) {
        if (patientId != null) return ResponseEntity.ok(service.listerParPatient(patientId));
        if (demandeurId != null) return ResponseEntity.ok(service.listerParDemandeur(demandeurId));
        if (cliniqueId != null) return ResponseEntity.ok(service.listerParClinique(cliniqueId));
        return ResponseEntity.ok(List.of());
    }

    /**
     * Détail d'une demande.
     * GET /api/demandes-medicament/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEDECIN','SECRETAIRE','ADMIN_CLINIQUE','PHARMACIEN','INFIRMIER')")
    public ResponseEntity<?> obtenir(@PathVariable String id) {
        try {
            return ResponseEntity.ok(service.obtenir(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Pharmacien traite la demande (DELIVREE, REFUSEE, PARTIELLE).
     * PATCH /api/demandes-medicament/{id}/statut
     * Body: { "statut": "DELIVREE" | "REFUSEE" | "PARTIELLE" }
     */
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('PHARMACIEN','ADMIN_CLINIQUE')")
    public ResponseEntity<?> changerStatut(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            String statut = body.get("statut");
            if (statut == null || statut.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "statut obligatoire"));
            }
            return ResponseEntity.ok(service.changerStatut(id, statut));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
