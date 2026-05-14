package com.pfe.pfe.billing;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.pfe.pfe.billing.crypto.FieldCipher;
import com.pfe.pfe.model.AbonnementClinique;
import com.pfe.pfe.model.Clinique;
import com.pfe.pfe.model.OffreAbonnement;
import com.pfe.pfe.model.PlatformStripeConfig;
import com.pfe.pfe.repository.AbonnementCliniqueRepository;
import com.pfe.pfe.repository.CliniqueRepository;
import com.pfe.pfe.repository.OffreAbonnementRepository;
import com.pfe.pfe.repository.PlatformStripeConfigRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BillingManagementService {

    private final OffreAbonnementRepository offreRepository;
    private final AbonnementCliniqueRepository abonnementRepository;
    private final CliniqueRepository cliniqueRepository;
    private final PlatformStripeConfigRepository platformStripeConfigRepository;
    private final FieldCipher fieldCipher;
    private final StripeOfferSyncService stripeOfferSyncService;

    public List<OffreAbonnement> listAllOffers() {
        return offreRepository.findAllByOrderByOrdreAffichageAsc();
    }

    public List<OffreAbonnement> listActiveClinicOffers() {
        return offreRepository.findByActifTrueAndCategorieOrderByOrdreAffichageAsc(BillingConstants.CAT_CLINIQUE);
    }

    public Optional<AbonnementClinique> getCurrentSubscription(String cliniqueId) {
        return abonnementRepository.findByCliniqueIdOrderByDateCreationDesc(cliniqueId).stream().findFirst();
    }

    public List<AbonnementClinique> getSubscriptionHistory(String cliniqueId) {
        return abonnementRepository.findByCliniqueIdOrderByDateCreationDesc(cliniqueId);
    }

    /** Abonnements clinique au statut ACTIF (toutes cliniques), pour le super administrateur. */
    public List<AbonnementClinique> listActiveSubscriptionsForSuperAdmin() {
        return abonnementRepository.findByStatutForSuperAdmin("ACTIF");
    }

    /** Tous les abonnements avec montant payé strictement positif, pour le super administrateur. */
    public List<AbonnementClinique> listPaidSubscriptionsForSuperAdmin() {
        return abonnementRepository.findPaidSubscriptionsOrderByDateCreationDesc(BigDecimal.ZERO);
    }

    @Transactional
    public OffreAbonnement createOffer(OffreAbonnement o) {
        normalizeOffer(o);
        return offreRepository.save(o);
    }

    @Transactional
    public OffreAbonnement updateOffer(String id, OffreAbonnement patch) {
        OffreAbonnement o = offreRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Offre introuvable"));
        if (patch.getNom() != null) {
            o.setNom(patch.getNom());
        }
        if (patch.getDescription() != null) {
            o.setDescription(patch.getDescription());
        }
        if (patch.getPrixMensuel() != null) {
            o.setPrixMensuel(patch.getPrixMensuel());
        }
        if (patch.getPrixAnnuel() != null) {
            o.setPrixAnnuel(patch.getPrixAnnuel());
        }
        if (patch.getSmsGratuitsInclus() != null) {
            o.setSmsGratuitsInclus(patch.getSmsGratuitsInclus());
        }
        if (patch.getDureeMois() != null) {
            o.setDureeMois(patch.getDureeMois());
        }
        if (patch.getPopular() != null) {
            o.setPopular(patch.getPopular());
        }
        if (patch.getOrdreAffichage() != null) {
            o.setOrdreAffichage(patch.getOrdreAffichage());
        }
        if (patch.getActif() != null) {
            o.setActif(patch.getActif());
        }
        if (patch.getCategorie() != null) {
            o.setCategorie(patch.getCategorie());
        }
        if (patch.getPeriodeEssaiJours() != null) {
            o.setPeriodeEssaiJours(patch.getPeriodeEssaiJours());
        }
        if (patch.getNombreChambresMax() != null) {
            o.setNombreChambresMax(patch.getNombreChambresMax());
        }
        if (patch.getNombrePersonnelMax() != null) {
            o.setNombrePersonnelMax(patch.getNombrePersonnelMax());
        }
        if (patch.getNombrePatientsMax() != null) {
            o.setNombrePatientsMax(patch.getNombrePatientsMax());
        }
        if (patch.getNombreRendezVousMax() != null) {
            o.setNombreRendezVousMax(patch.getNombreRendezVousMax());
        }
        normalizeOffer(o);
        return offreRepository.save(o);
    }

    @Transactional
    public void deleteOffer(String id) {
        offreRepository.deleteById(id);
    }

    @Transactional
    public AbonnementClinique simulateSubscribe(String cliniqueId, String offreId, String interval) {
        Clinique c = cliniqueRepository.findById(cliniqueId).orElseThrow(() -> new IllegalArgumentException("Clinique introuvable"));
        OffreAbonnement offre = offreRepository.findById(offreId).orElseThrow(() -> new IllegalArgumentException("Offre introuvable"));
        if (!Boolean.TRUE.equals(offre.getActif())) {
            throw new IllegalStateException("Offre inactive");
        }

        BigDecimal montant = BillingConstants.INTERVAL_YEARLY.equalsIgnoreCase(interval)
                && offre.getPrixAnnuel() != null
                && offre.getPrixAnnuel().signum() > 0
                ? offre.getPrixAnnuel()
                : offre.getPrixMensuel();

        Integer dureeMois = offre.getDureeMois();
        long mois = dureeMois != null ? dureeMois.longValue() : 1L;
        LocalDate debut = LocalDate.now();
        LocalDate fin = debut.plusMonths(BillingConstants.INTERVAL_YEARLY.equalsIgnoreCase(interval) ? 12 : mois);

        AbonnementClinique a = new AbonnementClinique();
        a.setClinique(c);
        a.setOffre(offre);
        a.setDateDebut(debut);
        a.setDateFin(fin);
        a.setMontantPaye(montant != null ? montant : BigDecimal.ZERO);
        a.setStatut("ACTIF");
        a.setPeriodeFacturation(BillingConstants.INTERVAL_YEARLY.equalsIgnoreCase(interval)
                ? BillingConstants.INTERVAL_YEARLY
                : BillingConstants.INTERVAL_MONTHLY);
        return abonnementRepository.save(a);
    }

    public PlatformStripeConfig getStripeConfigForAdmin() {
        return platformStripeConfigRepository.findById(BillingConstants.CONFIG_SINGLETON_ID)
                .orElseGet(() -> {
                    PlatformStripeConfig cfg = new PlatformStripeConfig();
                    cfg.setId(BillingConstants.CONFIG_SINGLETON_ID);
                    cfg.setModeFacturation(BillingConstants.MODE_TEST);
                    return platformStripeConfigRepository.save(cfg);
                });
    }

    @Transactional
    public PlatformStripeConfig updateStripeConfig(String mode, String publishableKey, String secretKey, String webhookSecret) {
        PlatformStripeConfig cfg = getStripeConfigForAdmin();
        if (StringUtils.hasText(mode)) {
            String m = mode.trim().toUpperCase();
            if (BillingConstants.MODE_LIVE.equals(m) || BillingConstants.MODE_TEST.equals(m)) {
                cfg.setModeFacturation(m);
            }
        }
        if (publishableKey != null) {
            cfg.setPublishableKey(publishableKey.isBlank() ? null : publishableKey.trim());
        }
        if (StringUtils.hasText(secretKey)) {
            if (!fieldCipher.isEnabled()) {
                throw new IllegalStateException(
                        "Définissez stripe.field-encryption-secret dans le backend pour enregistrer une clé secrète chiffrée, ou utilisez la variable d'environnement STRIPE_SECRET_KEY.");
            }
            cfg.setSecretKeyEnc(fieldCipher.encrypt(secretKey.trim()));
        }
        if (StringUtils.hasText(webhookSecret)) {
            if (!fieldCipher.isEnabled()) {
                throw new IllegalStateException(
                        "Définissez stripe.field-encryption-secret pour stocker le secret webhook, ou STRIPE_WEBHOOK_SECRET en variable d'environnement.");
            }
            cfg.setWebhookSecretEnc(fieldCipher.encrypt(webhookSecret.trim()));
        }
        cfg.setMiseAJour(java.time.LocalDateTime.now());
        return platformStripeConfigRepository.save(cfg);
    }

    public OffreAbonnement syncStripePrices(String offreId) {
        return stripeOfferSyncService.syncProductAndPrices(offreId);
    }

    private void normalizeOffer(OffreAbonnement o) {
        if (!StringUtils.hasText(o.getNom())) {
            throw new IllegalArgumentException("Le nom de l'offre est obligatoire.");
        }
        if (!StringUtils.hasText(o.getCategorie())) {
            o.setCategorie(BillingConstants.CAT_CLINIQUE);
        }

        o.setCategorie(o.getCategorie().trim().toUpperCase());
        if (!BillingConstants.CAT_CLINIQUE.equals(o.getCategorie())
                && !BillingConstants.CAT_CABINET_MEDICAL.equals(o.getCategorie())) {
            throw new IllegalArgumentException("Catégorie d'offre invalide.");
        }

        o.setPrixMensuel(nonNegativeMoney(o.getPrixMensuel()));
        o.setPrixAnnuel(nonNegativeMoney(o.getPrixAnnuel()));
        o.setSmsGratuitsInclus(nonNegativeInt(o.getSmsGratuitsInclus()));
        o.setNombreChambresMax(nonNegativeInt(o.getNombreChambresMax()));
        o.setNombrePersonnelMax(nonNegativeInt(o.getNombrePersonnelMax()));
        o.setNombrePatientsMax(nonNegativeInt(o.getNombrePatientsMax()));
        o.setNombreRendezVousMax(nonNegativeInt(o.getNombreRendezVousMax()));
        o.setPeriodeEssaiJours(nonNegativeInt(o.getPeriodeEssaiJours()));
        o.setDureeMois(Math.max(1, nonNegativeInt(o.getDureeMois())));
        o.setOrdreAffichage(nonNegativeInt(o.getOrdreAffichage()));
        o.setPopular(Boolean.TRUE.equals(o.getPopular()));
        o.setActif(o.getActif() == null || o.getActif());

        if (BillingConstants.CAT_CLINIQUE.equals(o.getCategorie())) {
            o.setNombrePatientsMax(0);
            o.setNombreRendezVousMax(0);
        } else {
            o.setSmsGratuitsInclus(0);
            o.setNombreChambresMax(0);
        }
    }

    private BigDecimal nonNegativeMoney(BigDecimal value) {
        if (value == null || value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value;
    }

    private Integer nonNegativeInt(Integer value) {
        if (value == null || value < 0) {
            return 0;
        }
        return value;
    }
}
