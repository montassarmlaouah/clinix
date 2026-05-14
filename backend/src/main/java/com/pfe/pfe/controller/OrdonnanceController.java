package com.pfe.pfe.controller;

import com.pfe.pfe.dto.CreerOrdonnanceDTO;
import com.pfe.pfe.dto.LigneMedicamentDTO;
import com.pfe.pfe.model.Ordonnance;
import com.pfe.pfe.model.Prescription;
import com.pfe.pfe.service.OrdonnancePdfService;
import com.pfe.pfe.service.OrdonnanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ordonnances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OrdonnanceController {

    private final OrdonnanceService ordonnanceService;
    private final OrdonnancePdfService ordonnancePdfService;

    @PostMapping
    public ResponseEntity<Ordonnance> creerOrdonnance(@Valid @RequestBody CreerOrdonnanceDTO dto) {
        Ordonnance o = ordonnanceService.creerOrdonnance(dto);
        return new ResponseEntity<>(o, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ordonnance> getOrdonnance(@PathVariable String id) {
        return ordonnanceService.getById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/medicaments")
    public ResponseEntity<Prescription> ajouterMedicament(
            @PathVariable String id,
            @Valid @RequestBody LigneMedicamentDTO dto) {
        Prescription p = ordonnanceService.ajouterMedicament(id, dto);
        return new ResponseEntity<>(p, HttpStatus.CREATED);
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> telechargerPdf(@PathVariable String id) {
        byte[] pdf = ordonnancePdfService.genererPdf(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("attachment", "ordonnance-" + id + ".pdf");
        return ResponseEntity.ok().headers(headers).body(pdf);
    }

    @GetMapping
    public ResponseEntity<List<Ordonnance>> liste(
            @RequestParam(required = false) String medecinId,
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false, defaultValue = "false") boolean nonValideesOnly) {
        if (medecinId != null && !medecinId.isBlank()) {
            return ResponseEntity.ok(ordonnanceService.obtenirOrdonnancesParMedecin(medecinId));
        }
        if (patientId != null && !patientId.isBlank()) {
            return ResponseEntity.ok(ordonnanceService.obtenirOrdonnancesParPatient(patientId));
        }
        if (nonValideesOnly) {
            return ResponseEntity.ok(ordonnanceService.obtenirOrdonnancesNonValidees());
        }
        return ResponseEntity.ok(ordonnanceService.obtenirToutesLesOrdonnances());
    }

    @PatchMapping("/{id}/signer")
    public ResponseEntity<Ordonnance> signerOrdonnance(@PathVariable String id) {
        Ordonnance ordonnance = ordonnanceService.signerOrdonnance(id);
        return ResponseEntity.ok(ordonnance);
    }

    @PatchMapping("/{id}/valider")
    public ResponseEntity<Ordonnance> validerOrdonnance(
            @PathVariable String id,
            @RequestParam String pharmacienId) {
        Ordonnance ordonnance = ordonnanceService.validerOrdonnance(id, pharmacienId);
        return ResponseEntity.ok(ordonnance);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerOrdonnance(@PathVariable String id) {
        ordonnanceService.supprimerOrdonnance(id);
        return ResponseEntity.noContent().build();
    }
}
