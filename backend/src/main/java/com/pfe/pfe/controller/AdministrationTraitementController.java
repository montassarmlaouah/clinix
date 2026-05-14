package com.pfe.pfe.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.dto.AdministrationTraitementDTO;
import com.pfe.pfe.model.AdministrationTraitement;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.AdministrationTraitementService;

import lombok.RequiredArgsConstructor;

/**
 * Contrôleur REST pour l'administration des traitements
 * Gère le suivi des médicaments administrés par les infirmiers
 */
@RestController
@RequestMapping("/api/administrations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdministrationTraitementController {
    
    private final AdministrationTraitementService administrationService;
    
    /**
     * Créer une nouvelle administration de traitement
     * POST /api/administrations
     */
    @PostMapping
    public ResponseEntity<AdministrationTraitement> creerAdministration(
            @RequestBody AdministrationTraitementDTO dto) {
        AdministrationTraitement administration = administrationService.creerAdministration(dto);
        return new ResponseEntity<>(administration, HttpStatus.CREATED);
    }
    
    /**
     * Créer un planning journalier de traitements
     * POST /api/administrations/planning
     */
    @PostMapping("/planning")
    public ResponseEntity<List<AdministrationTraitement>> creerPlanningJournalier(
            @RequestBody Map<String, Object> request) {
        String patientId = (String) request.get("patientId");
        String infirmierId = (String) request.get("infirmierId");
        @SuppressWarnings("unchecked")
        List<AdministrationTraitementDTO> traitements = 
                (List<AdministrationTraitementDTO>) request.get("traitements");
        
        List<AdministrationTraitement> planning = 
                administrationService.creerPlanningJournalier(patientId, infirmierId, traitements);
        return new ResponseEntity<>(planning, HttpStatus.CREATED);
    }
    
    /**
     * Obtenir tous les traitements d'un patient
     * GET /api/administrations/patient/{patientId}
     */
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<AdministrationTraitement>> obtenirTraitementsPatient(
            @PathVariable String patientId) {
        List<AdministrationTraitement> traitements = 
                administrationService.obtenirTraitementsPatient(patientId);
        return ResponseEntity.ok(traitements);
    }
    
    /**
     * Obtenir les traitements du jour pour un patient
     * GET /api/administrations/patient/{patientId}/aujourd-hui
     */
    @GetMapping("/patient/{patientId}/aujourd-hui")
    public ResponseEntity<List<AdministrationTraitement>> obtenirTraitementsDuJour(
            @PathVariable String patientId) {
        List<AdministrationTraitement> traitements = 
                administrationService.obtenirTraitementsDuJour(patientId);
        return ResponseEntity.ok(traitements);
    }
    
    /**
     * Obtenir les traitements à venir pour un patient
     * GET /api/administrations/patient/{patientId}/a-venir
     */
    @GetMapping("/patient/{patientId}/a-venir")
    public ResponseEntity<List<AdministrationTraitement>> obtenirTraitementsAVenir(
            @PathVariable String patientId) {
        List<AdministrationTraitement> traitements = 
                administrationService.obtenirTraitementsAVenir(patientId);
        return ResponseEntity.ok(traitements);
    }
    
    /**
     * Obtenir les traitements non administrés pour un patient
     * GET /api/administrations/patient/{patientId}/non-administres
     */
    @GetMapping("/patient/{patientId}/non-administres")
    public ResponseEntity<List<AdministrationTraitement>> obtenirTraitementsNonAdministres(
            @PathVariable String patientId) {
        List<AdministrationTraitement> traitements = 
                administrationService.obtenirTraitementsNonAdministres(patientId);
        return ResponseEntity.ok(traitements);
    }
    
    /**
     * Obtenir les traitements par type
     * GET /api/administrations/patient/{patientId}/type/{typeTraitement}
     */
    @GetMapping("/patient/{patientId}/type/{typeTraitement}")
    public ResponseEntity<List<AdministrationTraitement>> obtenirTraitementsParType(
            @PathVariable String patientId,
            @PathVariable String typeTraitement) {
        List<AdministrationTraitement> traitements = 
                administrationService.obtenirTraitementsParType(patientId, typeTraitement);
        return ResponseEntity.ok(traitements);
    }
    
    /**
     * Obtenir tous les traitements administrés par un infirmier
     * GET /api/administrations/infirmier/{infirmierId}
     */
    @GetMapping("/infirmier/{infirmierId}")
    public ResponseEntity<List<AdministrationTraitement>> obtenirTraitementsInfirmier(
            @PathVariable String infirmierId) {
        List<AdministrationTraitement> traitements = 
                administrationService.obtenirTraitementsInfirmier(infirmierId);
        return ResponseEntity.ok(traitements);
    }
    
    /**
     * Obtenir un traitement par son ID
     * GET /api/administrations/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<AdministrationTraitement> obtenirTraitementParId(
            @PathVariable String id) {
        AdministrationTraitement traitement = administrationService.obtenirTraitementParId(id);
        return ResponseEntity.ok(traitement);
    }
    
    /**
     * Marquer un traitement comme administré
     * PATCH /api/administrations/{id}/administrer
     */
    @PatchMapping("/{id}/administrer")
    public ResponseEntity<AdministrationTraitement> marquerCommeAdministre(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> request) {
        String observations = request != null ? request.get("observations") : null;
        AdministrationTraitement traitement = 
                administrationService.marquerCommeAdministre(id, observations);
        return ResponseEntity.ok(traitement);
    }

    /**
     * Validation ou refus du soin infirmier réalisé (circuit coordonné par le médecin).
     */
    @PatchMapping("/{id}/validation-medecin")
    public ResponseEntity<AdministrationTraitement> validationMedecin(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String medecinId = requireMedecinPrincipalId();
        boolean valide = Boolean.TRUE.equals(body.get("valide"));
        String commentaire = body.get("commentaire") != null ? String.valueOf(body.get("commentaire")) : null;
        try {
            return ResponseEntity.ok(administrationService.validerSoinParMedecin(id, medecinId, valide, commentaire));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PatchMapping("/{id}/statut-execution")
    public ResponseEntity<AdministrationTraitement> statutExecution(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String infirmierId = requireInfirmierPrincipalId();
        String statut = body != null ? body.get("statut") : null;
        String remarques = body != null ? body.get("remarques") : null;
        try {
            return ResponseEntity.ok(administrationService.mettreStatutExecutionInfirmier(id, infirmierId, statut, remarques));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PatchMapping("/{id}/priorite-urgente")
    public ResponseEntity<AdministrationTraitement> prioriteUrgente(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        String infirmierId = requireInfirmierPrincipalId();
        boolean urgent = Boolean.TRUE.equals(body.get("urgent"));
        return ResponseEntity.ok(administrationService.definirPrioriteUrgente(id, infirmierId, urgent));
    }

    @PatchMapping("/{id}/piece-jointe")
    public ResponseEntity<AdministrationTraitement> pieceJointe(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String infirmierId = requireInfirmierPrincipalId();
        String url = body != null ? body.get("url") : null;
        if (url == null || url.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "URL obligatoire");
        }
        return ResponseEntity.ok(administrationService.definirPieceJointe(id, infirmierId, url.trim()));
    }
    
    /**
     * Mettre à jour un traitement
     * PUT /api/administrations/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<AdministrationTraitement> mettreAJourTraitement(
            @PathVariable String id,
            @RequestBody AdministrationTraitementDTO dto) {
        AdministrationTraitement traitement = 
                administrationService.mettreAJourTraitement(id, dto);
        return ResponseEntity.ok(traitement);
    }
    
    /**
     * Supprimer un traitement
     * DELETE /api/administrations/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerTraitement(@PathVariable String id) {
        administrationService.supprimerTraitement(id);
        return ResponseEntity.noContent().build();
    }

    private static String requireMedecinPrincipalId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud) || cud.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Médecin non identifié.");
        }
        return cud.getId();
    }

    private static String requireInfirmierPrincipalId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud) || cud.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Infirmier non identifié.");
        }
        return cud.getId();
    }
}
