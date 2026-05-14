package com.pfe.pfe.controller;

import com.pfe.pfe.model.ImagerieDICOM;
import com.pfe.pfe.model.RapportImagerie;
import com.pfe.pfe.service.RadiologieService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RadiologieController {

    private final RadiologieService radiologieService;

    // ==================== IMAGERIES / EXAMENS ====================

    @PostMapping("/imageries/demander")
    public ResponseEntity<ImagerieDICOM> demanderExamen(@RequestBody Map<String, String> request) {
        String patientId = request.get("patientId");
        String medecinId = request.get("medecinId");
        String type = request.get("type");
        String motif = request.get("motif");
        String indications = request.get("indicationsCliniques");
        String questions = request.get("questionsMedecin");
        String pieces = request.get("piecesJointes");
        String urgence = request.get("niveauUrgence");

        ImagerieDICOM imagerie = radiologieService.demanderExamenEtendu(
                patientId, medecinId, type, motif, indications, questions, pieces, urgence);
        return new ResponseEntity<>(imagerie, HttpStatus.CREATED);
    }

    @GetMapping("/imageries/en-attente")
    public ResponseEntity<List<ImagerieDICOM>> obtenirDemandesEnAttente() {
        return ResponseEntity.ok(radiologieService.obtenirDemandesEnAttente());
    }

    @GetMapping("/imageries/radiologue/{radiologueId}")
    public ResponseEntity<List<ImagerieDICOM>> obtenirParRadiologue(@PathVariable String radiologueId) {
        return ResponseEntity.ok(radiologieService.obtenirDemandesParRadiologue(radiologueId));
    }

    @GetMapping("/imageries/medecin/{medecinId}")
    public ResponseEntity<List<ImagerieDICOM>> obtenirParMedecin(@PathVariable String medecinId) {
        return ResponseEntity.ok(radiologieService.obtenirDemandesParMedecin(medecinId));
    }

    @GetMapping("/imageries/patient/{patientId}")
    public ResponseEntity<List<ImagerieDICOM>> obtenirParPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(radiologieService.obtenirImageriesParPatient(patientId));
    }

    @GetMapping("/imageries/{id}")
    public ResponseEntity<ImagerieDICOM> obtenirImagerie(@PathVariable String id) {
        return ResponseEntity.ok(radiologieService.obtenirImagerieParId(id));
    }

    @PatchMapping("/imageries/{id}/prendre-en-charge")
    public ResponseEntity<ImagerieDICOM> prendreEnCharge(
            @PathVariable String id,
            @RequestParam String radiologueId) {
        return ResponseEntity.ok(radiologieService.prendreEnCharge(id, radiologueId));
    }

    @PatchMapping("/imageries/{id}/terminer")
    public ResponseEntity<ImagerieDICOM> terminerExamen(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String fichier = request.get("fichier");
        return ResponseEntity.ok(radiologieService.terminerExamen(id, fichier));
    }

    // ==================== RAPPORTS ====================

    @PostMapping("/rapports-imagerie")
    public ResponseEntity<RapportImagerie> creerRapport(@RequestBody Map<String, String> request) {
        String imagerieId = request.get("imagerieId");
        String radiologueId = request.get("radiologueId");
        String observations = request.get("observations");
        String analyse = request.get("analyse");
        String conclusion = request.get("conclusion");
        String recommandations = request.get("recommandations");

        RapportImagerie rapport = radiologieService.creerRapport(
                imagerieId, radiologueId, observations, analyse, conclusion, recommandations,
                request.get("diagnosticDifferentiel"), request.get("signesCliniquesNotables"));
        return new ResponseEntity<>(rapport, HttpStatus.CREATED);
    }

    @PatchMapping("/rapports-imagerie/{id}/brouillon")
    public ResponseEntity<RapportImagerie> majRapportBrouillon(
            @PathVariable String id,
            @RequestBody Map<String, String> request) {
        String radiologueId = request.get("radiologueId");
        RapportImagerie rapport = radiologieService.mettreAJourRapportBrouillon(
                id,
                radiologueId,
                request.get("observations"),
                request.get("analyse"),
                request.get("conclusion"),
                request.get("recommandations"),
                request.get("diagnosticDifferentiel"),
                request.get("signesCliniquesNotables"));
        return ResponseEntity.ok(rapport);
    }

    @PatchMapping("/rapports-imagerie/{id}/valider")
    public ResponseEntity<RapportImagerie> validerRapport(
            @PathVariable String id,
            @RequestParam String radiologueId) {
        return ResponseEntity.ok(radiologieService.validerRapport(id, radiologueId));
    }

    @GetMapping("/rapports-imagerie/imagerie/{imagerieId}")
    public ResponseEntity<RapportImagerie> obtenirRapportParImagerie(@PathVariable String imagerieId) {
        return ResponseEntity.ok(radiologieService.obtenirRapportParImagerie(imagerieId));
    }

    @GetMapping("/rapports-imagerie/radiologue/{radiologueId}")
    public ResponseEntity<List<RapportImagerie>> obtenirRapportsParRadiologue(@PathVariable String radiologueId) {
        return ResponseEntity.ok(radiologieService.obtenirRapportsParRadiologue(radiologueId));
    }
}
