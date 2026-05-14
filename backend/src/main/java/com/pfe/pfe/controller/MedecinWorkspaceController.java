package com.pfe.pfe.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.model.AdministrationTraitement;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.MedecinWorkspaceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/medecins/{medecinId}/workspace")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MedecinWorkspaceController {

    private final MedecinWorkspaceService medecinWorkspaceService;

    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> statistiques(@PathVariable String medecinId) {
        String connecte = medecinConnecteId();
        return ResponseEntity.ok(medecinWorkspaceService.statistiques(medecinId, connecte));
    }

    @GetMapping("/infirmiers")
    public ResponseEntity<List<Infirmier>> infirmiers(@PathVariable String medecinId) {
        String connecte = medecinConnecteId();
        return ResponseEntity.ok(medecinWorkspaceService.infirmiersMemeClinique(medecinId, connecte));
    }

    @GetMapping("/soins-suivi")
    public ResponseEntity<List<AdministrationTraitement>> suiviSoins(@PathVariable String medecinId) {
        String connecte = medecinConnecteId();
        return ResponseEntity.ok(medecinWorkspaceService.suiviSoins(medecinId, connecte));
    }

    private static String medecinConnecteId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud) || cud.getId() == null) {
            return null;
        }
        return cud.getId();
    }
}
