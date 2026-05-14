package com.pfe.pfe.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.CreerAdministrateurCliniqueDTO;
import com.pfe.pfe.dto.RegisterAdminCliniqueDTO;
import com.pfe.pfe.model.AdministrateurClinique;
import com.pfe.pfe.service.AdministrateurCliniqueService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/administrateurs-clinique")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdministrateurCliniqueController {

    private final AdministrateurCliniqueService adminCliniqueService;

    /**
     * Créer un nouvel administrateur de clinique pour une clinique existante
     * POST /api/administrateurs-clinique
     */
    @PostMapping
    public ResponseEntity<AdministrateurClinique> creerAdministrateurClinique(
            @RequestBody CreerAdministrateurCliniqueDTO dto) {
        AdministrateurClinique admin = adminCliniqueService.creerAdministrateurClinique(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(admin);
    }

    /**
     * Obtenir TOUS les administrateurs de clinique
     * GET /api/administrateurs-clinique
     */
    @GetMapping
    public ResponseEntity<List<AdministrateurClinique>> obtenirTousLesAdmins() {
        List<AdministrateurClinique> admins = adminCliniqueService.obtenirTousLesAdmins();
        return ResponseEntity.ok(admins);
    }

    /**
     * Obtenir un administrateur par ID
     * GET /api/administrateurs-clinique/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdministrateurClinique> obtenirAdminParId(
            @PathVariable String id) {
        AdministrateurClinique admin = adminCliniqueService.obtenirAdminParId(id);
        return ResponseEntity.ok(admin);
    }

    /**
     * Obtenir tous les administrateurs d'une clinique
     * GET /api/administrateurs-clinique/clinique/{cliniqueId}
     */
    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<List<AdministrateurClinique>> obtenirAdminsClinique(
            @PathVariable String cliniqueId) {
        List<AdministrateurClinique> admins = adminCliniqueService.obtenirAdminsClinique(cliniqueId);
        return ResponseEntity.ok(admins);
    }

    /**
     * Obtenir les administrateurs actifs d'une clinique
     * GET /api/administrateurs-clinique/clinique/{cliniqueId}/actifs
     */
    @GetMapping("/clinique/{cliniqueId}/actifs")
    public ResponseEntity<List<AdministrateurClinique>> obtenirAdminsActifsClinique(
            @PathVariable String cliniqueId) {
        List<AdministrateurClinique> admins = adminCliniqueService.obtenirAdminsActifsClinique(cliniqueId);
        return ResponseEntity.ok(admins);
    }

    /**
     * Vérifier un administrateur par téléphone
     * GET /api/administrateurs-clinique/telephone/{telephone}
     */
    @GetMapping("/telephone/{telephone}")
    public ResponseEntity<AdministrateurClinique> obtenirAdminParTelephone(
            @PathVariable String telephone) {
        AdministrateurClinique admin = adminCliniqueService.obtenirAdminParTelephone(telephone);
        return ResponseEntity.ok(admin);
    }

    /**
     * Vérifier un administrateur par téléphone et clinique
     * GET /api/administrateurs-clinique/telephone/{telephone}/clinique/{cliniqueId}
     */
    @GetMapping("/telephone/{telephone}/clinique/{cliniqueId}")
    public ResponseEntity<AdministrateurClinique> obtenirAdminParTelephoneEtClinique(
            @PathVariable String telephone,
            @PathVariable String cliniqueId) {
        AdministrateurClinique admin = adminCliniqueService.obtenirAdminParTelephoneEtClinique(telephone, cliniqueId);
        return ResponseEntity.ok(admin);
    }

    /**
     * Mettre à jour un administrateur
     * PUT /api/administrateurs-clinique/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<AdministrateurClinique> mettreAJourAdmin(
            @PathVariable String id,
            @RequestBody RegisterAdminCliniqueDTO dto) {
        AdministrateurClinique admin = adminCliniqueService.mettreAJourAdmin(id, dto);
        return ResponseEntity.ok(admin);
    }

    /**
     * Supprimer définitivement un administrateur
     * DELETE /api/administrateurs-clinique/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerAdmin(@PathVariable String id) {
        adminCliniqueService.supprimerAdmin(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Désactiver un administrateur (soft delete)
     * PUT /api/administrateurs-clinique/{id}/desactiver
     */
    @PutMapping("/{id}/desactiver")
    public ResponseEntity<Void> desactiverAdmin(@PathVariable String id) {
        adminCliniqueService.desactiverAdmin(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Activer un administrateur
     * PUT /api/administrateurs-clinique/{id}/activer
     */
    @PutMapping("/{id}/activer")
    public ResponseEntity<Void> activerAdmin(@PathVariable String id) {
        adminCliniqueService.activerAdmin(id);
        return ResponseEntity.noContent().build();
    }
}