package com.pfe.pfe.controller;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.model.Equipement;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.EquipementService;

import lombok.RequiredArgsConstructor;

/**
 * Espace technicien maintenance : lecture des équipements de la clinique du JWT, pannes,
 * renvoi des alertes (notifications + e-mails si SMTP configuré).
 */
@RestController
@RequestMapping("/api/technicien-maintenance")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('TECHNICIEN_MAINTENANCE')")
public class TechnicienMaintenanceWorkspaceController {

    private final EquipementService equipementService;

    @GetMapping("/equipements")
    public ResponseEntity<List<Equipement>> tousEquipementsMaClinique() {
        String cid = cliniqueTechnicien();
        return ResponseEntity.ok(equipementService.listEquipementsPourClinique(cid));
    }

    @GetMapping("/equipements/en-panne")
    public ResponseEntity<List<Equipement>> equipementsEnPanneOuHorsService() {
        String cid = cliniqueTechnicien();
        return ResponseEntity.ok(equipementService.listEquipementsEnPanneOuHorsServicePourClinique(cid));
    }

    @GetMapping("/equipements/{id}")
    public ResponseEntity<Equipement> detailEquipement(@PathVariable String id) {
        String cid = cliniqueTechnicien();
        Equipement e = exec(() -> equipementService.obtenirEquipementParId(id));
        if (e.getCliniqueId() == null || !e.getCliniqueId().equals(cid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cet équipement n'appartient pas à votre clinique.");
        }
        return ResponseEntity.ok(e);
    }

    /**
     * Renvoie notifications in-app + e-mails d'alerte (admins clinique + techniciens de la clinique).
     * Corps JSON optionnel : <code>{"note":"texte libre"}</code>
     */
    @PostMapping("/equipements/{id}/alerte-email")
    public ResponseEntity<Void> renvoyerAlerteEmail(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body) {
        String cid = cliniqueTechnicien();
        String note = body != null ? body.get("note") : null;
        exec(() -> {
            equipementService.renvoyerAlertesPanne(id, cid, note);
            return null;
        });
        return ResponseEntity.noContent().build();
    }

    private static String cliniqueTechnicien() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session invalide.");
        }
        String cid = cud.getCliniqueId();
        if (cid == null || cid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Aucune clinique associée à votre compte technicien.");
        }
        return cid;
    }

    private static <T> T exec(Supplier<T> supplier) {
        try {
            return supplier.get();
        } catch (RuntimeException e) {
            String m = e.getMessage() != null ? e.getMessage() : "Erreur";
            if (m.contains("Accès non autorisé")) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, m);
            }
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, m);
        }
    }
}
