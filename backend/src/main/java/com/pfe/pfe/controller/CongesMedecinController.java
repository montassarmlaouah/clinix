package com.pfe.pfe.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.CongesMedecinRequest;
import com.pfe.pfe.model.CongesMedecin;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.service.CongesMedecinService;

import lombok.RequiredArgsConstructor;

/**
 * Gestion des congés médecins.
 * Base : /api/conges-medecin
 */
@RestController
@RequestMapping("/api/conges-medecin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CongesMedecinController {

    private final CongesMedecinService service;

    /**
     * Médecin demande un congé.
     * POST /api/conges-medecin
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN_CLINIQUE','CHEF_PERSONNEL')")
    public ResponseEntity<?> demanderConge(@RequestBody CongesMedecinRequest req) {
        try {
            return ResponseEntity.ok(service.demanderConge(req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /**
     * Lister les congés d'un médecin.
     * GET /api/conges-medecin/medecin/{medecinId}
     */
    @GetMapping("/medecin/{medecinId}")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN_CLINIQUE','CHEF_PERSONNEL','SECRETAIRE')")
    public ResponseEntity<List<CongesMedecin>> listerParMedecin(@PathVariable String medecinId) {
        return ResponseEntity.ok(service.listerParMedecin(medecinId));
    }

    /**
     * Approuver ou refuser un congé.
     * PATCH /api/conges-medecin/{id}/statut
     * Body: { "statut": "APPROUVE" | "REFUSE" }
     */
    @PatchMapping("/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN_CLINIQUE','CHEF_PERSONNEL')")
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

    /**
     * Secrétaire — liste les médecins disponibles à une date.
     * GET /api/conges-medecin/disponibles?cliniqueId=...&date=2026-04-10
     */
    @GetMapping("/disponibles")
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE','MEDECIN','INFIRMIER')")
    public ResponseEntity<List<Medecin>> medecinsdisponibles(
            @RequestParam String cliniqueId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(service.medecinsdDisponibles(cliniqueId, date));
    }

    /**
     * Supprimer un congé.
     * DELETE /api/conges-medecin/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEDECIN','ADMIN_CLINIQUE','CHEF_PERSONNEL')")
    public ResponseEntity<?> supprimer(@PathVariable String id) {
        try {
            service.supprimer(id);
            return ResponseEntity.ok(Map.of("message", "Congé supprimé."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
