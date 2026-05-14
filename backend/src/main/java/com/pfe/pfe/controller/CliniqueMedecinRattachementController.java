package com.pfe.pfe.controller;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.dto.CliniqueMedecinRechercheRequest;
import com.pfe.pfe.dto.CliniqueMedecinRattachementRequest;
import com.pfe.pfe.model.Medecin;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.MedecinService;

import lombok.RequiredArgsConstructor;

/**
 * Rattachement d'un médecin existant (compte centralisé) à une clinique.
 */
@RestController
@RequestMapping("/api/cliniques/{cliniqueId}/medecins")
@RequiredArgsConstructor
public class CliniqueMedecinRattachementController {

    private final MedecinService medecinService;

    @PostMapping("/rechercher")
    public ResponseEntity<Medecin> rechercher(
            @PathVariable String cliniqueId,
            @RequestBody CliniqueMedecinRechercheRequest body,
            @AuthenticationPrincipal CustomUserDetails user) {
        verifierAccesClinique(cliniqueId, user);
        Optional<Medecin> found = medecinService.rechercherMedecinPourRattachement(
                body != null ? body.getTelephone() : null,
                body != null ? body.getNumeroPieceIdentite() : null);
        return found.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Medecin> rattacher(
            @PathVariable String cliniqueId,
            @RequestBody CliniqueMedecinRattachementRequest body,
            @AuthenticationPrincipal CustomUserDetails user) {
        verifierAccesClinique(cliniqueId, user);
        if (body == null || body.getMedecinId() == null || body.getMedecinId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "medecinId est obligatoire");
        }
        Medecin updated = medecinService.rattacherMedecinAClinique(cliniqueId, body.getMedecinId(), user);
        return ResponseEntity.ok(updated);
    }

    private void verifierAccesClinique(String cliniqueId, CustomUserDetails user) {
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        if ("SUPER_ADMIN".equals(user.getRole())) {
            return;
        }
        if ("ADMIN_CLINIQUE".equals(user.getRole())
                && user.getCliniqueId() != null
                && user.getCliniqueId().equals(cliniqueId)) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous n'avez pas accès à cette clinique");
    }
}
