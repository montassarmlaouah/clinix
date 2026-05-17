package com.pfe.pfe.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.GenererFactureRequest;
import com.pfe.pfe.dto.TeletransmissionResult;
import com.pfe.pfe.dto.ValiderPaiementRequest;
import com.pfe.pfe.model.FacturePatient;
import com.pfe.pfe.model.PrestationFacturation;
import com.pfe.pfe.service.FacturationPatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/facturation-patient")
@RequiredArgsConstructor
public class FacturationPatientController {

    private final FacturationPatientService facturationPatientService;

    @GetMapping("/prestations/clinique/{cliniqueId}")
    public List<PrestationFacturation> prestations(@PathVariable String cliniqueId) {
        return facturationPatientService.listerPrestations(cliniqueId);
    }

    @GetMapping("/clinique/{cliniqueId}")
    public List<FacturePatient> parClinique(@PathVariable String cliniqueId) {
        return facturationPatientService.listerParClinique(cliniqueId);
    }

    @GetMapping("/{id}")
    public FacturePatient detail(@PathVariable String id) {
        return facturationPatientService.obtenir(id);
    }

    @PostMapping("/generer")
    public FacturePatient generer(@RequestBody GenererFactureRequest request) {
        return facturationPatientService.genererDepuisHospitalisation(request);
    }

    @PostMapping("/{id}/emettre")
    public FacturePatient emettre(@PathVariable String id) {
        return facturationPatientService.emettre(id);
    }

    @PostMapping("/{id}/valider-paiement")
    public FacturePatient validerPaiement(@PathVariable String id, @RequestBody ValiderPaiementRequest request) {
        return facturationPatientService.validerPaiement(id, request);
    }

    @PostMapping("/{id}/teletransmettre")
    public TeletransmissionResult teletransmettre(@PathVariable String id) {
        return facturationPatientService.teletransmettre(id);
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> pdf(@PathVariable String id) {
        byte[] pdf = facturationPatientService.genererPdf(id);
        FacturePatient f = facturationPatientService.obtenir(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + f.getNumeroFacture() + ".pdf\"")
            .body(pdf);
    }
}
