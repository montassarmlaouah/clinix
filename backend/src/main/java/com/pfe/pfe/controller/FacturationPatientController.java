package com.pfe.pfe.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.dto.GenererFactureRequest;
import com.pfe.pfe.dto.PrestationFacturationRequest;
import com.pfe.pfe.dto.TeletransmissionResult;
import com.pfe.pfe.dto.ValiderPaiementRequest;
import com.pfe.pfe.model.FacturePatient;
import com.pfe.pfe.model.PrestationFacturation;
import com.pfe.pfe.model.StatutFacturePatient;
import com.pfe.pfe.service.FacturationPatientService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/facturation-patient")
@RequiredArgsConstructor
public class FacturationPatientController {

    private final FacturationPatientService facturationPatientService;

    /** US 8 — Catalogue des prestations (actives par défaut). */
    @GetMapping("/prestations/clinique/{cliniqueId}")
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE')")
    public List<PrestationFacturation> prestations(
            @PathVariable String cliniqueId,
            @RequestParam(name = "inclureInactives", defaultValue = "false") boolean inclureInactives) {
        return facturationPatientService.listerPrestations(cliniqueId, inclureInactives);
    }

    @PostMapping("/prestations/clinique/{cliniqueId}/initialiser")
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public List<PrestationFacturation> initialiserCatalogue(@PathVariable String cliniqueId) {
        return facturationPatientService.forcerInitialisationCatalogue(cliniqueId);
    }

    @PutMapping("/prestations/{id}")
    @PreAuthorize("hasRole('ADMIN_CLINIQUE')")
    public PrestationFacturation modifierPrestation(
            @PathVariable String id,
            @RequestBody PrestationFacturationRequest request) {
        return facturationPatientService.modifierPrestation(id, request);
    }

    /** US 12 — Liste des factures avec filtre optionnel par statut. */
    @GetMapping("/clinique/{cliniqueId}")
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE')")
    public List<FacturePatient> parClinique(
            @PathVariable String cliniqueId,
            @RequestParam(name = "statut", required = false) StatutFacturePatient statut) {
        return facturationPatientService.listerParClinique(cliniqueId, statut);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE')")
    public FacturePatient detail(@PathVariable String id) {
        return facturationPatientService.obtenir(id);
    }

    /** US 9 — Génération facture sortie hospitalisation. */
    @PostMapping("/generer")
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE')")
    public FacturePatient generer(@RequestBody GenererFactureRequest request) {
        return facturationPatientService.genererDepuisHospitalisation(request);
    }

    /** US 11 — Émission facture. */
    @PostMapping("/{id}/emettre")
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE')")
    public FacturePatient emettre(@PathVariable String id) {
        return facturationPatientService.emettre(id);
    }

    /** US 11 — Paiement (espèces, carte, chèque, tiers-payant). */
    @PostMapping("/{id}/valider-paiement")
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE')")
    public FacturePatient validerPaiement(@PathVariable String id, @RequestBody ValiderPaiementRequest request) {
        return facturationPatientService.validerPaiement(id, request);
    }

    /** US 13 — Télétransmission CNAM (simulation). */
    @PostMapping("/{id}/teletransmettre")
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE')")
    public TeletransmissionResult teletransmettre(@PathVariable String id) {
        return facturationPatientService.teletransmettre(id);
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasAnyRole('SECRETAIRE','ADMIN_CLINIQUE')")
    public ResponseEntity<byte[]> pdf(@PathVariable String id) {
        byte[] pdf = facturationPatientService.genererPdf(id);
        FacturePatient f = facturationPatientService.obtenir(id);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + f.getNumeroFacture() + ".pdf\"")
            .body(pdf);
    }
}
