package com.pfe.pfe.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Medicament;
import com.pfe.pfe.model.StockMedicament;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.MedicamentRepository;
import com.pfe.pfe.repository.StockMedicamentRepository;
import com.pfe.pfe.service.StockMedicamentAlerteService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StockMedicamentController {

    private final StockMedicamentRepository stockRepository;
    private final MedicamentRepository medicamentRepository;
    private final CliniqueRepository cliniqueRepository;
    private final StockMedicamentAlerteService stockMedicamentAlerteService;

    @GetMapping
    public ResponseEntity<List<StockMedicament>> lister(@RequestParam(required = false) String cliniqueId) {
        if (cliniqueId == null || cliniqueId.isBlank()) {
            return ResponseEntity.ok(stockRepository.findAll());
        }
        return ResponseEntity.ok(stockRepository.findByCliniqueId(cliniqueId));
    }

    @GetMapping("/bas")
    public ResponseEntity<List<StockMedicament>> listerStockBas(@RequestParam(required = false) String cliniqueId) {
        List<StockMedicament> source = (cliniqueId == null || cliniqueId.isBlank())
                ? stockRepository.findAll()
                : stockRepository.findByCliniqueId(cliniqueId);

        List<StockMedicament> low = source.stream()
                .filter(s -> s.getQuantite() != null && s.getSeuilAlerte() != null && s.getQuantite() <= s.getSeuilAlerte())
                .toList();

        return ResponseEntity.ok(low);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockMedicament> detail(@PathVariable String id) {
        return stockRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> payload) {
        String medicamentId = (String) payload.get("medicamentId");
        if (medicamentId == null || medicamentId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "medicamentId est obligatoire"));
        }

        Medicament medicament = medicamentRepository.findById(medicamentId).orElse(null);
        if (medicament == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Médicament non trouvé"));
        }

        StockMedicament stock = new StockMedicament();
        stock.setMedicament(medicament);
        stock.setLot((String) payload.getOrDefault("lot", "LOT-STD"));
        stock.setQuantite(Integer.parseInt(payload.getOrDefault("quantite", 0).toString()));
        stock.setSeuilAlerte(Integer.parseInt(payload.getOrDefault("seuilAlerte", 10).toString()));

        String dateExpiration = (String) payload.get("dateExpiration");
        stock.setDateExpiration((dateExpiration == null || dateExpiration.isBlank())
                ? LocalDate.now().plusMonths(6)
                : LocalDate.parse(dateExpiration));

        String cliniqueId = (String) payload.get("cliniqueId");
        if (cliniqueId != null && !cliniqueId.isBlank()) {
            Clinique clinique = cliniqueRepository.findById(cliniqueId).orElse(null);
            stock.setClinique(clinique);
        }

        StockMedicament saved = stockRepository.save(stock);
        stockMedicamentAlerteService.notifierSiStockDevenuFaible(saved, null, null);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> modifier(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        StockMedicament stock = stockRepository.findById(id).orElse(null);
        if (stock == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Stock non trouvé"));
        }

        int q0 = stock.getQuantite() == null ? 0 : stock.getQuantite();
        int s0 = stock.getSeuilAlerte() == null ? 0 : stock.getSeuilAlerte();

        if (payload.containsKey("quantite") && payload.get("quantite") != null) {
            stock.setQuantite(Integer.parseInt(payload.get("quantite").toString()));
        }

        if (payload.containsKey("seuilAlerte") && payload.get("seuilAlerte") != null) {
            stock.setSeuilAlerte(Integer.parseInt(payload.get("seuilAlerte").toString()));
        }

        if (payload.containsKey("lot") && payload.get("lot") != null) {
            stock.setLot(payload.get("lot").toString());
        }

        if (payload.containsKey("dateExpiration") && payload.get("dateExpiration") != null) {
            stock.setDateExpiration(LocalDate.parse(payload.get("dateExpiration").toString()));
        }

        StockMedicament saved = stockRepository.save(stock);
        stockMedicamentAlerteService.notifierSiStockDevenuFaible(saved, q0, s0);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        if (!stockRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        stockRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/entree")
    public ResponseEntity<?> entreeStock(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        StockMedicament stock = stockRepository.findById(id).orElse(null);
        if (stock == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Stock non trouvé"));
        }

        int quantite = Integer.parseInt(payload.getOrDefault("quantite", 0).toString());
        if (quantite <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "La quantité d'entrée doit être > 0"));
        }

        int q0 = stock.getQuantite() == null ? 0 : stock.getQuantite();
        int s0 = stock.getSeuilAlerte() == null ? 0 : stock.getSeuilAlerte();

        stock.setQuantite((stock.getQuantite() == null ? 0 : stock.getQuantite()) + quantite);
        StockMedicament saved = stockRepository.save(stock);
        stockMedicamentAlerteService.notifierSiStockDevenuFaible(saved, q0, s0);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/sortie")
    public ResponseEntity<?> sortieStock(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        StockMedicament stock = stockRepository.findById(id).orElse(null);
        if (stock == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Stock non trouvé"));
        }

        int quantite = Integer.parseInt(payload.getOrDefault("quantite", 0).toString());
        if (quantite <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "La quantité de sortie doit être > 0"));
        }

        int actuelle = stock.getQuantite() == null ? 0 : stock.getQuantite();
        if (actuelle < quantite) {
            return ResponseEntity.badRequest().body(Map.of("message", "Stock insuffisant"));
        }

        int q0 = actuelle;
        int s0 = stock.getSeuilAlerte() == null ? 0 : stock.getSeuilAlerte();

        stock.setQuantite(actuelle - quantite);
        StockMedicament saved = stockRepository.save(stock);
        stockMedicamentAlerteService.notifierSiStockDevenuFaible(saved, q0, s0);
        return ResponseEntity.ok(saved);
    }

    /** Renvoie e-mail + notifications pour un stock en alerte (admin clinique / pharmacien). */
    @PostMapping("/{id}/alerte-email")
    public ResponseEntity<?> renvoyerAlerteEmail(@PathVariable String id) {
        try {
            stockMedicamentAlerteService.renvoyerAlerteStockFaible(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
