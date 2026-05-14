package com.pfe.pfe.billing;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.pfe.pfe.billing.config.BillingAppProperties;
import com.pfe.pfe.model.OffreAbonnement;
import com.pfe.pfe.repository.OffreAbonnementRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Price;
import com.stripe.model.Product;
import com.stripe.param.PriceCreateParams;
import com.stripe.param.ProductCreateParams;
import com.stripe.param.ProductUpdateParams;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeOfferSyncService {

    private final OffreAbonnementRepository offreRepository;
    private final StripeCredentialsService stripeCredentialsService;
    private final BillingAppProperties billingAppProperties;

    /**
     * Crée ou met à jour le produit Stripe + deux prix récurrents (mensuel / annuel).
     */
    public OffreAbonnement syncProductAndPrices(String offreId) {
        try {
            Stripe.apiKey = stripeCredentialsService.resolveSecretKey();

            OffreAbonnement o = offreRepository.findById(offreId)
                    .orElseThrow(() -> new IllegalArgumentException("Offre introuvable"));

            String currency = billingAppProperties.getStripeCurrency().toLowerCase();
            Map<String, String> meta = new HashMap<>();
            meta.put("offreId", o.getId());
            meta.put("categorie", o.getCategorie());

            Product product;
            if (StringUtils.hasText(o.getStripeProductId())) {
                product = Product.retrieve(o.getStripeProductId());
                ProductUpdateParams up = ProductUpdateParams.builder()
                        .setName(o.getNom())
                        .setDescription(o.getDescription())
                        .putAllMetadata(meta)
                        .build();
                product = product.update(up);
            } else {
                ProductCreateParams pc = ProductCreateParams.builder()
                        .setName(o.getNom())
                        .setDescription(o.getDescription() != null ? o.getDescription() : "")
                        .putAllMetadata(meta)
                        .build();
                product = Product.create(pc);
                o.setStripeProductId(product.getId());
            }

            long monthlyMinor = StripeMinorAmountUtil.toMinorUnits(nz(o.getPrixMensuel()), currency);
            long yearlyMinor = StripeMinorAmountUtil.toMinorUnits(nz(o.getPrixAnnuel()), currency);

            if (yearlyMinor <= 0) {
                yearlyMinor = StripeMinorAmountUtil.toMinorUnits(nz(o.getPrixMensuel()).multiply(BigDecimal.valueOf(12)),
                        currency);
            }

            if (!StringUtils.hasText(o.getStripePriceMensuelId())
                    || shouldRecreatePrice(o.getStripePriceMensuelId(), monthlyMinor, currency, "month")) {
                PriceCreateParams p = PriceCreateParams.builder()
                        .setProduct(product.getId())
                        .setCurrency(currency)
                        .setUnitAmount(monthlyMinor)
                        .setRecurring(PriceCreateParams.Recurring.builder()
                                .setInterval(PriceCreateParams.Recurring.Interval.MONTH)
                                .build())
                        .putMetadata("offreId", o.getId())
                        .putMetadata("interval", "month")
                        .build();
                Price created = Price.create(p);
                o.setStripePriceMensuelId(created.getId());
            }

            if (!StringUtils.hasText(o.getStripePriceAnnuelId())
                    || shouldRecreatePrice(o.getStripePriceAnnuelId(), yearlyMinor, currency, "year")) {
                PriceCreateParams p = PriceCreateParams.builder()
                        .setProduct(product.getId())
                        .setCurrency(currency)
                        .setUnitAmount(yearlyMinor)
                        .setRecurring(PriceCreateParams.Recurring.builder()
                                .setInterval(PriceCreateParams.Recurring.Interval.YEAR)
                                .build())
                        .putMetadata("offreId", o.getId())
                        .putMetadata("interval", "year")
                        .build();
                Price created = Price.create(p);
                o.setStripePriceAnnuelId(created.getId());
            }

            return offreRepository.save(o);
        } catch (StripeException e) {
            throw new IllegalStateException("Erreur Stripe (produits/prix) : " + e.getMessage(), e);
        }
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    private boolean shouldRecreatePrice(String priceId, long expectedMinor, String expectedCurrency, String expectedInterval) {
        try {
            Price existing = Price.retrieve(priceId);
            if (existing == null) {
                return true;
            }
            Long unitAmount = existing.getUnitAmount();
            String currency = existing.getCurrency();
            String interval = existing.getRecurring() != null ? existing.getRecurring().getInterval() : null;

            return unitAmount == null
                    || !Long.valueOf(expectedMinor).equals(unitAmount)
                    || currency == null
                    || !expectedCurrency.equalsIgnoreCase(currency)
                    || interval == null
                    || !expectedInterval.equalsIgnoreCase(interval);
        } catch (StripeException e) {
            return true;
        }
    }
}
