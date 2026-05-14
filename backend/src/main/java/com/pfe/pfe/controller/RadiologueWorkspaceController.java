package com.pfe.pfe.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.pfe.pfe.dto.RadiologueWorkspaceStatsDto;
import com.pfe.pfe.model.ImagerieDICOM;
import com.pfe.pfe.model.RapportImagerie;
import com.pfe.pfe.security.services.CustomUserDetails;
import com.pfe.pfe.service.RadiologieService;

import lombok.RequiredArgsConstructor;

/**
 * Espace radiologue : liste des demandes (file + assignées), prise en charge, refus, planification,
 * rapport structuré et validation (notification au médecin demandeur).
 */
@RestController
@RequestMapping("/api/radiologue/workspace")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('RADIOLOGUE')")
public class RadiologueWorkspaceController {

    private final RadiologieService radiologieService;

    @GetMapping("/imageries")
    public ResponseEntity<List<ImagerieDICOM>> listeImageries() {
        String rid = radiologueConnecteId();
        return ResponseEntity.ok(radiologieService.listImagerieWorkspacePourRadiologue(rid));
    }

    @GetMapping("/stats")
    public ResponseEntity<RadiologueWorkspaceStatsDto> statsWorkspace() {
        String rid = radiologueConnecteId();
        return ResponseEntity.ok(radiologieService.workspaceStats(rid));
    }

    @GetMapping("/imageries/{id}")
    public ResponseEntity<ImagerieDICOM> detailImagerie(@PathVariable String id) {
        String rid = radiologueConnecteId();
        return ResponseEntity.ok(exec(() -> radiologieService.obtenirImageriePourRadiologue(id, rid)));
    }

    @GetMapping("/imageries/{imagerieId}/rapport")
    public ResponseEntity<RapportImagerie> rapportPourImagerie(@PathVariable String imagerieId) {
        String rid = radiologueConnecteId();
        exec(() -> radiologieService.obtenirImageriePourRadiologue(imagerieId, rid));
        return radiologieService.trouverRapportParImagerie(imagerieId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/patients/{patientId}/historique-imageries")
    public ResponseEntity<List<ImagerieDICOM>> historiqueImageriesPatient(@PathVariable String patientId) {
        String rid = radiologueConnecteId();
        return ResponseEntity.ok(exec(() -> radiologieService.listHistoriqueImageriesPatientPourRadiologue(rid, patientId)));
    }

    @PatchMapping("/imageries/{id}/prendre-en-charge")
    public ResponseEntity<ImagerieDICOM> prendreEnCharge(@PathVariable String id) {
        String rid = radiologueConnecteId();
        return ResponseEntity.ok(exec(() -> radiologieService.prendreEnCharge(id, rid)));
    }

    @PatchMapping("/imageries/{id}/refuser")
    public ResponseEntity<ImagerieDICOM> refuser(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        String rid = radiologueConnecteId();
        String motif = body != null ? body.get("motifRefus") : null;
        return ResponseEntity.ok(exec(() -> radiologieService.refuserDemande(id, rid, motif)));
    }

    @PatchMapping("/imageries/{id}/planifier")
    public ResponseEntity<ImagerieDICOM> planifier(@PathVariable String id, @RequestBody Map<String, String> body) {
        String rid = radiologueConnecteId();
        LocalDate d = parseDate(body != null ? body.get("datePrevue") : null);
        LocalTime h = parseHeureOpt(body != null ? body.get("heurePrevue") : null);
        return ResponseEntity.ok(exec(() -> radiologieService.planifierDatePrevue(id, rid, d, h)));
    }

    @PatchMapping("/imageries/{id}/priorite")
    public ResponseEntity<ImagerieDICOM> majPriorite(@PathVariable String id, @RequestBody Map<String, String> body) {
        String rid = radiologueConnecteId();
        String nu = body != null ? body.get("niveauUrgence") : null;
        return ResponseEntity.ok(exec(() -> radiologieService.majNiveauUrgence(id, rid, nu)));
    }

    @PatchMapping("/imageries/{id}/type-examen-realise")
    public ResponseEntity<ImagerieDICOM> majTypeExamenRealise(@PathVariable String id, @RequestBody Map<String, String> body) {
        String rid = radiologueConnecteId();
        String t = body != null ? body.get("typeExamenRealise") : null;
        return ResponseEntity.ok(exec(() -> radiologieService.majTypeExamenRealise(id, rid, t)));
    }

    @PatchMapping("/imageries/{id}/fichier-supplementaire")
    public ResponseEntity<ImagerieDICOM> ajouterFichierSupplementaire(@PathVariable String id, @RequestBody Map<String, String> body) {
        String rid = radiologueConnecteId();
        String ligne = body != null ? body.get("ligne") : null;
        return ResponseEntity.ok(exec(() -> radiologieService.ajouterFichierSupplementaire(id, rid, ligne)));
    }

    @PatchMapping("/imageries/{id}/commentaires-images")
    public ResponseEntity<ImagerieDICOM> majCommentairesImages(@PathVariable String id, @RequestBody Map<String, String> body) {
        String rid = radiologueConnecteId();
        String txt = body != null ? body.get("commentaires") : null;
        return ResponseEntity.ok(exec(() -> radiologieService.majCommentairesImages(id, rid, txt)));
    }

    @PatchMapping("/imageries/{id}/notes-cooperation")
    public ResponseEntity<ImagerieDICOM> notesCooperation(@PathVariable String id, @RequestBody Map<String, String> body) {
        String rid = radiologueConnecteId();
        String notes = body != null ? body.get("notes") : null;
        return ResponseEntity.ok(exec(() -> radiologieService.majNotesCooperationPatient(id, rid, notes)));
    }

    @PatchMapping("/imageries/{id}/protocole")
    public ResponseEntity<ImagerieDICOM> majProtocole(@PathVariable String id, @RequestBody Map<String, String> body) {
        String rid = radiologueConnecteId();
        String protocole = body != null ? body.get("protocoleExamen") : null;
        return ResponseEntity.ok(exec(() -> radiologieService.majProtocoleExamen(id, rid, protocole)));
    }

    @PatchMapping("/imageries/{id}/terminer")
    public ResponseEntity<ImagerieDICOM> terminer(@PathVariable String id, @RequestBody(required = false) Map<String, String> body) {
        String rid = radiologueConnecteId();
        String fichier = body != null ? body.get("fichier") : null;
        return ResponseEntity.ok(exec(() -> radiologieService.terminerExamenPourRadiologue(id, rid, fichier)));
    }

    @PostMapping("/rapports")
    public ResponseEntity<RapportImagerie> creerRapport(@RequestBody Map<String, String> request) {
        String rid = radiologueConnecteId();
        String imagerieId = request != null ? request.get("imagerieId") : null;
        String observations = request != null ? request.get("observations") : null;
        String analyse = request != null ? request.get("analyse") : null;
        String conclusion = request != null ? request.get("conclusion") : null;
        String recommandations = request != null ? request.get("recommandations") : null;
        String diagnosticDifferentiel = request != null ? request.get("diagnosticDifferentiel") : null;
        String signesCliniquesNotables = request != null ? request.get("signesCliniquesNotables") : null;
        RapportImagerie r = exec(() -> radiologieService.creerRapport(imagerieId, rid, observations, analyse, conclusion,
                recommandations, diagnosticDifferentiel, signesCliniquesNotables));
        return new ResponseEntity<>(r, HttpStatus.CREATED);
    }

    @PatchMapping("/rapports/{id}/brouillon")
    public ResponseEntity<RapportImagerie> majBrouillon(@PathVariable String id, @RequestBody Map<String, String> body) {
        String rid = radiologueConnecteId();
        RapportImagerie r = exec(() -> radiologieService.mettreAJourRapportBrouillon(
                id,
                rid,
                body != null ? body.get("observations") : null,
                body != null ? body.get("analyse") : null,
                body != null ? body.get("conclusion") : null,
                body != null ? body.get("recommandations") : null,
                body != null ? body.get("diagnosticDifferentiel") : null,
                body != null ? body.get("signesCliniquesNotables") : null));
        return ResponseEntity.ok(r);
    }

    @PatchMapping("/rapports/{id}/valider")
    public ResponseEntity<RapportImagerie> valider(@PathVariable String id) {
        String rid = radiologueConnecteId();
        return ResponseEntity.ok(exec(() -> radiologieService.validerRapport(id, rid)));
    }

    @GetMapping(value = "/rapports/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> exporterRapportPdf(@PathVariable String id) {
        String rid = radiologueConnecteId();
        byte[] pdf = exec(() -> radiologieService.exporterRapportPdf(id, rid));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"rapport-imagerie-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private static String radiologueConnecteId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails cud) || cud.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session radiologue invalide.");
        }
        return cud.getId();
    }

    private static LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "datePrevue requise (AAAA-MM-JJ).");
        }
        try {
            return LocalDate.parse(s.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "datePrevue invalide.");
        }
    }

    private static LocalTime parseHeureOpt(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(s.trim());
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "heurePrevue invalide (HH:mm).");
        }
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
