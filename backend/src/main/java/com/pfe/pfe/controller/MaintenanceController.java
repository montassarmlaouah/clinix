package com.pfe.pfe.controller;

import com.pfe.pfe.model.Equipement;
import com.pfe.pfe.model.Maintenance;
import com.pfe.pfe.model.TechnicienMaintenance;
import com.pfe.pfe.repository.EquipementRepository;
import com.pfe.pfe.repository.MaintenanceRepository;
import com.pfe.pfe.repository.TechnicienMaintenanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MaintenanceController {

    private final MaintenanceRepository maintenanceRepository;
    private final EquipementRepository equipementRepository;
    private final TechnicienMaintenanceRepository technicienMaintenanceRepository;

    @GetMapping
    public ResponseEntity<List<Maintenance>> listerToutes() {
        return ResponseEntity.ok(maintenanceRepository.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Maintenance> obtenirParId(@PathVariable String id) {
        return maintenanceRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/equipement/{equipementId}")
    public ResponseEntity<List<Maintenance>> listerParEquipement(@PathVariable String equipementId) {
        return ResponseEntity.ok(maintenanceRepository.findByEquipementId(equipementId));
    }

    @GetMapping("/technicien/{technicienId}")
    public ResponseEntity<List<Maintenance>> listerParTechnicien(@PathVariable String technicienId) {
        return ResponseEntity.ok(maintenanceRepository.findByTechnicienId(technicienId));
    }

    @PostMapping
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> payload) {
        String equipementId = (String) payload.get("equipementId");
        if (equipementId == null || equipementId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "equipementId est obligatoire"));
        }

        Equipement equipement = equipementRepository.findById(equipementId).orElse(null);
        if (equipement == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Equipement non trouvé"));
        }

        Maintenance maintenance = new Maintenance();
        maintenance.setEquipement(equipement);
        maintenance.setDescription((String) payload.get("description"));

        String dateStr = (String) payload.get("date");
        maintenance.setDate((dateStr == null || dateStr.isBlank()) ? LocalDate.now() : LocalDate.parse(dateStr));

        String typeStr = (String) payload.get("type");
        maintenance.setType(typeStr == null ? Maintenance.TypeMaintenance.CORRECTIVE : Maintenance.TypeMaintenance.valueOf(typeStr));

        String statutStr = (String) payload.get("statut");
        maintenance.setStatut(statutStr == null ? Maintenance.StatutMaintenance.PLANIFIEE : Maintenance.StatutMaintenance.valueOf(statutStr));

        String technicienId = (String) payload.get("technicienId");
        if (technicienId != null && !technicienId.isBlank()) {
            TechnicienMaintenance tech = technicienMaintenanceRepository.findById(technicienId).orElse(null);
            maintenance.setTechnicien(tech);
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(maintenanceRepository.save(maintenance));
    }

    @PostMapping("/planifier")
    public ResponseEntity<?> planifier(@RequestBody Map<String, Object> payload) {
        payload.put("statut", Maintenance.StatutMaintenance.PLANIFIEE.name());
        return creer(payload);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> mettreAJour(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        Maintenance maintenance = maintenanceRepository.findById(id).orElse(null);
        if (maintenance == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Maintenance non trouvée"));
        }

        if (payload.containsKey("description")) {
            maintenance.setDescription((String) payload.get("description"));
        }

        if (payload.containsKey("date") && payload.get("date") != null) {
            maintenance.setDate(LocalDate.parse((String) payload.get("date")));
        }

        if (payload.containsKey("type") && payload.get("type") != null) {
            maintenance.setType(Maintenance.TypeMaintenance.valueOf((String) payload.get("type")));
        }

        if (payload.containsKey("statut") && payload.get("statut") != null) {
            maintenance.setStatut(Maintenance.StatutMaintenance.valueOf((String) payload.get("statut")));
        }

        if (payload.containsKey("technicienId")) {
            String technicienId = (String) payload.get("technicienId");
            if (technicienId == null || technicienId.isBlank()) {
                maintenance.setTechnicien(null);
            } else {
                TechnicienMaintenance tech = technicienMaintenanceRepository.findById(technicienId).orElse(null);
                maintenance.setTechnicien(tech);
            }
        }

        return ResponseEntity.ok(maintenanceRepository.save(maintenance));
    }

    @PutMapping("/{id}/effectuer")
    public ResponseEntity<?> effectuer(@PathVariable String id) {
        Maintenance maintenance = maintenanceRepository.findById(id).orElse(null);
        if (maintenance == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Maintenance non trouvée"));
        }
        maintenance.setStatut(Maintenance.StatutMaintenance.EN_COURS);
        return ResponseEntity.ok(maintenanceRepository.save(maintenance));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<?> changerStatut(@PathVariable String id, @RequestParam String statut) {
        Maintenance maintenance = maintenanceRepository.findById(id).orElse(null);
        if (maintenance == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Maintenance non trouvée"));
        }
        maintenance.setStatut(Maintenance.StatutMaintenance.valueOf(statut));
        return ResponseEntity.ok(maintenanceRepository.save(maintenance));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        if (!maintenanceRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        maintenanceRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
