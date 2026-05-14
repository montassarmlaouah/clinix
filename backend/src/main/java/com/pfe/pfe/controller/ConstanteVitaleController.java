package com.pfe.pfe.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.model.ConstanteVitale;
import com.pfe.pfe.model.Infirmier;
import com.pfe.pfe.model.Patient;
import com.pfe.pfe.repository.ConstanteVitaleRepository;
import com.pfe.pfe.repository.InfirmierRepository;
import com.pfe.pfe.repository.PatientRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/constantes-vitales")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ConstanteVitaleController {

    private final ConstanteVitaleRepository constanteVitaleRepository;
    private final PatientRepository patientRepository;
    private final InfirmierRepository infirmierRepository;

    @PostMapping
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> payload) {
        String patientId = (String) payload.get("patientId");
        String infirmierId = (String) payload.get("infirmierId");

        if (patientId == null || patientId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "patientId est obligatoire"));
        }
        if (infirmierId == null || infirmierId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "infirmierId est obligatoire"));
        }

        Patient patient = patientRepository.findById(patientId).orElse(null);
        Infirmier infirmier = infirmierRepository.findById(infirmierId).orElse(null);

        if (patient == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Patient non trouvé"));
        }
        if (infirmier == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Infirmier non trouvé"));
        }

        ConstanteVitale constante = new ConstanteVitale();
        constante.setPatient(patient);
        constante.setInfirmier(infirmier);
        constante.setDateHeure(LocalDateTime.now());

        if (payload.get("tension") != null) {
            constante.setTension(Double.valueOf(payload.get("tension").toString()));
        }
        if (payload.get("temperature") != null) {
            constante.setTemperature(Double.valueOf(payload.get("temperature").toString()));
        }
        if (payload.get("frequenceCardiaque") != null) {
            constante.setFrequenceCardiaque(Integer.valueOf(payload.get("frequenceCardiaque").toString()));
        }
        if (payload.get("saturationOxygene") != null) {
            constante.setSaturationOxygene(Integer.valueOf(payload.get("saturationOxygene").toString()));
        }
        if (payload.get("glycemie") != null) {
            constante.setGlycemie(Double.valueOf(payload.get("glycemie").toString()));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(constanteVitaleRepository.save(constante));
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ConstanteVitale>> listerPatient(@PathVariable String patientId) {
        return ResponseEntity.ok(constanteVitaleRepository.findByPatientIdOrderByDateHeureDesc(patientId));
    }

    @GetMapping("/patient/{patientId}/historique")
    public ResponseEntity<List<ConstanteVitale>> historique(
            @PathVariable String patientId,
            @RequestParam LocalDateTime debut,
            @RequestParam LocalDateTime fin
    ) {
        return ResponseEntity.ok(
                constanteVitaleRepository.findByPatientIdAndDateHeureBetweenOrderByDateHeureDesc(patientId, debut, fin)
        );
    }
}
