package com.pfe.pfe.controller;

import java.util.List;
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
import org.springframework.util.StringUtils;

import com.pfe.pfe.dto.TraitementPanneDTO;
import com.pfe.pfe.model.Equipement;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.EquipementService;

import lombok.RequiredArgsConstructor;

/**
 * Espace technicien maintenance : lecture des équipements de la clinique du JWT et traitement des pannes.
 * Le renvoi des e-mails d'alerte est réservé à l'admin clinique ({@code POST /api/equipements/{id}/alerte-email}).
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
     * Clôture une panne (ou hors service) : rapport + remise en fonctionnel, e-mail aux admins clinique.
     */
    @PostMapping("/equipements/{id}/traiter-panne")
    public ResponseEntity<Equipement> traiterPanne(
            @PathVariable String id,
            @RequestBody TraitementPanneDTO body) {
        String cid = cliniqueTechnicien();
        Equipement e = exec(() -> equipementService.obtenirEquipementParId(id));
        String ecid = e.getCliniqueId() != null ? e.getCliniqueId().trim() : "";
        if (!StringUtils.hasText(ecid) || !ecid.equals(cid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cet équipement n'appartient pas à votre clinique.");
        }
        Equipement.EtatTechnique et = e.getEtatTechnique();
        if (et != Equipement.EtatTechnique.EN_PANNE && et != Equipement.EtatTechnique.HORS_SERVICE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Seuls les équipements en panne ou hors service peuvent être traités par ce flux.");
        }
        Equipement maj = exec(() -> equipementService.traiterPanne(
                id,
                body.getRepairType(),
                body.getRepairNotes(),
                body.getRepairHours(),
                body.getRepairMinutes()));
        return ResponseEntity.ok(maj);
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
