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

import com.pfe.pfe.dto.DemandeOperationRequest;
import com.pfe.pfe.model.DemandeOperation;
import com.pfe.pfe.repository.UserRepository;
import com.pfe.pfe.service.DemandeOperationService;

import lombok.RequiredArgsConstructor;

/**
 * Demandes d'opération chirurgicale.
 * Base : /api/demandes-operation
 */
@RestController
@RequestMapping("/api/demandes-operation")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DemandeOperationController {

    private final DemandeOperationService service;
    private final UserRepository userRepository;

    /**
     * Créer une demande (médecin ou secrétaire).
     * POST /api/demandes-operation
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MEDECIN','SECRETAIRE','ADMIN_CLINIQUE')")
    public ResponseEntity<?> creer(@RequestBody DemandeOperationRequest req, Authentication auth) {
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
     * Liste des demandes par clinique.
     * GET /api/demandes-operation?cliniqueId=...
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('MEDECIN','SECRETAIRE','ADMIN_CLINIQUE','INFIRMIER')")
    public ResponseEntity<List<DemandeOperation>> lister(@RequestParam(required = false) String cliniqueId,
                                                          @RequestParam(required = false) String patientId,
                                                          @RequestParam(required = false) String demandeurId) {
        if (patientId != null) return ResponseEntity.ok(service.listerParPatient(patientId));
        if (demandeurId != null) return ResponseEntity.ok(service.listerParDemandeur(demandeurId));
        if (cliniqueId != null) return ResponseEntity.ok(service.listerParClinique(cliniqueId));
        return ResponseEntity.ok(List.of());
    }

    /**
     * Détail d'une demande.
     * GET /api/demandes-operation/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEDECIN','SECRETAIRE','ADMIN_CLINIQUE','INFIRMIER')")
    public ResponseEntity<?> obtenir(@PathVariable String id) {
        try {
            return ResponseEntity.ok(service.obtenir(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Changer le statut d'une demande (approuver, planifier, effectuer, refuser).
     * PATCH /api/demandes-operation/{id}/statut
     * Body: { "statut": "APPROUVEE" | "PLANIFIEE" | "EFFECTUEE" | "REFUSEE" }
     */
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN_CLINIQUE','MEDECIN')")
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
