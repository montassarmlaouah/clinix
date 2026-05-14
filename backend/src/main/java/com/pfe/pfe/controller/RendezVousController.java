package com.pfe.pfe.controller;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.dto.RendezVousDTO;
import com.pfe.pfe.model.RendezVous;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.RendezVousService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/rendez-vous")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RendezVousController {
    
    private final RendezVousService rendezVousService;
    
    @PostMapping
    public ResponseEntity<RendezVous> creerRendezVous(@RequestBody RendezVousDTO dto) {
        RendezVous rendezVous = rendezVousService.creerRendezVous(dto);
        return new ResponseEntity<>(rendezVous, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<RendezVous>> obtenirTousLesRendezVous() {
        List<RendezVous> rendezVous = rendezVousService.obtenirTousLesRendezVous();
        return ResponseEntity.ok(rendezVous);
    }
    
    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<RendezVous>> obtenirRendezVousParPatient(@PathVariable String patientId) {
        List<RendezVous> rendezVous = rendezVousService.obtenirRendezVousParPatient(patientId);
        return ResponseEntity.ok(rendezVous);
    }

    @GetMapping("/clinique/{cliniqueId}/jour")
    public ResponseEntity<List<RendezVous>> rendezVousCliniqueJour(
            @PathVariable String cliniqueId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate d = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(rendezVousService.listerRendezVousCliniquePourJour(cliniqueId, d));
    }

    @GetMapping("/clinique/{cliniqueId}")
    public ResponseEntity<List<RendezVous>> obtenirRendezVousParClinique(@PathVariable String cliniqueId) {
        List<RendezVous> rendezVous = rendezVousService.obtenirRendezVousParClinique(cliniqueId);
        return ResponseEntity.ok(rendezVous);
    }
    
    @GetMapping("/medecin/{medecinId}")
    public ResponseEntity<List<RendezVous>> obtenirRendezVousParMedecin(@PathVariable String medecinId) {
        List<RendezVous> rendezVous = rendezVousService.obtenirRendezVousParMedecin(medecinId);
        return ResponseEntity.ok(rendezVous);
    }

    /** RDV « clinique » : patients de l'établissement sans suivi cabinet exclusif. */
    @GetMapping("/medecin/{medecinId}/clinique/{cliniqueId}")
    public ResponseEntity<List<RendezVous>> listerRdvCliniquePourMedecin(
            @PathVariable String medecinId,
            @PathVariable String cliniqueId) {
        assertMedecinConnecte(medecinId);
        return ResponseEntity.ok(rendezVousService.listerRendezVousCliniquePourMedecin(medecinId, cliniqueId));
    }

    /** RDV « cabinet » : patients rattachés au médecin en cabinet. */
    @GetMapping("/medecin/{medecinId}/rdv-cabinet")
    public ResponseEntity<List<RendezVous>> listerRdvCabinetPourMedecin(@PathVariable String medecinId) {
        assertMedecinConnecte(medecinId);
        return ResponseEntity.ok(rendezVousService.listerRendezVousCabinetPourMedecin(medecinId));
    }

    @PatchMapping("/{id}/confirmer-medecin")
    public ResponseEntity<RendezVous> confirmerParMedecin(@PathVariable String id) {
        String medecinId = medecinConnecteId();
        if (medecinId == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Médecin non identifié.");
        }
        try {
            return ResponseEntity.ok(rendezVousService.confirmerRendezVousParMedecin(id, medecinId));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
    
    @PatchMapping("/{id}/confirmer")
    public ResponseEntity<RendezVous> confirmerRendezVous(@PathVariable String id) {
        RendezVous rendezVous = rendezVousService.confirmerRendezVous(id);
        return ResponseEntity.ok(rendezVous);
    }
    
    @PatchMapping("/{id}/annuler")
    public ResponseEntity<RendezVous> annulerRendezVous(@PathVariable String id) {
        RendezVous rendezVous = rendezVousService.annulerRendezVous(id);
        return ResponseEntity.ok(rendezVous);
    }
    
    @PatchMapping("/{id}/reporter")
    public ResponseEntity<RendezVous> reporterRendezVous(
            @PathVariable String id,
            @RequestParam LocalDateTime nouvelleDate) {
        RendezVous rendezVous = rendezVousService.reporterRendezVous(id, nouvelleDate);
        return ResponseEntity.ok(rendezVous);
    }

    @PatchMapping("/{id}/validation-visite-infirmier")
    public ResponseEntity<RendezVous> validationVisiteInfirmier(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, Object> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud) || cud.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Utilisateur non identifié.");
        }
        String observations = body != null && body.get("observations") != null
                ? String.valueOf(body.get("observations")) : null;
        boolean signer = body != null && Boolean.TRUE.equals(body.get("signer"));
        try {
            return ResponseEntity.ok(rendezVousService.validerVisiteParInfirmier(id, cud.getId(), observations, signer));
        } catch (RuntimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<RendezVous> mettreAJourRendezVous(@PathVariable String id, @RequestBody RendezVousDTO dto) {
        RendezVous rendezVous = rendezVousService.mettreAJourRendezVous(id, dto);
        return ResponseEntity.ok(rendezVous);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerRendezVous(@PathVariable String id) {
        rendezVousService.supprimerRendezVous(id);
        return ResponseEntity.noContent().build();
    }

    private static void assertMedecinConnecte(String medecinId) {
        String c = medecinConnecteId();
        if (c == null || !c.equals(medecinId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès réservé au médecin concerné.");
        }
    }

    private static String medecinConnecteId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud) || cud.getId() == null) {
            return null;
        }
        return cud.getId();
    }
}
