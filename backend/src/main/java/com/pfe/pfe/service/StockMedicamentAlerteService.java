package com.pfe.pfe.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.Medicament;
import com.pfe.pfe.model.Pharmacien;
import com.pfe.pfe.model.StockMedicament;
import com.pfe.pfe.repository.AdministrateurCliniqueRepository;
import com.pfe.pfe.repository.PharmacienRepository;
import com.pfe.pfe.repository.StockMedicamentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class StockMedicamentAlerteService {

    private final PharmacienRepository pharmacienRepository;
    private final StockMedicamentRepository stockMedicamentRepository;
    private final AdministrateurCliniqueRepository administrateurCliniqueRepository;
    private final NotificationMetierService notificationMetierService;
    private final AlerteEmailService alerteEmailService;

    /**
     * Notifie les pharmaciens et admins lorsque le stock passe sous le seuil (transition).
     */
    public void notifierSiStockDevenuFaible(StockMedicament stock, Integer quantiteAvant, Integer seuilAvant) {
        if (stock == null || stock.getQuantite() == null || stock.getSeuilAlerte() == null) {
            return;
        }
        int seuil = stock.getSeuilAlerte();
        int q = stock.getQuantite();
        int qAvant = quantiteAvant != null ? quantiteAvant : seuil + 1;
        int sAvant = seuilAvant != null ? seuilAvant : seuil;
        boolean etaitFaible = qAvant <= sAvant;
        boolean estFaible = q <= seuil;
        if (!estFaible || etaitFaible) {
            return;
        }
        Clinique clinique = stock.getClinique();
        if (clinique == null || !StringUtils.hasText(clinique.getId())) {
            log.debug("Stock faible sans clinique liée, pas de notification pharmacien.");
            return;
        }
        notifierDestinatairesStockFaible(stock, buildMessage(stock));
    }

    /** Renvoi manuel e-mail + notification pour un stock déjà en alerte. */
    public void renvoyerAlerteStockFaible(String stockId) {
        StockMedicament stock = stockMedicamentRepository.findById(stockId)
                .orElseThrow(() -> new IllegalArgumentException("Stock non trouvé"));
        int q = stock.getQuantite() == null ? 0 : stock.getQuantite();
        int seuil = stock.getSeuilAlerte() == null ? 0 : stock.getSeuilAlerte();
        if (q > seuil) {
            throw new IllegalStateException("Le stock n'est pas en alerte (quantité > seuil).");
        }
        notifierDestinatairesStockFaible(stock, buildMessage(stock));
    }

    private String buildMessage(StockMedicament stock) {
        Medicament med = stock.getMedicament();
        String nomMed = med != null && StringUtils.hasText(med.getNom()) ? med.getNom() : "Médicament";
        int q = stock.getQuantite() == null ? 0 : stock.getQuantite();
        int seuil = stock.getSeuilAlerte() == null ? 0 : stock.getSeuilAlerte();
        return String.format("%s — quantité %d (seuil %d). Lot : %s.", nomMed, q, seuil,
                stock.getLot() != null ? stock.getLot() : "—");
    }

    private void notifierDestinatairesStockFaible(StockMedicament stock, String message) {
        Clinique clinique = stock.getClinique();
        if (clinique == null || !StringUtils.hasText(clinique.getId())) {
            throw new IllegalStateException("Stock sans clinique associée.");
        }
        List<Pharmacien> pharmaciens = pharmacienRepository.findByCliniqueId(clinique.getId());
        for (Pharmacien p : pharmaciens) {
            if (p == null || !StringUtils.hasText(p.getId())) {
                continue;
            }
            notificationMetierService.notifyPharmacienStockFaible(p.getId(), message);
            if (StringUtils.hasText(p.getEmail())) {
                alerteEmailService.envoyerAlerteSiPossible(p.getEmail(), "[Clinix] Alerte stock pharmacie",
                        "Stock médicament faible",
                        message + "\nConnectez-vous à l'espace pharmacie pour réapprovisionner.");
            }
        }
        administrateurCliniqueRepository.findByCliniqueIdAndActifTrue(clinique.getId()).forEach(admin -> {
            if (admin == null || !StringUtils.hasText(admin.getId())) {
                return;
            }
            notificationMetierService.notifyAdminCliniqueStockFaible(null, admin.getId(), message, null);
            if (StringUtils.hasText(admin.getEmail())) {
                alerteEmailService.envoyerAlerteSiPossible(admin.getEmail(), "[Clinix] Alerte stock pharmacie",
                        "Stock médicament faible", message + "\nConsultez la pharmacie pour réapprovisionner.");
            }
        });
    }
}
